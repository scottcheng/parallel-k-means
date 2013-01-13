var csv = require('csv');
var config = require('./config');

exports.read = function(callback) {
  csv()
    .from(__dirname + '/' + config.DATA_SOURCE)
    .transform(function(d) {
      d.coords = [];
      for (var i = 0; i < 200; i++) {
        d.coords.push({
          x: parseFloat(d[i * 4]),
          y: parseFloat(d[i * 4 + 1]),
          z: parseFloat(d[i * 4 + 2]),
          time: parseFloat(d[i * 4 + 3])});
      }
      return d;
    })
    .to.array(function(data, count) {
      callback(data, count);
    });
};