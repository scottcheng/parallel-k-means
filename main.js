var fork = require('child_process').fork;
var calculation = require('./calculation');
var config = require('./config');

var N = config.N;
var K = config.K;
var WORKER_NUM = config.WORKER_NUM;

var workers = [];  // worker processes

var timer = (function() {
  var start = new Date;
  return {
    log: function() {
      var now = new Date;
      console.log('time elapsed:', now - start, 'ms');
    }
  }
})();

// send static or dynamic messages to all workers
var send = function(message) {
  workers.forEach(function(worker, i) {
    var msg = message;
    if (typeof(message) === 'function') {
      msg = message(i);
    }
    worker.send(msg);
  });
};

// fork workers
for (var i = 0; i < WORKER_NUM; i++) {
  workers.push(fork(__dirname + '/worker.js'));
}

// trigger start
send(function(i) {
  return {
    message: 'start',
    id: i
  };
});

// setup worker barrier
var msgBuffer = {};
workers.forEach(function(worker, i) {
  worker.on('message', function(msg) {
    var buffer = msgBuffer[msg.message];

    // initialize counter key
    if (!buffer) {
      buffer = (msgBuffer[msg.message] = {});
      buffer.count = 0;
      buffer.data = {};
    }

    // buffer the message
    buffer.count++;
    // dirty hacks on `delta`, `sums` and `sizes`
    if ('delta' in msg) {
      if (!buffer.data.delta) {
        buffer.data.delta = 0;
      }
      buffer.data.delta += msg.delta;
    }
    if ('sums' in msg) {
      if (!buffer.data.sums) {
        buffer.data.sums = [];
        for (var j = 0; j < K; j++) {
          buffer.data.sums.push(calculation.zero);
        }
      }
      msg.sums.forEach(function(sum, i) {
        buffer.data.sums[i] = calculation.add(buffer.data.sums[i], sum);
      });
    }
    if ('sizes' in msg) {
      if (!buffer.data.sizes) {
        buffer.data.sizes = [];
        for (var j = 0; j < K; j++) {
          buffer.data.sizes.push(0);
        }
      }
      msg.sizes.forEach(function(size, i) {
        buffer.data.sizes[i] += size;
      });
    }

    // check if barrier is reached
    if (buffer.count === WORKER_NUM) {
      // console.log('barrier reached:', msg.message);
      // trigger barrier handler
      barrierHandlers[msg.message](msg, buffer.data);
      // reset msgBuffer
      buffer.count = 0;
      buffer.data = {};
    }
  });
})

var iterationCount = 0;

var barrierHandlers = {
  ready: function(msg) {
    console.log('data ready');
    timer.log();

    // pick initial centers
    var centerIds = [];
    for (var i = 0; i < K; i++) {
      var centerId = Math.floor(Math.random() * N);
      var duplicate = false;
      for (var j = 0; j < centerIds.length; j++) {
        if (centerId === centerIds[j]) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate) {
        centerIds.push(centerId);
      } else {
        i--;  // re-run this iteration
      }
    }

    console.log('seeds:', centerIds);
    send({
      message: 'iterate',
      centerIds: centerIds
    })
  },

  iterate: function(msg, data) {
    console.log();
    console.log('iteration:', ++iterationCount);
    console.log('delta:', data.delta);
    console.log('cluster sizes:', data.sizes);

    if (data.delta <= config.THRESHOLD) {
      console.log('converged');
      timer.log();
      exit();
    }

    // update cluster centers
    var centers = [];
    data.sums.forEach(function(sum, i) {
      centers[i] = calculation.divide(sum, data.sizes[i]);
    });
    timer.log();

    send({
      message: 'iterate',
      centers: centers
    })
  }
};

var exit = function() {
  workers.forEach(function(worker) {
    worker.kill();
  });
  process.exit();
};