var http = require('http'),
    url = require('url');
    util = require("../../lib/util");
    
exports.start = function(config, publishController) {
  var publishServer = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;

    if (publishController.handle(path, req, res)) {
      return;
    } else {
      util.send404(res);
    }
  });
  publishServer.listen(config.publishPort, config.publishIpAddress);
  return publishServer;
};
