var jsCore = require('../js.class/core');
require('../underscore');

var JS = jsCore.JS,
MemoryBackend = new JS.Class({
  initialize: function(app) {
    this.app = app;
    this.channels = {};
  },
  exists: function(channelId) {
    return !!this.channels[channelId];
  },
  numSubscribers: function(channelId) {
    return this.channels[channelId].numSubscribers();
  },
  numMessages: function(channelId) {
    return this.channels[channelId].numMessages();
  },
  anyMessages: function(channelId) {
    return this.numMessages(channelId) > 0;
  },
  create: function(channelId) {
    this.channels[channelId] = new this.app.m.Channel(channelId);
  },
  subscribe: function(channelId, client) {
    this.channels[channelId].subscribe(client);
  },
  unsubscribe: function(channelId, client) {
    this.channels[channelId].unsubscribe(client);
  },
  subscribers: function(channelId) {
    return this.channels[channelId].subscribers;
  },
  eachSubscriber: function(channelId, subscriberCallback) {
    _(this.channels[channelId].subscribers).each(function(subscriber) {
      subscriberCallback(subscriber);
    });
  },
  addMessage: function(channelId, message) {
    this.channels[channelId].messages.unshift(message);
  },
  eachMessage: function(channelId, messageCallback) {
    _(this.channels[channelId].messages).chain().reverse().each(function(message) {
      messageCallback(message);
    });
  },
  lastMessage: function(channelId) {
    return _(this.channels[channelId].messages).last();
  },
  popMessage: function(channelId) {
    return this.channels[channelId].messages.pop();
  },
  createChannel: function(channelId) {
    this.channels[channelId] = new this.app.m.Channel(channelId);
  },
  deleteChannel: function(channelId) {
    delete this.channels[channelId];
  }
});

exports.load = function(app) {
  return new MemoryBackend(app);
};