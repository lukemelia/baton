var http = require('http'),
    url = require('url'),
    router = require('node-router'),
    send404 = function(res){
      res.writeHead(404);
      res.write('404 Not Found');
      res.end();
    };

exports.starServerWithRouter = function(app, port, ipAddress, controller) {
  var server = router.getServer(function(logMessage) {
    app.logger.info(logMessage);
  });
  server.listen(port, ipAddress);
  controller.attach(server);
  return server;
};

exports.startServer = function(app, port, ipAddress, controller) {
  var server = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;

    if (controller.handle(path, req, res)) {
      return;
    } else {
      send404(res);
    }
  });
  app.logger.info('Starting server instance at http://' + ipAddress + ':' + port + '/');
  server.listen(port, ipAddress);
  controller.attach(server);
  return server;
};
