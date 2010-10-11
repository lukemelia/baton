var jsCore = require('../../lib/js.class/core'),
    io = require('../../lib/socket.io');

var JS = jsCore.JS,
  SubscribeController = new JS.Class({
    initialize: function(app, config, channelManager) {
      this.app = app;
      this.config = config;
      this.channelManager = channelManager;
    },
    handle: function(path, req, res) {
      if (path == '/' + this.config.subscribeSocketIOResource) {
        send405(res);
        return true;
      }
      return false;
    },
    attach: function(server) {
      var _this = this,
          ioListener = io.listen(server,
                                 { resource: this.config.subscribeSocketIOResource,
                                   transports:
                                     [
                                      'websocket',
                                      'server-events',
                                      // 'flashsocket',
                                      'htmlfile',
                                      'xhr-multipart',
                                      'xhr-polling'
                                      ]
                                  }),
          buffer = [];

      var subscriberPoll = function(client) {
        if (!client.connected) { return; }
        _this.channelManager.popAndSendSubscriberMessage(client);
        process.nextTick(function () {
          subscriberPoll(client);
        });
      };

      ioListener.on('connection', function(client){
        _this.app.logger.debug("client connected to websocket");
        client.subscribedChannels = [];

        process.nextTick(function () {
          subscriberPoll(client);
        });

        client.on('message', function(message){
          _this.app.logger.debug("received message over websocket: " + message);
          var subscribePattern = /^SUBSCRIBE ([A-Za-z0-9_]+)(?: SINCE ([0-9.]+))?$/,
              match = subscribePattern.exec(message);
          if (match) {
            var channelId = match[1],
                since = match[2];
            _this.channelManager.registerSubscriber(channelId, client, since);
          }
        });

        client.on('disconnect', function(){
          _this.channelManager.unregisterSubscriber(client);
        });
      });
    }
  });


exports.load = function(app){
  return SubscribeController;
};

var send405 = function(res){
  res.writeHead(405);
  res.write('405 Method Not Allowed');
  res.end();
};
