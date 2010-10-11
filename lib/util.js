var http = require('http'),
    url = require('url'),
    send404 = function(res){
      res.writeHead(404);
      res.write('404 Not Found');
      res.end();
    };

    
exports.startServer = function(port, ipAddress, controller) {
  var server = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;

    if (controller.handle(path, req, res)) {
      return;
    } else {
      send404(res);
    }
  });
  server.listen(port, ipAddress);
  controller.attach(server);
  return server;
};
