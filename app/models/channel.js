var jsCore = require('../../lib/js.class/core');
require('../../lib/underscore');

var JS = jsCore.JS,
Channel = new JS.Class({
  initialize: function(channelId) {
    this.channelId = channelId;
    this.subscribers = [];
    this.messages = [];
  },
  numSubscribers: function() {
    return this.subscribers.length;
  },
  numMessages: function() {
    return this.messages.length;
  },
  subscribe: function(client) {
    this.subscribers.push(client);
  },
  unsubscribe: function(client) {
    this.subscribers = _(this.subscribers).reject(function(el) { return el === client; });
  }
});
exports.load = function(app) {
  return Channel;
};

