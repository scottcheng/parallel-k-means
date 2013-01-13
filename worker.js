var io = require('./io');
var calculation = require('./calculation');
var config = require('./config');

var N = config.N;
var K = config.K;
var WORKER_NUM = config.WORKER_NUM;

var ID;
var IDX_START;  // inclusive
var IDX_END;  // exclusive
var data;
var memberships = [];

process.on('message', function(msg) {
  handlers[msg.message](msg);
});

var handlers = {
  start: function(msg) {
    ID = msg.id;
    IDX_START = Math.floor(N / WORKER_NUM * ID);
    IDX_END = Math.floor(N / WORKER_NUM * (ID + 1));

    io.read(function(d, count) {
      data = d;
      process.send({
        message: 'ready'
      });
    });
  },

  iterate: function(msg) {
    // get centers
    if (msg.centers) {
      var centers = msg.centers;
    } else {
      var centers = [];
      msg.centerIds.forEach(function(centerId) {
        centers.push(data[centerId]);
      });
    }

    var delta = 0;
    var sizes = [];  // number of elements in each cluster
    var sums = [];  // sum of all elements in each cluster
    for (var j = 0; j < K; j++) {
      sizes.push(0);
    }
    for (var i = IDX_START; i < IDX_END; i++) {
      // calculate new membership
      var min = Number.MAX_VALUE;
      var membership;
      for (var j = 0; j < K; j++) {
        var distance = calculation.distance(data[i], centers[j]);
        if (distance < min) {
          min = distance;
          membership = j;
        }
      }

      // update membership
      if (!(i in memberships) || memberships[i] !== membership) {
        delta++;
        memberships[i] = membership;
      }
      sums[membership] = calculation.add(sums[membership], data[i]);
      sizes[membership]++;
    }

    // send back new memberships
    process.send({
      message: 'iterate',
      delta: delta,
      sums: sums,
      sizes: sizes
    });
  }
};