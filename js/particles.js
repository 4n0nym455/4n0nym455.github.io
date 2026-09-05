(function() {
  var canvas = document.getElementById("soc-particles");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var w, h, frame = 0;
  var mouseX = -1000, mouseY = -1000;
  var waves = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function isDark() {
    return document.documentElement.classList.contains("dark");
  }

  function bgColors(dark) {
    if (dark) {
      return ["#05070B", "#0B0F19", "#0E1625", "#0E1625", "#0B0F19", "#030712"];
    }
    return ["#F8FAFC", "#F1F5F9", "#E2E8F0", "#E2E8F0", "#F1F5F9", "#F8FAFC"];
  }

  function waveColor(dark, alpha) {
    return dark ? "rgba(148, 163, 184, " + alpha + ")" : "rgba(100, 116, 139, " + alpha + ")";
  }

  function glowColor(dark, alpha) {
    return dark ? "rgba(59, 130, 246, " + alpha + ")" : "rgba(37, 99, 235, " + alpha + ")";
  }

  function mirrorColor(dark, alpha) {
    return dark ? "rgba(59, 130, 246, " + alpha + ")" : "rgba(37, 99, 235, " + alpha + ")";
  }

  var Wave = function() {
    this.x = Math.random() * w;
    this.y = Math.random() * h * 0.8 + h * 0.1;
    this.angle = Math.random() * Math.PI * 2;
    this.amplitude = 15 + Math.random() * 30;
    this.wavelength = 80 + Math.random() * 120;
    this.speed = 0.3 + Math.random() * 0.4;
    this.phase = Math.random() * Math.PI * 2;
    this.life = 0;
    this.maxLife = 400 + Math.random() * 400;
    this.decay = 0.003 + Math.random() * 0.003;
    this.peak = 1;
  };

  function spawnWave() {
    if (waves.length >= 14) return;
    waves.push(new Wave());
  }

  setInterval(spawnWave, 1800);

  function drawBg(dark) {
    var c = bgColors(dark);
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, c[0]);
    grad.addColorStop(0.35, c[1]);
    grad.addColorStop(0.48, c[2]);
    grad.addColorStop(0.52, c[2]);
    grad.addColorStop(0.65, c[1]);
    grad.addColorStop(1, c[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawMirrorLine(dark) {
    var ml = h * 0.5 + Math.sin(frame * 0.002) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, ml);
    ctx.lineTo(w, ml);
    ctx.strokeStyle = mirrorColor(dark, 0.05);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    var g = ctx.createLinearGradient(0, ml - 3, 0, ml + 3);
    g.addColorStop(0, mirrorColor(dark, 0));
    g.addColorStop(0.4, mirrorColor(dark, 0.03));
    g.addColorStop(0.6, mirrorColor(dark, 0.03));
    g.addColorStop(1, mirrorColor(dark, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, ml - 3, w, 6);
  }

  function drawWave(wv, dark) {
    var nx = Math.cos(wv.angle);
    var ny = Math.sin(wv.angle);
    var px = -ny;
    var py = nx;

    var crests = 5;
    var crestSpacing = wv.wavelength;
    var totalLen = crests * crestSpacing;
    var midOffset = totalLen / 2;

    wv.phase += wv.speed * 0.04;
    wv.life++;
    if (wv.life > wv.maxLife) wv.life = wv.maxLife;
    var fade = 1;
    if (wv.life < 60) fade = wv.life / 60;
    if (wv.life > wv.maxLife - 60) fade = (wv.maxLife - wv.life) / 60;
    fade = Math.max(0, Math.min(1, fade));
    wv.peak = fade;

    var spread = 200 + wv.amplitude * 4;
    var steps = 20;
    var stepSize = spread / steps;

    for (var c = -2; c <= 2; c++) {
      var crestOffset = c * crestSpacing;
      var localPhase = wv.phase + crestOffset / crestSpacing * Math.PI * 2;

      var alpha = fade * (0.08 - Math.abs(c) * 0.012);
      if (alpha <= 0) continue;

      ctx.beginPath();
      for (var s = -steps; s <= steps; s++) {
        var perpDist = s * stepSize;
        var wavePhase = localPhase + (s / steps) * 0.3;

        var displacement = Math.sin(wavePhase) * wv.amplitude * 0.3;
        var x = wv.x + crestOffset * nx + perpDist * px + displacement * 0.2;
        var y = wv.y + crestOffset * ny + perpDist * py + displacement * 0.2;

        if (s === -steps) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = waveColor(dark, alpha);
      ctx.lineWidth = Math.max(0.3, fade * 0.8 - Math.abs(c) * 0.1);
      ctx.stroke();
    }

    var glowAlpha = fade * 0.015;
    if (glowAlpha > 0.001) {
      var gx = wv.x + Math.cos(wv.angle) * wv.amplitude * 0.5;
      var gy = wv.y + Math.sin(wv.angle) * wv.amplitude * 0.5;
      var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, wv.amplitude * 2);
      glow.addColorStop(0, glowColor(dark, glowAlpha));
      glow.addColorStop(1, glowColor(dark, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(gx - wv.amplitude * 2, gy - wv.amplitude * 2, wv.amplitude * 4, wv.amplitude * 4);
    }

    var ml = h * 0.5;
    if (wv.y < ml && fade > 0.3) {
      var refY = ml + (ml - wv.y);
      var refFade = fade * 0.5;
      for (var c2 = -2; c2 <= 2; c2++) {
        var ro = c2 * crestSpacing;
        var rp = wv.phase + ro / crestSpacing * Math.PI * 2;
        var ra = refFade * (0.04 - Math.abs(c2) * 0.006);
        if (ra <= 0) continue;
        ctx.beginPath();
        for (var rs = -steps; rs <= steps; rs++) {
          var rpd = rs * stepSize;
          var rwp = rp + (rs / steps) * 0.3;
          var rd = Math.sin(rwp) * wv.amplitude * 0.15;
          var rx = wv.x + ro * nx + rpd * px + rd * 0.1;
          var ry = refY + ro * ny + rpd * py + rd * 0.1;
          if (rs === -steps) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.strokeStyle = waveColor(dark, ra);
        ctx.lineWidth = Math.max(0.2, refFade * 0.4 - Math.abs(c2) * 0.05);
        ctx.stroke();
      }
    }
  }

  function mouseWave() {
    if (mouseX < 0 || mouseY < 0) return;
    if (Math.random() > 0.03) return;
    var wv = new Wave();
    wv.x = mouseX + (Math.random() - 0.5) * 40;
    wv.y = mouseY + (Math.random() - 0.5) * 40;
    wv.amplitude = 10 + Math.random() * 15;
    wv.wavelength = 50 + Math.random() * 60;
    wv.speed = 0.5 + Math.random() * 0.3;
    wv.life = 30;
    wv.maxLife = 150 + Math.random() * 100;
    waves.push(wv);
    if (waves.length > 18) waves.shift();
  }

  function animate() {
    frame++;
    var dark = isDark();
    drawBg(dark);

    for (var i = waves.length - 1; i >= 0; i--) {
      drawWave(waves[i], dark);
      if (waves[i].life >= waves[i].maxLife) waves.splice(i, 1);
    }

    drawMirrorLine(dark);

    mouseWave();

    var v = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
    v.addColorStop(0, "rgba(59, 130, 246, 0.005)");
    v.addColorStop(1, dark ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.15)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(animate);
  }

  document.addEventListener("mousemove", function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("touchmove", function(e) {
    var t = e.touches[0];
    if (t) { mouseX = t.clientX; mouseY = t.clientY; }
  });

  animate();
})();
