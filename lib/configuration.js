exports.parse = function(arguments) {
  var config = {
    subscribeIpAddress: '0.0.0.0',
    subscribePort: 8080,
    subscribeSocketIOResource: 'rt',
    publishIpAddress: '0.0.0.0',
    publishPort: 8081,
    publishPath: '/publish/:channel_id',
    debug: false,
    storeMessages: false,
    maxMessages: 0,
    backend: 'memory',
    extractChannelIdFromPublishPath: function(path) {
      config.publishPath.replace('/','\\/').replace(/\:channel_id/, '(.+)');
      var results = this.publishPathRegexp.exec(path);
      if (results) {
        return results[1];
      } else {
        return false;
      }
    }
  },
  setSubscribeIpAddress = function(end, ip) { config.subscribeIpAddress = ip; end(); },
  setSubscribePort = function(end, p) { config.subscribePort = p; end(); },
  setSubscribeSocketIOResource = function(end, path) { config.subscribeSocketIOResource = path; end(); },
  setPublishIpAddress = function(end, ip) { config.publishIpAddress = ip; end(); },
  setPublishPort = function(end, p) { config.publishPort = p; end(); },
  setPublishPath = function(end, path) { config.publishPath = path; end(); },
  setDebug = function(end, val) { config.debug = true; end(); },
  setStoreMessages = function(end, val) { config.storeMessages = true; end(); },
  setBackend = function(end, val) { config.backend = val; end(); },
  setMaxMessages = function(end, val) { config.maxMessages = val; end(); },
  invalidArgument = function(arg, valueMissing) {
    console.log('----------\nError: the argument %s %s', arg, (valueMissing?'expects a value':'is not valid'));
  };

  arguments.parse([
       {'name': /^(--subscribe_ip)$/, 'expected': /.*/, 'callback': setSubscribeIpAddress}
      ,{'name': /^(--subscribe_port)$/, 'expected': /^(\d+)$/i, 'callback': setSubscribePort}
      ,{'name': /^(--subscribe_socket_io_resource)$/, 'expected': /.*/, 'callback': setSubscribeSocketIOResource}
      ,{'name': /^(--publish_ip)$/, 'expected': /.*/, 'callback': setPublishIpAddress}
      ,{'name': /^(--publish_port)$/, 'expected': /^(\d+)$/i, 'callback': setPublishPort}
      ,{'name': /^(--publish_path)$/, 'expected': /.*/, 'callback': setPublishPath}
      ,{'name': /^(--debug)$/, 'expected': null, 'callback': setDebug}
      ,{'name': /^(--backend)$/, 'expected': null, 'callback': setBackend}
      ,{'name': /^(--store_messages)$/, 'expected': null, 'callback': setStoreMessages}
      ,{'name': /^(--max_messages)$/, 'expected': /^(\d+)$/i, 'callback': setMaxMessages}
    ], function(){}, invalidArgument);
    
  config.publishPathRegexp = new RegExp(config.publishPath.replace('/','\\/').replace(/\:channel_id/, '(.+)'))
  return config;
};
