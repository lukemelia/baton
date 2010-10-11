var http = require('http'),
  url = require('url'),
  jsCore = require('../../lib/js.class/core'),
  msg = require('../models/message'),
  sub = require('../controllers/subscribe_controller'),
  util = require('../../lib/util');

exports.start = function(config, subscribeController, channelManager) {
  var subscribeServer = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;

    if (subscribeController.handle(path, req, res)) {
      return;
    } else {
      util.send404(res);
    }
  });
  subscribeServer.listen(config.subscribePort, config.subscribeIpAddress);
  subscribeController.attachSocketIoListener(subscribeServer);
  return subscribeServer;
};
