var jsCore = require('../../lib/js.class/core');
require('../../lib/underscore');

var JS = jsCore.JS,
ChannelManager = new JS.Class({
  initialize: function(app, configuration) {
    this.app = app;
    this.configuration = configuration;
    this.channels = {};
    this.subscriberMessages = {};
  },
  exists: function(channelId) {
    return (!!this.channels[channelId]);
  },
  create: function(channelId) {
    if (this.exists(channelId)) {
      return false;
    } else {
      this.channels[channelId] = new this.app.m.Channel(channelId);
      return true;
    }
  },
  numSubscribers: function(channelId) {
    this.app.logger.debug("numSubscribers(" + channelId + ")");
    if (this.exists(channelId)) {
      this.app.logger.debug("num subs: " + this.channels[channelId].numSubscribers());
      return this.channels[channelId].numSubscribers();
    } else {
      return null;
    }
  },
  numMessages: function(channelId) {
    this.app.logger.debug("numMessages(" + channelId + ")");
    if (this.exists(channelId)) {
      this.app.logger.debug(this.channels[channelId].numMessages());
      return this.channels[channelId].numMessages();
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
      _(this.channels[message.channelId].subscribers).each(function(client) {
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
      this.channels[channelId] = new this.app.m.Channel(channelId);
    }
    var channel = this.channels[channelId];
    if (channel.numMessages() > 0 && _(channel.messages).last().timestamp.to_i == message.timestamp.to_i) {
      message.incrementTimestamp();
    }
    channel.messages.unshift(message);

    if (channel.numMessages() > this.configuration.maxMessages) {
      channel.messages.pop();
    }
    this.app.logger.debug("completed addToChannelMessageQueue(" + channelId + ", '" + message.body + "')");
  },
  registerSubscriber: function(channelId, client, since) {
    this.app.logger.debug("registerSubscriber(" + channelId + ", client{" + client.sessionId + "}, " + since + ")");

    this.ensureCreated(channelId);
    this.channels[channelId].subscribe(client);
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
        _this.channels[channelId].unsubscribe(client);
      }
    });
    client.subscribedChannels = [];
  },
  deliverQueuedMessages: function(channelId, client, since) {
    this.app.logger.debug("deliverQueuedMessages(" + channelId + ", client{" + client.sessionId + "}, " + since.toString() + ")");
    if (!this.exists(channelId) || this.channels[channelId].numMessages == 0) return;
    var _this = this;
    _(this.channels[channelId].messages).chain().reverse().each(function(message) {
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
    delete this.channels[channelId];
    return true;
  },
  initiateChannelUnsubscribes: function(channelId, reason) {
    this.app.logger.debug("initiateChannelUnsubscribes(" + channelId + ")");
    if (!this.exists(channelId)) { return; }
    var _this = this;

    this.app.logger.debug("typeof this.channels[channelId].subscribers: " + typeof this.channels[channelId].subscribers);
    _.each(this.channels[channelId].subscribers, function(client) {
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

