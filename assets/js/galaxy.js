/* Honkaku Bench — galaxy background animation
   Renders: star field with nebula clouds + an infinite triangle tunnel. */
(function () {
  'use strict';

  var canvas = document.createElement('canvas');
  canvas.id = 'galaxy-bg';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, cx = 0, cy = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Stars ────────────────────────────────────────────────
  // Stars recede into depth: spawn close (spread wide), converge toward center.
  var STAR_COUNT  = 230;
  var Z_STAR_NEAR = 0.5;   // spawn depth — appears wide / off-screen edges
  var Z_STAR_FAR  = 12.0;  // exit depth — tiny dot near vanishing point
  var STAR_SPEED  = 0.0035;

  var stars = (function () {
    var out = [], i;
    for (i = 0; i < STAR_COUNT; i++) {
      var big = Math.random() < 0.08;
      var cr  = Math.random();
      out.push({
        wx:    (Math.random() - 0.5) * 2.4,  // world x, -1.2..1.2
        wy:    (Math.random() - 0.5) * 2.4,  // world y
        z_s:   Z_STAR_NEAR + (Z_STAR_FAR - Z_STAR_NEAR) * Math.random(), // staggered
        r:     big ? Math.random() * 1.1 + 1.2 : Math.random() * 0.8 + 0.22,
        base:  Math.random() * 0.32 + 0.38,
        amp:   Math.random() * 0.32 + 0.18,
        freq:  Math.random() * 0.007 + 0.002,
        phase: Math.random() * 6.2832,
        col:   cr < 0.62 ? [210,222,255]
             : cr < 0.79 ? [255,255,255]
             : cr < 0.92 ? [255,216,160]
             :              [255,185,165],
      });
    }
    return out;
  }());

  // ── Nebulae ──────────────────────────────────────────────
  var nebulae = [
    { nx:0.18, ny:0.24, nr:0.54, col:[52,14,98],   a:0.15 },  // deep purple
    { nx:0.74, ny:0.64, nr:0.46, col:[14,28,115],  a:0.12 },  // dark indigo
    { nx:0.06, ny:0.81, nr:0.42, col:[92, 8, 40],  a:0.11 },  // deep crimson
    { nx:0.84, ny:0.13, nr:0.46, col:[18,45,132],  a:0.11 },  // deep blue
    { nx:0.52, ny:0.80, nr:0.38, col:[68,16,108],  a:0.09 },  // violet
    { nx:0.38, ny:0.50, nr:0.32, col:[ 8,52, 98],  a:0.08 },  // dark teal
    { nx:0.90, ny:0.50, nr:0.34, col:[40,10, 80],  a:0.07 },  // purple edge
  ];

  // ── Triangle tunnel ──────────────────────────────────────
  // Triangles move AWAY from viewer: spawn close (large), shrink into depth.
  var TRI_N   = 7;
  var Z_RESET = 0.35;  // spawn depth (large, close); resets here after exiting far
  var Z_PEAK  = 2.5;   // depth of maximum visibility
  var Z_FAR   = 20;    // exit depth (tiny, fully faded)
  var Z_SPAN  = Z_FAR - Z_RESET;
  var SPEED   = 0.010;  // world-units per frame at 60 fps

  var tris = (function () {
    var out = [], j;
    for (j = 0; j < TRI_N; j++) {
      out.push({ z: Z_RESET + Z_SPAN * (j / TRI_N), flip: j & 1 });
    }
    return out;
  }());

  function triRadius(z) {
    return Math.min(W, H) * 0.037 * Z_FAR / z;
  }

  var TWO_PI_OVER_3 = 2.09439510239;  // 2π/3

  function drawTri(z, flip) {
    var R   = triRadius(z);
    var rot = flip ? 1.0472 : 0;  // 60° offset for alternating flip
    var p0x = cx + Math.cos(rot)                   * R;
    var p0y = cy + Math.sin(rot)                   * R;
    var p1x = cx + Math.cos(rot + TWO_PI_OVER_3)   * R;
    var p1y = cy + Math.sin(rot + TWO_PI_OVER_3)   * R;
    var p2x = cx + Math.cos(rot + TWO_PI_OVER_3*2) * R;
    var p2y = cy + Math.sin(rot + TWO_PI_OVER_3*2) * R;

    // Quick pop-in at spawn; visible at full opacity while large; fade only at far end
    var quickIn = (z - Z_RESET) / 0.25;
    quickIn = quickIn < 0 ? 0 : quickIn > 1 ? 1 : quickIn;
    var fadeOut = z > Z_PEAK ? (Z_FAR - z) / (Z_FAR - Z_PEAK) : 1.0;
    fadeOut = fadeOut < 0 ? 0 : fadeOut > 1 ? 1 : fadeOut;
    var alpha = 0.18 * quickIn * fadeOut;

    // Thick when close, thin when far
    var lw = 0.5 + (1 - z / Z_FAR) * 6.5;
    lw = lw < 0.5 ? 0.5 : lw;

    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(200,162,52,' + alpha.toFixed(3) + ')';
    ctx.lineWidth   = lw;
    ctx.stroke();

    // Faint amber fill near peak brightness
    if (alpha > 0.04) {
      ctx.fillStyle = 'rgba(200,140,40,' + (alpha * 0.04).toFixed(4) + ')';
      ctx.fill();
    }
  }

  // ── Render loop ──────────────────────────────────────────
  var tick = 0;

  function frame() {
    tick++;

    // Base
    ctx.fillStyle = '#030406';
    ctx.fillRect(0, 0, W, H);

    // Nebulae
    var i, n, grd, c, px, py, rad;
    for (i = 0; i < nebulae.length; i++) {
      n   = nebulae[i];
      px  = n.nx * W;
      py  = n.ny * H;
      rad = n.nr * Math.max(W, H);
      c   = n.col;
      grd = ctx.createRadialGradient(px, py, 0, px, py, rad);
      grd.addColorStop(0,    'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + n.a + ')');
      grd.addColorStop(0.42, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (n.a * 0.42).toFixed(3) + ')');
      grd.addColorStop(1,    'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    // Stars — recede into depth each frame
    var s, bri, sx, sy, depthFade;
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      s.z_s += STAR_SPEED;
      if (s.z_s > Z_STAR_FAR) s.z_s = Z_STAR_NEAR;

      // Perspective projection: converges toward center as z_s grows
      sx = cx + s.wx * (W / 2) / s.z_s;
      sy = cy + s.wy * (H / 2) / s.z_s;
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;

      bri = s.base + s.amp * Math.sin(tick * s.freq * 6.2832 + s.phase);
      bri = bri < 0 ? 0 : bri > 1 ? 1 : bri;

      // Fade out as star shrinks into the distance
      depthFade = (Z_STAR_FAR - s.z_s) / (Z_STAR_FAR - Z_STAR_NEAR * 4);
      depthFade = depthFade < 0 ? 0 : depthFade > 1 ? 1 : depthFade;
      bri *= depthFade;

      c = s.col;

      if (s.r > 1.1 && bri > 0.05) {
        grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5.5);
        grd.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (bri * 0.28).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * 5.5, 0, 6.2832);
        ctx.fill();
      }

      ctx.globalAlpha = bri;
      ctx.fillStyle   = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, 6.2832);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Vanishing-point warm glow at tunnel centre
    grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    grd.addColorStop(0, 'rgba(200,148,38,0.07)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Triangle tunnel — moves away from viewer (recedes into depth)
    for (i = 0; i < tris.length; i++) {
      tris[i].z += SPEED;
      if (tris[i].z > Z_FAR) tris[i].z = Z_RESET;
      drawTri(tris[i].z, tris[i].flip);
    }

    requestAnimationFrame(frame);
  }

  frame();
}());
