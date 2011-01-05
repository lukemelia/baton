var jsCore = require('../../lib/js.class/core');
require('../../lib/underscore');

var JS = jsCore.JS,
ChannelManager = new JS.Class({
  initialize: function(app, configuration) {
    this.app = app;
    this.configuration = configuration;
    this.subscriberMessages = {};
    if (configuration.backend == 'memory') {
      this.backend = require('../../lib/backends/memory_backend').load(this.app);
    }
  },
  exists: function(channelId) {
    return this.backend.exists(channelId);
  },
  create: function(channelId) {
    if (this.exists(channelId)) {
      return false;
    } else {
      this.backend.create(channelId);
      return true;
    }
  },
  numSubscribers: function(channelId) {
    this.app.logger.debug("numSubscribers(" + channelId + ")");
    if (this.exists(channelId)) {
      var numSubs = this.backend.numSubscribers(channelId);
      this.app.logger.debug("num subs: " + numSubs);
      return numSubs;
    } else {
      return null;
    }
  },
  numMessages: function(channelId) {
    this.app.logger.debug("numMessages(" + channelId + ")");
    if (this.exists(channelId)) {
      var numMessages  = this.backend.numMessages(channelId);
      this.app.logger.debug(numMessages);
      return numMessages;
    } else {
      this.app.logger.debug('null');
      return null;
    }
  },
  ensureCreated: function(channelId) {
    this.create(channelId);
  },
  publish: function(message) {
    this.app.logger.debug("publish(" + message.toString() + ")");

    this.app.logger.debug("this.configuration.storeMessages = " + this.configuration.storeMessages);
    if (this.configuration.storeMessages) {
      this.addToChannelMessageQueue(message);
    }

    var _this = this,
        immediatePublishCount = 0;
    if (this.exists(message.channelId)) {
      this.backend.eachSubscriber(message.channelId, function(client) {
        if (!_this.subscriberMessages[client]) {
          _this.subscriberMessages[client] = [];
        }
        _this.subscriberMessages[client].unshift(message);
        immediatePublishCount += 1;
      });
    }
    return immediatePublishCount;
  },
  addToChannelMessageQueue: function(message) {
    var channelId = message.channelId;
    this.app.logger.debug("addToChannelMessageQueue(" + channelId + ", '" + message.body + "')");
    if (!this.exists(channelId)) {
      this.backend.createChannel(channelId);
    }
    if (this.backend.anyMessages(channelId) && this.backend.lastMessage(channelId).timestamp.to_i == message.timestamp.to_i) {
      message.incrementTimestamp();
    }
    this.backend.addMessage(channelId, message);

    if (this.backend.numMessages(channelId) > this.configuration.maxMessages) {
      this.backend.popMessage(channelId);
    }
    this.app.logger.debug("completed addToChannelMessageQueue(" + channelId + ", '" + message.body + "')");
  },
  registerSubscriber: function(channelId, client, since) {
    this.app.logger.debug("registerSubscriber(" + channelId + ", client{" + client.sessionId + "}, " + since + ")");

    this.ensureCreated(channelId);
    this.backend.subscribe(channelId, client);
    client.subscribedChannels.push(channelId);
    client.send("SUBSCRIBED " + channelId);

    if (!since) {
      since = new Date(0);
    } else {
      since = new Date(parseFloat(since));
    }
    this.deliverQueuedMessages(channelId, client, since);

    return true;
  },
  unregisterSubscriber: function(client) {
    var _this = this;
    _(client.subscribedChannels).each(function(channelId){
      if (_this.exists(channelId)) {
        _this.backend.unsubscribe(channelId, client);
      }
    });
    client.subscribedChannels = [];
  },
  deliverQueuedMessages: function(channelId, client, since) {
    this.app.logger.debug("deliverQueuedMessages(" + channelId + ", client{" + client.sessionId + "}, " + since.toString() + ")");
    if (!this.exists(channelId) || !this.backend.anyMessages(channelId)) {
      this.app.logger.debug("No messages queued for channel " + channelId + ".");
      return;
    }
    var _this = this;
    this.backend.eachMessage(channelId, function(message){
      if (message.timestamp > since) {
        _this.sendMessage(client, message);
      }
    });
  },
  sendMessage: function(client, message) {
    client.send(message.toString());
    this.app.logger.debug("sent " + message.toString() + " to client{" + client.sessionId + "})");
  },
  popSubscriberMessage: function(client) {
    if (this.subscriberMessages[client] && this.subscriberMessages[client].length > 0) {
      return this.subscriberMessages[client].pop();
    } else {
      return null;
    }
  },
  deleteChannel: function(channelId) {
    this.app.logger.debug("deleteChannel(" + channelId + ")");
    if (!this.exists(channelId)) { return false; }
    this.initiateChannelUnsubscribes(channelId, 'CHANNEL DELETED');
    this.backend.deleteChannel(channelId);
    return true;
  },
  initiateChannelUnsubscribes: function(channelId, reason) {
    this.app.logger.debug("initiateChannelUnsubscribes(" + channelId + ")");
    if (!this.exists(channelId)) { return; }
    var _this = this;

    this.app.logger.debug("typeof this.backend.subscribers(channelId): " + typeof this.backend.subscribers(channelId));
    _.each(this.backend.subscribers(channelId), function(client) {
      process.nextTick(function () {
        client.subscribedChannels = _(client.subscribedChannels).reject(function(el){ return el == channelId; });
        client.send("UNSUBSCRIBED " + channelId + ' (' + reason + ')');
      });
    });
  },
  popAndSendSubscriberMessage: function(client) {
    var message = this.popSubscriberMessage(client);
    if (message) {
      this.sendMessage(client, message);
    }
  }
});
exports.load = function(app) {
  return ChannelManager;
};

