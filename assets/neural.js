// The app's background network (NeuralNetworkWithBlurredCircles in the app): dark
// nodes drifting slightly, joined by faint lines when close. Light on purpose: a few
// dozen points, 30 frames a second at most, paused in a hidden tab, still with
// reduced motion.
(function () {
  var canvas = document.querySelector('.bg canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Not drawn on a phone (the canvas is hidden there too, see style.css)
  var phone = window.matchMedia('(max-width: 640px)');
  var points = [];
  var w = 0, h = 0, link = 140, raf = 0, last = 0;
  var PERIOD = 20000; // one loop of the drift, as in the app

  // Only the canvas follows a change of height (the address bar of a phone browser
  // hiding on scroll): the points are kept, so the network does not jump
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setup() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    link = Math.max(130, Math.min(180, w * 0.13));
    // Denser at the sides, sparse in the middle where the text is (the canvas is
    // also faded there, see .bg canvas in style.css)
    var count = Math.max(50, Math.min(160, Math.round((w * h) / 9000)));
    var EDGE = 0.25; // share of the width on each side that gets most of the points
    points = [];
    for (var i = 0; i < count; i++) {
      var x = Math.random();
      if (Math.random() < 0.7) {
        x = Math.random() * EDGE;
        if (Math.random() < 0.5) x = 1 - x;
      }
      points.push([x, Math.random()]);
    }
  }

  function draw(now) {
    var t = (now % PERIOD) / PERIOD * Math.PI * 2;
    ctx.clearRect(0, 0, w, h);
    var xy = points.map(function (p) {
      return [
        (p[0] + Math.sin(t + p[0] * 4) * 0.01) * w,
        (p[1] + Math.cos(t + p[1] * 4) * 0.01) * h,
      ];
    });
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (var i = 0; i < xy.length; i++) {
      for (var j = i + 1; j < xy.length; j++) {
        var dx = xy[i][0] - xy[j][0], dy = xy[i][1] - xy[j][1];
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < link) {
          ctx.strokeStyle = 'rgba(0,0,0,' + ((1 - d / link) * 0.2).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(xy[i][0], xy[i][1]);
          ctx.lineTo(xy[j][0], xy[j][1]);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    for (var k = 0; k < xy.length; k++) {
      ctx.beginPath();
      ctx.arc(xy[k][0], xy[k][1], 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;
    last = now;
    draw(now);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (phone.matches) ctx.clearRect(0, 0, w, h);
    else if (reduce) draw(0);
    else raf = requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth !== w) setup();
      else size();
      start();
    }, 200);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  });

  setup();
  start();
})();
