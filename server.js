var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    configuration = require('./lib/configuration.js'),
    sys = require('sys'),
    pub = require('./lib/pub.js'),
    sub = require('./lib/sub.js'),
    cm = require('./lib/channel_manager.js'),
    arguments = require('arguments'),
config = configuration.parse(arguments),
send404 = function(res){
  res.writeHead(404);
  res.write('404 Not Found');
  res.end();
},
channelManager = cm.createChannelManager(config),
publishEndpoint = pub.createPublisherEndpoint(config, channelManager),
publisherServer = http.createServer(function(req, res) {
  var path = url.parse(req.url).pathname;

  if (publishEndpoint.handle(path, req, res)) { return; }

  switch (path) {
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Welcome to baton publisher endpoint.</h1>');
      res.end();
      break;

    default:
      send404(res);
      break;
  }
});
publisherServer.listen(config.publishPort, config.publishIpAddress);
sub.startSubscriberServer(config, channelManager);
