var jsCore = require('./js.class/core'),
    msg = require('./message');

exports.createPublisherEndpoint = function(configuration, channelManager){
  return new PublisherEndpoint(configuration, channelManager);
};

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

var JS = jsCore.JS,
  PublisherEndpoint = new JS.Class({
    initialize: function(configuration, channelManager) {
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
        headers['X-Channel-Subscribers'] = numSubscribers;
      }
      if (numMessages != null) {
        headers['X-Channel-Messages'] = numMessages;
      }

      console.log('Starting response')
      res.writeHead(status, headers);
      res.write(message);
      res.end();
      console.log('Finishing response')
    },
    handle: function(path, req, res) {
      console.log("publishEndpoint: " + req.method + ": " + path);

      var channelId = this.configuration.extractChannelIdFromPublishPath(path);
      if (!channelId) {
        return false;
      }
      console.log("Channel is " + channelId);

      switch(req.method) {
        case HTTP_POST:
          var _this = this,
              body = '';
          req.on('data', function(chunk) {
            body += chunk;
          });
          req.on('end', function() {
            var message = msg.createMessage(body, new Date(), req.contentType),
                immediatePublishCount = _this.channelManager.publish(channelId, message);

            if (immediatePublishCount > 0) {
              _this.respondWith(res, 201, MESSAGE_DELIVERED, channelId);
            } else {
              _this.respondWith(res, 202, MESSAGE_ACCEPTED, channelId);
            }
          });
          return true;
        case HTTP_GET:
          if (this.channelManager.exists(channelId)) {
            this.respondWith(res, 200, CHANNEL_EXISTS, channelId);
          } else {
            this.respondWith(res, 404, CHANNEL_DOES_NOT_EXIST, channelId);
          }
          return true;
        case HTTP_PUT:
          if (this.channelManager.create(channelId)) {
            this.respondWith(res, 200, CHANNEL_CREATED, channelId);
          } else {
            this.respondWith(res, 200, CHANNEL_EXISTS, channelId);
          }
          return true;
        case HTTP_DELETE:
          var numSubscribers = this.channelManager.numSubscribers(channelId),
              numMessages = this.channelManager.numMessages(channelId);
          if (this.channelManager.deleteChannel(channelId)) {
            console.log("this.respondWith(res, 200, CHANNEL_DELETED, channelId, " + numSubscribers + ", " + numMessages + ");");
            this.respondWith(res, 200, CHANNEL_DELETED, channelId, numSubscribers, numMessages);
          } else {
            this.respondWith(res, 404, CHANNEL_DOES_NOT_EXIST, channelId);
          }
          return true;
        default:
          // return invalid!("Unhandled HTTP method #{request_method(env)}")
      }
      return false;
    }
});
