var http = require('http'),
  url = require('url'),
  io = require('../../lib/socket.io'),
  jsCore = require('../../lib/js.class/core'),
  msg = require('../models/message'),
  send404 = function(res){
    res.writeHead(404);
    res.write('404 Not Found');
    res.end();
  },
  send405 = function(res){
    res.writeHead(405);
    res.write('405 Method Not Allowed');
    res.end();
  };

exports.startSubscriberServer = function(config, channelManager){
  var subscriberServer = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;
    switch (path){
      case '/':
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<h1>Welcome to baton subscriber endpoint.</h1>');
        res.end();
        break;
      case '/' + config.subscribeSocketIOResource:
        send405(res);
        break;
      default:
        send404(res);
        break;
    }
  });

  console.log('----------\nStarting subscriber socket server (%s:%s) and RESTful publisher server (%s:%s)',
                config.subscribeIpAddress,
                config.subscribePort,
                config.publishIpAddress,
                config.publishPort);
  subscriberServer.listen(config.subscribePort, config.subscribeIpAddress);
  var ioListener = io.listen(subscriberServer,
                             { resource: config.subscribeSocketIOResource,
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
    channelManager.popAndSendSubscriberMessage(client);
    process.nextTick(function () {
      subscriberPoll(client);
    });
  };

  ioListener.on('connection', function(client){
    console.log("client connected to websocket");
    client.subscribedChannels = [];
    
    process.nextTick(function () {
      subscriberPoll(client);
    });
    
    client.on('message', function(message){
      console.log("received message over websocket: " + message);
      var subscribePattern = /^SUBSCRIBE ([A-Za-z0-9_]+)(?: SINCE ([0-9.]+))?$/,
          match = subscribePattern.exec(message);
      if (match) {
        var channelId = match[1],
            since = match[2];
        channelManager.registerSubscriber(channelId, client, since);
      }
    });

    client.on('disconnect', function(){
      channelManager.unregisterSubscriber(client);
    });
  });
};

