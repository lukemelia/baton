var jsCore = require('../../lib/js.class/core');
require('../../lib//underscore');

exports.createChannelManager = function(configuration) {
  return new ChannelManager(configuration);
};

var JS = jsCore.JS,
ChannelManager = new JS.Class({
  initialize: function(configuration) {
    this.configuration = configuration;
    this.channelSubscribers = {};
    this.channelMessages = {};
    this.subscriberMessages = {};
    this.sessionDisconnects = [];
  },
  exists: function(channelId) {
    return (!!this.channelSubscribers[channelId]);
  },
  create: function(channelId) {
    if (this.exists(channelId)) {
      return false;
    } else {
      this.channelSubscribers[channelId] = [];
      this.subscriberMessages[channelId] = [];
      return true;
    }
  },
  numSubscribers: function(channelId) {
    console.log("numSubscribers(" + channelId + ")");
    if (this.exists(channelId)) {
      console.log("num subs: " + this.channelSubscribers[channelId].length);
      return this.channelSubscribers[channelId].length;
    } else {
      return null;
    }
  },
  numMessages: function(channelId) {
    console.log("numMessages(" + channelId + ")");
    if (this.exists(channelId)) {
      if (this.channelMessages[channelId]) {
        return this.channelMessages[channelId].length;
      } else {
        return 0;
      }
    } else {
      return null;
    }
  },
  ensureCreated: function(channelId) {
    this.create(channelId);
  },
  publish: function(message) {
    console.log("publish(" + message.toString() + ")");

    console.log("this.configuration.storeMessages = " + this.configuration.storeMessages);
    if (this.configuration.storeMessages) {
      this.addToChannelMessageQueue(message);
    }

    var _this = this,
        immediatePublishCount = 0;
    if (this.channelSubscribers[message.channelId]) {
      _(this.channelSubscribers[message.channelId] || []).each(function(client) {
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
    console.log("addToChannelMessageQueue(" + message.channelId + ", '" + message.body + "')");
    if (!this.channelMessages[message.channelId]) {
      this.channelMessages[message.channelId] = [];
    }
    var channelMessageQueue = this.channelMessages[message.channelId];
    if (channelMessageQueue.length > 0 && _(channelMessageQueue).last().timestamp.to_i == message.timestamp.to_i) {
      message.incrementTimestamp();
    }
    channelMessageQueue.unshift(message);
    console.log("this.channelMessages[" + message.channelId + "].length = " + this.channelMessages[message.channelId].length);
    if (channelMessageQueue.length > this.configuration.maxMessages) {
      channelMessageQueue.pop();
    }
    console.log("completed addToChannelMessageQueue(" + message.channelId + ", '" + message.body + "')");
  },
  registerSubscriber: function(channelId, client, since) {
    console.log("registerSubscriber(" + channelId + ", client{" + client.sessionId + "}, " + since + ")");

    this.ensureCreated(channelId);
    var subscribers = this.channelSubscribers[channelId];

    subscribers.push(client);
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
      if (_this.channelSubscribers[channelId]) {
        _this.channelSubscribers[channelId] = _(_this.channelSubscribers[channelId]).reject(function(el) { return el === client; });
      }
    });
    client.subscribedChannels = [];
  },
  deliverQueuedMessages: function(channelId, client, since) {
    console.log("deliverQueuedMessages(" + channelId + ", client{" + client.sessionId + "}, " + since.toString() + ")");
    if (!this.channelMessages[channelId]) return;
    var _this = this;
    _(this.channelMessages[channelId]).chain().reverse().each(function(message) {
      if (message.timestamp > since) {
        _this.sendMessage(client, message);
      }
    });
  },
  sendMessage: function(client, message) {
    client.send(message.toString());
    console.log("sent " + message.toString() + " to client{" + client.sessionId + "})");
  },
  popSubscriberMessage: function(client) {
    if (this.subscriberMessages[client] && this.subscriberMessages[client].length > 0) {
      return this.subscriberMessages[client].pop();
    } else {
      return null;
    }
  },
  deleteChannel: function(channelId) {
    console.log("deleteChannel(" + channelId + ")");
    if (!this.exists(channelId)) { return false; }
    this.initiateChannelUnsubscribes(channelId, 'CHANNEL DELETED');
    delete this.channelSubscribers[channelId];
    delete this.channelMessages[channelId];
    return true;
  },
  initiateChannelUnsubscribes: function(channelId, reason) {
    console.log("initiateChannelUnsubscribes(" + channelId + ")");
    if (!this.exists(channelId)) { return; }
    var _this = this;

    console.log("typeof this.channelSubscribers[channelId]: " + typeof this.channelSubscribers[channelId]);
    _.each(this.channelSubscribers[channelId], function(client) {
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
