var fs = require('fs'),
    configuration = require('../lib/configuration'),
    util = require('../lib/util'),
    sys = require('sys');

function App() {
  var _this = this;
  this.m = {};
  this.c = {};
  this.logger = require('node-logger').createLogger();
  
  function model(name, file) {
    var loaded = require('./models/' + file).load(_this);
    if (loaded) {
      _this.m[name] = loaded;
    }
  }

  function controller(name, file) {
    var loaded = require('./controllers/' + file).load(_this);
    if (loaded) {
      _this.c[name] = loaded;
    }
  }
  
  model("ChannelManager", "channel_manager");
  model("Channel", "channel");
  model("Message", "message");
  
  controller("PublishController", 'publish_controller');
  controller("SubscribeController", 'subscribe_controller');
  
  
  this.start = function(arguments) {
    var config = configuration.parse(arguments);
    
    if (config.debug) {
      _this.logger.setLevel('debug');
    }
    
    var channelManager = new _this.m.ChannelManager(_this, config),
        publishController = new _this.c.PublishController(_this, config, channelManager),
        subscribeController = new _this.c.SubscribeController(_this, config, channelManager);
        
    _this.publishServer = util.starServerWithRouter(_this, config.publishPort, config.publishIpAddress, publishController);
    _this.subscribeServer = util.startServer(_this, config.subscribePort, config.subscribeIpAddress, subscribeController);
  };
}
exports.load = function() {
  return new App();
};
