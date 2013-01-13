// problem-specific calculations

// origin
exports.zero = (function() {
  var ret = {
    coords: []
  };
  for (var i = 0; i < 200; i++) {
    ret.coords.push({
      x: 0,
      y: 0,
      z: 0,
      time: 0
    })
  }
  return ret;
})();

// calculate the distance between a and b
exports.distance = function(a, b) {
  var distance = 0;
  a.coords.forEach(function(d, i) {
    distance +=
      (d.x - b.coords[i].x) * (d.x - b.coords[i].x) +
      (d.y - b.coords[i].y) * (d.y - b.coords[i].y) +
      (d.z - b.coords[i].z) * (d.z - b.coords[i].z) +
      (d.time - b.coords[i].time) * (d.time - b.coords[i].time)
  });
  return distance;
};

// a + b
exports.add = function(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  var ret = {
    coords: []
  };
  a.coords.forEach(function(d, i) {
    var coord = {};
    ['x', 'y', 'z', 'time'].forEach(function(key) {
      coord[key] = d[key] + b.coords[i][key];
    });
    ret.coords.push(coord);
  });
  return ret;
};

// a / b
exports.divide = function(a, b) {
  if (!a || !b) {
    return exports.zero;
  }
  var ret = {
    coords: []
  };
  a.coords.forEach(function(coord) {
    ret.coords.push({
      x: coord.x / b,
      y: coord.y / b,
      z: coord.z / b,
      time: coord.time / b
    });
  });
  return ret;
}