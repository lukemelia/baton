exports.send404 = function(res){
  res.writeHead(404);
  res.write('404 Not Found');
  res.end();
};
