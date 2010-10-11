var jsCore = require('../../lib/js.class/core');

CHANNEL_CREATED = 'Channel created';
CHANNEL_DELETED = 'Channel deleted';
CHANNEL_EXISTS = 'Channel exists';
CHANNEL_DOES_NOT_EXIST = 'Channel does not exist';
MESSAGE_DELIVERED = 'Message delivered';
MESSAGE_ACCEPTED = 'Message accepted';
HTTP_POST = 'POST';
HTTP_GET = 'GET';
HTTP_PUT = 'PUT';
HTTP_DELETE = 'DELETE';
CHANNEL_SUBSCRIBERS_HEADER = 'X-Channel-Subscribers';
CHANNEL_MESSAGES_HEADER = 'X-Channel-Messages';

var JS = jsCore.JS,
  PublishController = new JS.Class({
    initialize: function(app, configuration, channelManager) {
      this.app = app;
      this.configuration = configuration;
      this.channelManager = channelManager;
    },
    respondWith:function(res, status, message, channelId, numSubscribers, numMessages) {
      console.log(status.toString() + ': ' + message);
      var headers = {'Content-Type': 'text/html'};
      if (numSubscribers === undefined) {
          numSubscribers = this.channelManager.numSubscribers(channelId);
      }
      if (numMessages === undefined) {
          numMessages = this.channelManager.numMessages(channelId);
      }

      if (numSubscribers != null) {
        headers[CHANNEL_SUBSCRIBERS_HEADER] = numSubscribers;
      }
      if (numMessages != null) {
        headers[CHANNEL_MESSAGES_HEADER] = numMessages;
      }

      res.writeHead(status, headers);
      res.write(message);
      res.end();
    },
    handle: function(path, req, res) {
      console.log("publishController#handle: " + req.method + ": " + path);

      var channelId = this.configuration.extractChannelIdFromPublishPath(path);
      if (!channelId) {
        return false;
      }
      console.log("Channel is " + channelId);

      switch(req.method) {
        case HTTP_POST:
          this.handleHttpPost(channelId, req, res);
          return true;
        case HTTP_GET:
          this.handleHttpGet(channelId, res);
          return true;
        case HTTP_PUT:
          this.handleHttpPut(channelId, res);
          return true;
        case HTTP_DELETE:
          this.handleHttpDelete(channelId, res);
          return true;
        default:
          this.respondWith(res, 405, "Unhandled HTTP method: '" + req.method + "'");
      }
      return false;
    },
    handleHttpGet: function(channelId, res) {
      if (this.channelManager.exists(channelId)) {
        this.respondWith(res, 200, CHANNEL_EXISTS, channelId);
      } else {
        this.respondWith(res, 404, CHANNEL_DOES_NOT_EXIST, channelId);
      }
    },
    handleHttpPost: function(channelId, req, res) {
      var _this = this,
          body = '';
      req.on('data', function(chunk) {
        body += chunk;
      });
      req.on('end', function() {
        var message = new _this.app.m.Message(body, channelId, new Date()),
            immediatePublishCount = _this.channelManager.publish(message);

        if (immediatePublishCount > 0) {
          _this.respondWith(res, 201, MESSAGE_DELIVERED, channelId);
        } else {
          _this.respondWith(res, 202, MESSAGE_ACCEPTED, channelId);
        }
      });
    },
    handleHttpPut: function(channelId, res) {
      if (this.channelManager.create(channelId)) {
        this.respondWith(res, 200, CHANNEL_CREATED, channelId);
      } else {
        this.respondWith(res, 200, CHANNEL_EXISTS, channelId);
      }
    },
    handleHttpDelete: function(channelId, res) {
      var numSubscribers = this.channelManager.numSubscribers(channelId),
          numMessages = this.channelManager.numMessages(channelId);
      if (this.channelManager.deleteChannel(channelId)) {
        this.respondWith(res, 200, CHANNEL_DELETED, channelId, numSubscribers, numMessages);
      } else {
        this.respondWith(res, 404, CHANNEL_DOES_NOT_EXIST, channelId);
      }
    }
});

exports.load = function(app){
  return PublishController;
};
