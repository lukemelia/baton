var jsCore = require('./js.class/core');
exports.createMessage = function(body, timestamp, contentType) {
  return new Message(body, timestamp, contentType);
};

var JS = jsCore.JS,
Message = new JS.Class({
  initialize: function(body, timestamp, contentType) {
    console.log("Creating message: " + body);
    this.body = body;
    this.timestamp = timestamp;
    this.contentType = contentType;
  }
});

