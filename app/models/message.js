var jsCore = require('../../lib/js.class/core');

exports.createMessage = function(body, channelId, timestamp) {
  return new Message(body, channelId, timestamp);
};

var JS = jsCore.JS,
Message = new JS.Class({
  initialize: function(body, channelId, timestamp) {
    console.log("Creating message: " + channelId + " " + timestamp.getTime().toString() + " " + body);
    this.body = body;
    this.channelId = channelId;
    this.timestamp = timestamp;
  },
  incrementTimestamp: function() {
    this.timestamp = new Date(parseInt(this.timestamp.getTime()) + 1);
  },
  toString: function() {
    return this.channelId + " " + this.timestamp.getTime().toString() + " " + this.body;
  }
});

