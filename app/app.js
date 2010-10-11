var fs = require('fs'),
    configuration = require('../lib/configuration'),
    sys = require('sys');

function App() {
  var _this = this;
  this.m = {};
  this.c = {};
  
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
    
    console.log('----------\nStarting subscriber socket server (%s:%s) and RESTful publisher server (%s:%s)',
                  config.subscribeIpAddress,
                  config.subscribePort,
                  config.publishIpAddress,
                  config.publishPort);
    
    
    var channelManager = new _this.m.ChannelManager(_this, config),
        publishController = new _this.c.PublishController(_this, config, channelManager),
        subscribeController = new _this.c.SubscribeController(_this, config, channelManager);
        
    _this.publishServer = require('./servers/publish_server').start(config, publishController);
    _this.subscribeServer = require('./servers/subscribe_server').start(config, subscribeController, channelManager);
  };
}
exports.load = function() {
  return new App();
};
