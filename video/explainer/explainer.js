// InfuSafe explainer in the Flat-Vector Science style. Every frame is a pure function of t.
(function () {
  const TAU = Math.PI * 2;
  const cl = H.clamp, lerp = H.lerp;
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const eo = H.ease.out, eio = H.ease.inOut;
  const back = (u, s = 1.5) => { if (u <= 0) return 0; if (u >= 1) return 1; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const FONT = '"Nunito", "Fredoka", sans-serif';
  const F = (w, px) => `${w} ${px}px ${FONT}`;

  const C = {
    sky0: '#090b2c', sky1: '#18134f', sky2: '#3a1a6c', ink: '#141846',
    teal: ['#a4fbef', '#3ccbdc', '#1d64b0'],
    orange: ['#ffcc7a', '#ff8d3f', '#d24a2a'],
    tan: ['#ffe9be', '#ecb676', '#b4723c'],
    gold: ['#fff4b8', '#ffd23f', '#c47a12'],
    rose: ['#ffc1d8', '#ff5d8f', '#9a2775'],
    yellow: '#ffd23f', pink: '#ff5d8f', red: '#ff3b5c', green: '#38e08e', cyan: '#56e8ff', violet: '#8b5cff',
  };

  // ---------------- timeline (shared by picture and sound) ----------------
  const TL = {
    title: 0.2, shrink: [2.2, 2.9],
    bagIn: [2.5, 3.0], pumpIn: [2.7, 3.2], patIn: [2.9, 3.4],
    lbl: [4.0, 5.2], flow: [5.2, 6.8],
    kink: 10.6, air: 12.8, typo: 15.0,
    pull: [18.0, 19.2], count: [18.9, 21.6],
    dive: [23.4, 24.7],
    chipIn: 24.7, queue: [25.4, 29.6], waitT: 28.6,
    sweep: [31.1, 32.1],
    guardIn: [32.3, 33.1], qnx: 33.9, link: [34.5, 35.3], tick: [35.6, 38.4],
    lanes: [39.8, 40.6], race: [41.0, 44.4],
    back: [45.2, 46.0], kink2: 46.7, stop1: 47.0, air2: 49.8, stop2: 50.0,
    take: [52.6, 53.6], line1: 54.0, line2: 55.0, D: 58,
  };
  window.DURATION = TL.D;
  window.TL = TL;

  // ---------------- reference helpers ----------------
  function rr(x, X, Y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  function glow(x, cx, cy, r, col, a) {
    if (a <= 0 || r <= 0) return;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, H.rgba(col, a)); g.addColorStop(0.35, H.rgba(col, a * 0.4)); g.addColorStop(1, H.rgba(col, 0));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  function spark(x, cx, cy, r, col, a) {
    if (a <= 0 || r <= 0) return;
    x.save(); x.globalAlpha *= a; x.fillStyle = col; x.beginPath();
    x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
    x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill(); x.restore();
  }
  function crescent(x, cx, cy, r, dx, dy, fill) {
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    x.beginPath(); x.rect(cx - r - 2, cy - r - 2, 2 * r + 4, 2 * r + 4); x.arc(cx + dx, cy + dy, r * 1.02, 0, TAU);
    x.fillStyle = fill; x.fill('evenodd'); x.restore();
  }
  function ball(x, cx, cy, r, col, o = {}) {
    if (r <= 0.3) return;
    const la = o.la == null ? -2.25 : o.la, lx = Math.cos(la), ly = Math.sin(la);
    const g = x.createLinearGradient(cx + lx * r, cy + ly * r, cx - lx * r, cy - ly * r);
    g.addColorStop(0, col[0]); g.addColorStop(0.45, col[1]); g.addColorStop(1, H.rgba(H.mix(col[1], col[2], 0.6)));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    if (o.inner) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); o.inner(); x.restore(); }
    const sh = o.sh == null ? 0.3 : o.sh;
    crescent(x, cx, cy, r, lx * r * sh, ly * r * sh, H.rgba(col[2], o.sha == null ? 0.5 : o.sha));
    crescent(x, cx, cy, r, lx * r * sh * 2.2, ly * r * sh * 2.2, H.rgba(col[2], (o.sha == null ? 0.5 : o.sha) * 0.45));
    crescent(x, cx, cy, r, -lx * r * 0.075, -ly * r * 0.075, H.rgba(o.rim || '#ffffff', o.rima == null ? 0.42 : o.rima));
  }
  const bez = (P, u) => { const v = 1 - u; return [v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0], v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1]]; };
  function arrow(x, P, prog, col, lw, o = {}) {
    if (prog <= 0) return;
    const n = 48, a = o.a == null ? 1 : o.a;
    x.save(); x.globalAlpha *= a; x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    if (o.dots) x.setLineDash([0.01, lw * 1.9]);
    x.beginPath(); const p0 = bez(P, 0); x.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= n; i++) { const p = bez(P, (prog * i) / n); x.lineTo(p[0], p[1]); }
    x.stroke(); x.setLineDash([]);
    if (o.head !== false && prog > 0.08) {
      const e = bez(P, prog), e0 = bez(P, prog - 0.02), ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]), hs = lw * 1.5 * cl(prog * 5);
      x.translate(e[0], e[1]); x.rotate(ang); x.beginPath(); x.moveTo(hs * 1.1, 0); x.lineTo(-hs * 0.8, hs); x.lineTo(-hs * 0.8, -hs); x.closePath();
      x.lineWidth = lw * 0.7; x.fill(); x.stroke();
    }
    x.restore();
  }
  function text(x, s, cx, cy, px, col, o = {}) {
    x.save(); x.font = F(o.w || 900, px); x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
    x.globalAlpha *= o.a == null ? 1 : o.a;
    x.fillStyle = o.shadow || 'rgba(10,8,46,0.55)'; x.fillText(s, cx + px * 0.03, cy + px * 0.07);
    x.fillStyle = col; x.fillText(s, cx, cy); x.restore();
  }
  function pill(x, cx, cy, s, px, o = {}) {
    const sc = o.s == null ? 1 : o.s, a = o.a == null ? 1 : o.a;
    if (sc <= 0.01 || a <= 0.01) return;
    x.save(); x.font = F(o.w || 900, px);
    const tw = x.measureText(s).width, w = tw + px * 1.15, h = px * 1.6;
    x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha *= a;
    x.fillStyle = 'rgba(10,8,46,0.4)'; rr(x, -w / 2, -h / 2 + px * 0.2, w, h, h / 2); x.fill();
    x.fillStyle = o.bg || '#ffffff';
    if (o.ptr) { x.beginPath(); x.moveTo(-px * 0.35, h / 2 - 2); x.lineTo(0, h / 2 + px * 0.45); x.lineTo(px * 0.35, h / 2 - 2); x.fill(); }
    rr(x, -w / 2, -h / 2, w, h, h / 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; rr(x, -w / 2 + h * 0.25, -h / 2 + h * 0.12, w - h * 0.5, h * 0.16, h * 0.08); x.fill();
    x.fillStyle = o.fg || C.ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 0, px * 0.06);
    x.restore();
    return w;
  }
  let STARS = null;
  function stars() {
    if (STARS) return STARS;
    const r = H.rng(77), a = [], sp = [];
    for (let i = 0; i < 620; i++) a.push({ x: r.range(0, 1680), y: r.range(0, 1120), d: r.pick([0.15, 0.3, 0.3, 0.55, 1]), s: r.range(0.6, 2.0), ph: r.range(0, TAU), sp: r.range(0.8, 2.6), c: r.pick(['#ffffff', '#cfe4ff', '#ffe9c7', '#dccbff']) });
    for (let i = 0; i < 16; i++) sp.push({ x: r.range(0, 1680), y: r.range(0, 1120), d: r.range(0.3, 0.9), s: r.range(6, 13), ph: r.range(0, TAU) });
    STARS = { a, sp }; return STARS;
  }
  function sky(x, W, H_, t, cam = {}) {
    const px = cam.x || 0, py = cam.y || 0, lz = Math.log(cam.z || 1);
    const g = x.createLinearGradient(0, 0, W * 0.3, H_);
    g.addColorStop(0, C.sky0); g.addColorStop(0.5, C.sky1); g.addColorStop(1, C.sky2);
    x.fillStyle = g; x.fillRect(0, 0, W, H_);
    glow(x, W * 0.86, H_ * 0.12, 700, cam.tint || '#7b34c6', 0.34);
    glow(x, W * 0.05, H_ * 1.0, 620, '#2448b4', 0.4);
    glow(x, W * 0.45, H_ * 0.6, 520, '#4a2a9c', 0.16);
    const S = stars();
    const place = (s) => {
      const k = Math.exp(lz * s.d * 0.6);
      let sx = (((s.x - px * s.d) % 1680) + 1680) % 1680 - 200, sy = (((s.y - py * s.d) % 1120) + 1120) % 1120 - 200;
      return [(sx - 640) * k + 640, (sy - 360) * k + 360];
    };
    for (const s of S.a) {
      const [sx, sy] = place(s);
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H_ + 4) continue;
      x.globalAlpha = (0.55 + 0.45 * Math.sin(t * s.sp + s.ph)) * (0.45 + s.d * 0.55);
      x.fillStyle = s.c; x.beginPath(); x.arc(sx, sy, s.s * (0.7 + 0.35 * s.d), 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
    for (const s of S.sp) {
      const [sx, sy] = place(s); const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + s.ph);
      glow(x, sx, sy, s.s * 2.2, '#bfa8ff', 0.25 * tw);
      spark(x, sx, sy, s.s * tw, '#ffffff', 0.9);
    }
  }
  function ring(x, cx, cy, R, half, a = 1) {
    if (a <= 0) return;
    x.save(); x.translate(cx, cy); x.rotate(R.tilt); x.globalAlpha *= a;
    const m = Math.max(...R.bands.map((b) => b[1])) * 1.05;
    x.beginPath(); if (half === 'back') x.rect(-R.rx * m, -R.ry * m, R.rx * m * 2, R.ry * m); else x.rect(-R.rx * m, 0, R.rx * m * 2, R.ry * m); x.clip();
    for (const [f0, f1, col, al] of R.bands) {
      x.beginPath(); x.ellipse(0, 0, R.rx * f1, R.ry * f1, 0, 0, TAU); x.ellipse(0, 0, R.rx * f0, R.ry * f0, 0, 0, TAU);
      x.fillStyle = H.rgba(col, (al == null ? 1 : al) * (half === 'back' ? 0.75 : 1)); x.fill('evenodd');
    }
    x.restore();
  }
  function bands(x, r, B, tilt) {
    x.save(); x.rotate(tilt || 0);
    for (const [v0, v1, col, a] of B) {
      x.beginPath();
      for (let i = 0; i <= 20; i++) { const u = (i / 20) * 2 - 1; x.lineTo(u * r * 1.1, (v0 + 0.13 * (1 - u * u)) * r); }
      for (let i = 20; i >= 0; i--) { const u = (i / 20) * 2 - 1; x.lineTo(u * r * 1.1, (v1 + 0.13 * (1 - u * u)) * r); }
      x.fillStyle = H.rgba(col, a == null ? 1 : a); x.fill();
    }
    x.restore();
  }
  const PL = {
    magenta: { c: ['#ffa0c4', '#de4b93', '#4e1670'], glow: '#ff5fa8', tilt: -0.18, atmo: [255, 214, 234],
      bands: [[-0.62, -0.48, '#ffc1d8', 0.55], [-0.2, -0.02, '#b5307e', 0.6], [0.06, 0.14, '#ffd0e2', 0.4], [0.36, 0.58, '#9a2775', 0.55]],
      ring: { rx: 1.75, ry: 0.5, tilt: -0.2, bands: [[1.18, 1.32, '#ffd27a', 0.95], [1.34, 1.5, '#ff9f5a', 0.9], [1.53, 1.6, '#ffe7b0', 0.8]] } },
    coral: { c: ['#ffd29a', '#ff7a4a', '#7a1f4f'], glow: '#ff8a50', tilt: 0.1, atmo: [255, 226, 190],
      bands: [[-0.7, -0.5, '#ffe2b8', 0.5], [-0.32, -0.12, '#e8553a', 0.6], [0.05, 0.22, '#ffb27a', 0.5], [0.4, 0.62, '#c43c46', 0.55]] },
    teal: { c: ['#9ff3ff', '#3a9be0', '#1d2f86'], glow: '#4fc9ff', tilt: -0.12, atmo: [190, 245, 255],
      bands: [[-0.5, -0.36, '#c6f8ff', 0.5], [-0.05, 0.1, '#2f74c9', 0.55], [0.32, 0.5, '#7fdcff', 0.4]] },
    moon: { c: ['#e8e6ff', '#a7a2d8', '#4a3f8c'], craters: true },
  };
  function planet(x, cx, cy, r, pal, o = {}) {
    if (r <= 0.5) return;
    if (pal.glow) glow(x, cx, cy, r * 1.7, pal.glow, o.glowA == null ? 0.32 : o.glowA);
    const R = pal.ring && { rx: pal.ring.rx * r, ry: pal.ring.ry * r, tilt: pal.ring.tilt, bands: pal.ring.bands };
    if (R) ring(x, cx, cy, R, 'back', 1);
    ball(x, cx, cy, r, pal.c, {
      sh: 0.34, sha: 0.55, rima: 0.35,
      inner: () => {
        x.save(); x.translate(cx, cy);
        if (pal.bands) bands(x, r, pal.bands, pal.tilt);
        if (pal.craters) { const q = H.rng(5); for (let i = 0; i < 5; i++) { const a = q.range(0, TAU), d = q.range(0.1, 0.65) * r, cr = q.range(0.1, 0.2) * r, qx = Math.cos(a) * d, qy = Math.sin(a) * d; x.fillStyle = 'rgba(80,66,150,0.38)'; x.beginPath(); x.arc(qx, qy, cr, 0, TAU); x.fill(); crescent(x, qx, qy, cr, -cr * 0.3, -cr * 0.3, 'rgba(255,255,255,0.3)'); } }
        x.restore();
      },
    });
    const atA = o.atmo == null ? 0.7 : o.atmo;
    if (pal.atmo && atA > 0) {
      x.save(); x.lineCap = 'round'; const ga0 = x.globalAlpha;
      const la = -2.25, ag = x.createLinearGradient(cx + Math.cos(la) * r, cy + Math.sin(la) * r, cx - Math.cos(la) * r, cy - Math.sin(la) * r);
      ag.addColorStop(0, H.rgba(pal.atmo, 1)); ag.addColorStop(0.55, H.rgba(pal.atmo, 0.5)); ag.addColorStop(1, H.rgba(pal.atmo, 0.08));
      x.strokeStyle = ag;
      for (const [lw, a] of [[r * 0.05, 0.08], [r * 0.028, 0.16], [r * 0.014, 0.3], [Math.max(2, r * 0.006), 0.6]]) { x.globalAlpha = ga0 * a * atA; x.lineWidth = lw; x.beginPath(); x.arc(cx, cy, r + lw * 0.15, 0, TAU); x.stroke(); }
      x.restore();
    }
    if (R) ring(x, cx, cy, R, 'front', 1);
  }
  let GRAIN = null;
  function grainTex() {
    if (GRAIN) return GRAIN;
    const S = 256, tile = H.layer(S, S), tc = tile.getContext('2d'), img = tc.createImageData(S, S), d = img.data, r = H.rng(4242);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 92; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    tc.putImageData(img, 0, 0);
    const MW = 320, MH = 180, mot = H.layer(MW, MH), mc = mot.getContext('2d'), mi = mc.createImageData(MW, MH), md = mi.data, nz = H.makeNoise(88);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const v = 128 + nz.fbm2(x * 0.035, y * 0.035, 4) * 70 + nz.n2(x * 0.22, y * 0.22) * 14, k = (y * MW + x) * 4; md[k] = md[k + 1] = md[k + 2] = v; md[k + 3] = 255; }
    mc.putImageData(mi, 0, 0);
    GRAIN = { tile, mot };
    return GRAIN;
  }
  function finish(x, W, H_, t) {
    const G = grainTex(), f = Math.floor(t * 24);
    x.save(); x.globalCompositeOperation = 'overlay';
    x.globalAlpha = 0.12; x.imageSmoothingEnabled = true; x.drawImage(G.mot, 0, 0, W, H_);
    const pat = x.createPattern(G.tile, 'repeat'); pat.setTransform(new DOMMatrix().translateSelf((f * 73) % 256, (f * 151) % 256));
    x.globalAlpha = 0.09; x.fillStyle = pat; x.fillRect(0, 0, W, H_);
    x.restore();
  }
  function eye(x, ex, ey, er, o) {
    const look = o.look || [0, 0];
    if ((o.happy || 0) > 0.5) {
      x.save(); x.strokeStyle = '#ffffff'; x.lineWidth = er * 0.42; x.lineCap = 'round';
      x.beginPath(); x.arc(ex, ey + er * 0.35, er * 0.62, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.restore(); return;
    }
    const bl = 1 - 0.92 * (o.blink || 0);
    x.save(); x.translate(ex, ey); x.scale(1, bl);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, er, 0, TAU); x.fill();
    const pr = er * (o.worry ? 0.5 : 0.56);
    const px = look[0] * er * 0.36, py = look[1] * er * 0.36;
    x.fillStyle = '#141638'; x.beginPath(); x.arc(px, py, pr, 0, TAU); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, TAU); x.fill();
    x.beginPath(); x.arc(px + pr * 0.35, py + pr * 0.35, pr * 0.13, 0, TAU); x.fill();
    x.restore();
  }
  const blinkAt = (t, ph) => { const u = (t + ph) % 3.3; return u < 0.14 ? Math.sin((u / 0.14) * Math.PI) : 0; };
  function badge(x, cx, cy, r, ok, s) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    glow(x, 0, 0, r * 2.4, ok ? C.green : C.red, 0.45);
    ball(x, 0, 0, r, ok ? ['#9fffc8', C.green, '#178a5a'] : ['#ff9aa8', C.red, '#9c1638'], { sha: 0.4 });
    x.strokeStyle = '#ffffff'; x.lineWidth = r * 0.26; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (ok) { x.moveTo(-r * 0.42, 0); x.lineTo(-r * 0.1, r * 0.32); x.lineTo(r * 0.45, -r * 0.3); }
    else { x.moveTo(-r * 0.34, -r * 0.34); x.lineTo(r * 0.34, r * 0.34); x.moveTo(r * 0.34, -r * 0.34); x.lineTo(-r * 0.34, r * 0.34); }
    x.stroke(); x.restore();
  }
  function flare(x, cx, cy, k, t) {
    if (k <= 0) return;
    glow(x, cx, cy, 420 * (0.6 + 0.4 * k), '#ffcf5a', 0.55 * k);
    glow(x, cx, cy, 160, '#fff6d0', 0.6 * k);
    x.save(); x.translate(cx, cy); x.rotate(t * 0.25); x.globalAlpha *= 0.32 * k; x.fillStyle = '#ffe28a';
    for (let i = 0; i < 12; i++) { x.rotate(TAU / 12); x.beginPath(); x.moveTo(0, -12); x.lineTo(330 + 60 * (i % 2), 0); x.lineTo(0, 12); x.fill(); }
    x.restore();
  }
  function burst(x, cx, cy, age, seed, spread) {
    if (age < 0 || age > 1.4) return;
    const r = H.rng(seed);
    for (let i = 0; i < 18; i++) {
      const a = r.range(0, TAU), d = (spread || 300) * r.range(0.45, 1) * eo(cl(age / 0.9)), sz = r.range(7, 16) * (1 - cl(age / 1.4));
      spark(x, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, sz, r.pick(['#ffffff', '#ffe28a', '#9ff7ff', '#ffb0d0']), 1);
    }
  }
  function header(x, a) { pill(x, 132, 44, 'InfuSafe', 30, { a, bg: 'rgba(255,255,255,0.95)' }); }

  // ---------------- new subjects for this story ----------------
  // a soft rounded rectangle object with the style's flat stepped shading
  function slab(x, X, Y, w, h, r, col, o = {}) {
    const g = x.createLinearGradient(X, Y, X + w * 0.6, Y + h);
    g.addColorStop(0, col[0]); g.addColorStop(0.45, col[1]); g.addColorStop(1, H.rgba(H.mix(col[1], col[2], 0.6)));
    x.fillStyle = 'rgba(10,8,46,0.35)'; rr(x, X + 6, Y + 12, w, h, r); x.fill();
    x.fillStyle = g; rr(x, X, Y, w, h, r); x.fill();
    x.save(); rr(x, X, Y, w, h, r); x.clip();
    x.fillStyle = H.rgba(col[2], 0.32); rr(x, X + w * 0.12, Y + h * 0.18, w, h, r); x.fill();
    x.fillStyle = H.rgba(col[2], 0.18); rr(x, X + w * 0.3, Y + h * 0.42, w, h, r); x.fill();
    x.restore();
    x.save(); rr(x, X, Y, w, h, r); x.clip();
    x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = Math.max(3, w * 0.025); rr(x, X + 2, Y + 2, w, h, r); x.stroke();
    x.restore();
  }

  // IV bag hanging on a hook, fluid inside, drip chamber with falling drops
  function ivBag(x, cx, cy, s, t, o = {}) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    // hook
    x.strokeStyle = '#c9d4ff'; x.lineWidth = 8; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, -150); x.lineTo(0, -122); x.stroke();
    x.beginPath(); x.arc(0, -112, 10, 0, TAU); x.stroke();
    // pouch
    const pouch = () => { x.beginPath(); x.moveTo(-58, -100); x.quadraticCurveTo(0, -112, 58, -100); x.quadraticCurveTo(78, -20, 66, 60); x.quadraticCurveTo(0, 92, -66, 60); x.quadraticCurveTo(-78, -20, -58, -100); x.closePath(); };
    glow(x, 0, -10, 150, '#9ff7ff', 0.18);
    x.fillStyle = 'rgba(10,8,46,0.35)'; x.save(); x.translate(6, 10); pouch(); x.fill(); x.restore();
    const g = x.createLinearGradient(-70, -100, 60, 80); g.addColorStop(0, 'rgba(235,250,255,0.95)'); g.addColorStop(1, 'rgba(160,200,255,0.75)');
    x.fillStyle = g; pouch(); x.fill();
    x.save(); pouch(); x.clip();
    const lvl = -30 + (o.drain || 0) * 30, fg = x.createLinearGradient(0, lvl, 0, 90);
    fg.addColorStop(0, '#ffd27a'); fg.addColorStop(1, '#ff8d3f');
    x.fillStyle = fg; x.beginPath(); x.moveTo(-90, lvl); for (let i = 0; i <= 12; i++) x.lineTo(-90 + i * 15, lvl + Math.sin(t * 2.2 + i * 0.8) * 3); x.lineTo(90, 100); x.lineTo(-90, 100); x.fill();
    x.fillStyle = 'rgba(210,74,42,0.28)'; x.fillRect(10, lvl, 90, 120);
    // label
    x.fillStyle = 'rgba(255,255,255,0.92)'; rr(x, -38, -78, 76, 40, 8); x.fill();
    x.fillStyle = '#ff5d8f'; rr(x, -30, -70, 40, 7, 3); x.fill();
    x.fillStyle = '#9aa6d8'; rr(x, -30, -58, 56, 5, 2); x.fill(); rr(x, -30, -49, 44, 5, 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)'; rr(x, -60, -88, 10, 120, 5); x.fill();
    x.restore();
    // neck and drip chamber
    x.fillStyle = '#d7e3ff'; rr(x, -9, 72, 18, 22, 5); x.fill();
    x.fillStyle = 'rgba(210,235,255,0.85)'; rr(x, -20, 92, 40, 58, 14); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; rr(x, -14, 97, 6, 46, 3); x.fill();
    if (o.drip !== false) {
      const u = (t * 1.6) % 1;
      x.fillStyle = '#ff9d4f'; x.beginPath(); x.ellipse(0, 100 + u * 36, 5, 7, 0, 0, TAU); x.fill();
    }
    x.fillStyle = '#ffb25a'; rr(x, -16, 134, 32, 12, 6); x.fill();
    x.restore();
  }

  // the infusion pump: a rounded box with a screen, keys and a roller window
  function pump(x, cx, cy, s, t, o = {}) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    const red = o.red || 0;
    if (red > 0) glow(x, 0, 0, 260, C.red, 0.45 * red);
    // pole clamp
    x.fillStyle = '#5a6ab8'; rr(x, -150, -18, 40, 36, 10); x.fill();
    slab(x, -125, -100, 250, 200, 34, ['#bdf8ff', '#46c2e0', '#1d4f9c']);
    // screen
    const sg = x.createLinearGradient(-95, -75, 95, 5); sg.addColorStop(0, '#26338e'); sg.addColorStop(1, '#0d1246');
    x.fillStyle = '#0a0f3c'; rr(x, -98, -76, 196, 88, 18); x.fill();
    x.fillStyle = sg; rr(x, -95, -79, 190, 84, 16); x.fill();
    x.fillStyle = 'rgba(160,240,255,0.18)'; rr(x, -80, -72, 90, 7, 3); x.fill();
    const scr = o.screen || '50 mL/h';
    x.font = F(900, o.screenPx || 40); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = red > 0.5 ? '#ff8da0' : '#9ff7ff'; x.fillText(scr, 0, -36);
    // keys
    ['#ffd23f', '#38e08e', '#ff5d8f'].forEach((c, i) => ball(x, -62 + i * 44, 52, 15, [H.rgba(H.mix(c, '#ffffff', 0.5)), c, H.rgba(H.mix(c, '#000000', 0.45))], { sha: 0.35 }));
    // roller window (spins while running)
    x.fillStyle = '#0d1246'; rr(x, 62, 28, 46, 46, 14); x.fill();
    const run = o.run == null ? 1 : o.run;
    x.save(); x.translate(85, 51); x.rotate(t * 5 * run);
    x.fillStyle = '#9ff7ff'; for (let i = 0; i < 3; i++) { x.rotate(TAU / 3); x.beginPath(); x.arc(0, -11, 6, 0, TAU); x.fill(); }
    x.restore();
    x.restore();
  }

  // the patient: a round big-eyed character with a soft beanie, under a blanket
  function patient(x, cx, cy, r, t, o = {}) {
    if (r <= 1) return;
    x.save(); x.translate(cx, cy);
    // blanket / body
    const bg = x.createLinearGradient(-r * 1.4, r * 0.5, r * 1.4, r * 1.6);
    bg.addColorStop(0, '#8f7bff'); bg.addColorStop(1, '#4a2f9c');
    x.fillStyle = 'rgba(10,8,46,0.35)'; rr(x, -r * 1.35 + 6, r * 0.55 + 10, r * 2.7, r * 1.1, r * 0.5); x.fill();
    x.fillStyle = bg; rr(x, -r * 1.35, r * 0.55, r * 2.7, r * 1.1, r * 0.5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.22)'; rr(x, -r * 1.1, r * 0.66, r * 1.6, r * 0.1, r * 0.05); x.fill();
    // arm where the line goes in
    ball(x, -r * 1.05, r * 0.6, r * 0.3, C.tan, { sha: 0.4 });
    x.fillStyle = 'rgba(255,255,255,0.9)'; rr(x, -r * 1.22, r * 0.5, r * 0.3, r * 0.16, r * 0.05); x.fill();
    // head
    ball(x, 0, 0, r, C.tan, { sha: 0.42, inner: () => {
      x.fillStyle = 'rgba(255,150,150,0.35)'; x.beginPath(); x.arc(-r * 0.55, r * 0.28, r * 0.17, 0, TAU); x.arc(r * 0.55, r * 0.28, r * 0.17, 0, TAU); x.fill();
    } });
    // beanie
    x.save(); x.beginPath(); x.arc(0, 0, r * 1.02, Math.PI * 1.02, Math.PI * 1.98); x.closePath();
    const hg = x.createLinearGradient(-r, -r, r, 0); hg.addColorStop(0, '#ffc1d8'); hg.addColorStop(1, '#de4b93');
    x.fillStyle = hg; x.fill(); x.restore();
    x.fillStyle = '#ff8fb8'; rr(x, -r * 1.02, -r * 0.2, r * 2.04, r * 0.24, r * 0.12); x.fill();
    ball(x, 0, -r * 1.05, r * 0.18, C.rose, { sha: 0.3 });
    const worry = o.worry || 0, happy = o.happy || 0;
    for (const sd of [-1, 1]) eye(x, sd * r * 0.34, r * 0.12, r * 0.2, { look: o.look || [-0.4, 0], blink: blinkAt(t, 0.8), happy, worry: worry > 0.5 });
    x.strokeStyle = '#7a3a2e'; x.lineWidth = r * 0.06; x.lineCap = 'round'; x.beginPath();
    const my = r * 0.5;
    if (worry > 0.5) { x.moveTo(-r * 0.12, my + r * 0.04); x.quadraticCurveTo(0, my - r * 0.06, r * 0.12, my + r * 0.04); }
    else x.arc(0, my - r * 0.08, r * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
    x.stroke();
    x.restore();
  }

  // the tube from bag to pump to patient; kink at fraction ku bends it into a V
  function tubePath(P, n, kink, ku) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n; let [px, py] = bez(P, u);
      if (kink > 0) {
        const d = Math.abs(u - ku), w = 0.06;
        if (d < w) { const e = bez(P, Math.min(1, u + 0.01)), b0 = bez(P, Math.max(0, u - 0.01)); const ang = Math.atan2(e[1] - b0[1], e[0] - b0[0]); const amt = kink * 46 * (1 - d / w); px += Math.cos(ang + Math.PI / 2) * amt; py += Math.sin(ang + Math.PI / 2) * amt; }
      }
      pts.push([px, py]);
    }
    return pts;
  }
  function tube(x, P, t, o = {}) {
    const prog = o.prog == null ? 1 : o.prog;
    const pts = tubePath(P, 80, o.kink || 0, o.ku || 0.5), m = Math.max(2, Math.round(pts.length * prog));
    if (prog <= 0) return pts;
    const line = (lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < m; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); };
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    x.save(); x.translate(3, 7); line(16, 'rgba(10,8,46,0.35)'); x.restore();
    line(16, 'rgba(205,232,255,0.92)'); line(8, 'rgba(255,190,110,0.9)'); line(3, 'rgba(255,255,255,0.65)');
    // flowing dots
    if (o.flow > 0) for (let i = 0; i < 7; i++) { const u = ((t * 0.28 * o.flow + i / 7) % 1) * prog; const p = pts[Math.floor(u * (pts.length - 1))]; glow(x, p[0], p[1], 16, '#ffb25a', 0.55); x.fillStyle = '#fff0c8'; x.beginPath(); x.arc(p[0], p[1], 4.5, 0, TAU); x.fill(); }
    if ((o.kink || 0) > 0.05) { const p = pts[Math.round((o.ku || 0.5) * 80)]; glow(x, p[0], p[1], 90, C.red, 0.6 * o.kink); }
    x.restore();
    return pts;
  }
  // glossy air bubble
  function bubbleDot(x, cx, cy, r, a = 1) {
    if (r <= 0.5 || a <= 0) return;
    x.save(); x.globalAlpha *= a;
    glow(x, cx, cy, r * 3, '#c9f6ff', 0.5);
    x.fillStyle = 'rgba(220,250,255,0.55)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = r * 0.16; x.beginPath(); x.arc(cx, cy, r * 0.92, 0, TAU); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.38, r * 0.22, 0, TAU); x.fill();
    x.restore();
  }

  // the guardian: InfuSafe as a round gold character with a visor and a shield badge
  function guardian(x, cx, cy, R, t, o = {}) {
    if (R < 1) return;
    const happy = o.happy || 0, alert = o.alert || 0;
    glow(x, cx, cy, R * 2.2, alert > 0 ? '#ff5d8f' : '#ffd23f', 0.28 + 0.25 * alert);
    // antenna with a blinking light (the 1 kHz heartbeat)
    const beat = 0.5 + 0.5 * Math.sin(t * 12);
    x.strokeStyle = '#c47a12'; x.lineWidth = R * 0.08; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx, cy - R * 0.95); x.lineTo(cx + R * 0.08, cy - R * 1.32); x.stroke();
    glow(x, cx + R * 0.08, cy - R * 1.4, R * 0.5, C.green, 0.4 + 0.4 * beat);
    ball(x, cx + R * 0.08, cy - R * 1.4, R * 0.13, ['#c8ffe0', C.green, '#178a5a'], { sha: 0.3 });
    // arms
    for (const sd of [-1, 1]) {
      const up = (o.armUp || 0) * (sd > 0 ? 1 : 0.6), ang = sd * (0.55 + 0.1 * Math.sin(t * 2.2 + sd)) - sd * up * 1.6;
      const sx = cx + sd * R * 0.86, sy = cy + R * 0.12, ex = sx + Math.sin(ang) * R * 0.55, ey = sy + Math.cos(ang) * R * 0.55;
      x.strokeStyle = '#c47a12'; x.lineWidth = R * 0.24; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
      ball(x, ex, ey, R * 0.17, C.gold, { sha: 0.4 });
    }
    ball(x, cx, cy, R, C.gold, { sha: 0.5 });
    // visor
    const vw = R * 1.36, vh = R * 0.7, vx = cx - vw / 2, vy = cy - R * 0.5;
    const vg = x.createLinearGradient(vx, vy, vx + vw, vy + vh); vg.addColorStop(0, '#26338e'); vg.addColorStop(1, '#0d1246');
    x.fillStyle = '#0a0f3c'; rr(x, vx, vy + R * 0.05, vw, vh, R * 0.32); x.fill();
    x.fillStyle = vg; rr(x, vx, vy, vw, vh, R * 0.32); x.fill();
    x.fillStyle = 'rgba(160,240,255,0.22)'; rr(x, vx + R * 0.16, vy + R * 0.07, vw * 0.45, R * 0.07, R * 0.035); x.fill();
    for (const sd of [-1, 1]) eye(x, cx + sd * R * 0.3, vy + vh * 0.5, R * 0.18, { look: o.look || [0, 0], blink: blinkAt(t, 0.3), happy });
    // shield emblem with a check
    const sx = cx, sy = cy + R * 0.5, ss = R * 0.26;
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(sx, sy - ss); x.lineTo(sx + ss * 0.85, sy - ss * 0.6); x.quadraticCurveTo(sx + ss * 0.8, sy + ss * 0.6, sx, sy + ss); x.quadraticCurveTo(sx - ss * 0.8, sy + ss * 0.6, sx - ss * 0.85, sy - ss * 0.6); x.closePath(); x.fill();
    x.strokeStyle = C.green; x.lineWidth = ss * 0.26; x.lineJoin = 'round'; x.beginPath(); x.moveTo(sx - ss * 0.4, sy); x.lineTo(sx - ss * 0.08, sy + ss * 0.32); x.lineTo(sx + ss * 0.42, sy - ss * 0.3); x.stroke();
  }

  // a CPU chip, for "one program does everything"
  function chip(x, cx, cy, s, o = {}) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = '#9aa6d8';
    for (let i = -3; i <= 3; i++) for (const sd of [-1, 1]) { rr(x, i * 30 - 7, sd * 118 - 14, 14, 28, 5); x.fill(); rr(x, sd * 118 - 14, i * 30 - 7, 28, 14, 5); x.fill(); }
    slab(x, -105, -105, 210, 210, 30, ['#5a6ad8', '#2a2f8e', '#120f4a']);
    const busy = o.busy || 0;
    glow(x, 0, 0, 120, busy > 0.5 ? '#ff8d3f' : '#56e8ff', 0.35 + 0.3 * busy);
    x.strokeStyle = 'rgba(160,240,255,0.5)'; x.lineWidth = 4; rr(x, -62, -62, 124, 124, 18); x.stroke();
    x.restore();
  }
  // a small round clock face
  function clock(x, cx, cy, r, t, o = {}) {
    if (r <= 1) return;
    ball(x, cx, cy, r, ['#ffffff', '#e4e8ff', '#8f8fd8'], { sha: 0.3 });
    x.save(); x.translate(cx, cy); x.strokeStyle = C.ink; x.lineCap = 'round';
    x.lineWidth = r * 0.12; x.beginPath(); x.moveTo(0, 0); const a1 = t * (o.speed || 3); x.lineTo(Math.sin(a1) * r * 0.62, -Math.cos(a1) * r * 0.62); x.stroke();
    x.lineWidth = r * 0.14; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(a1 / 12) * r * 0.4, -Math.cos(a1 / 12) * r * 0.4); x.stroke();
    x.restore();
  }
  // STOP stamp
  function stamp(x, cx, cy, s, label) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.rotate(-0.12); x.scale(s, s);
    glow(x, 0, 0, 220, C.red, 0.5);
    x.fillStyle = 'rgba(10,8,46,0.45)'; rr(x, -150, -52, 300, 112, 30); x.fill();
    x.fillStyle = C.red; rr(x, -150, -60, 300, 112, 30); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 7; rr(x, -138, -48, 276, 88, 22); x.stroke();
    x.font = F(900, 70); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText(label || 'STOP', 0, -2);
    x.restore();
  }

  // ---------------- layout ----------------
  const BAG = [215, 230], PUMP = [560, 440], PAT = [1040, 430], PATR = 112;
  const TUBE1 = [[BAG[0], BAG[1] + 150], [BAG[0], 420], [330, 450], [PUMP[0] - 128, 440]];
  const TUBE2 = [[PUMP[0] + 128, 440], [760, 450], [840, 560], [PAT[0] - PATR * 1.12, PAT[1] + PATR * 0.62]];

  // ================= SCENE A: the setup, what goes wrong, how often =================
  function sceneA(x, W, H_, t) {
    const pull = eio(seg(t, TL.pull[0], TL.pull[1]));
    const dive = H.ease.in(seg(t, TL.dive[0], TL.dive[1]));
    const zIntro = 1 + 0.9 * (1 - eo(seg(t, 0, 1.6)));
    sky(x, W, H_, t, { z: zIntro * (1 - 0.25 * pull) * Math.exp(Math.log(9) * dive), x: t * 10 });
    // camera: pull back for the number, then dive into the pump screen
    const zc = (1 - 0.32 * pull) * Math.exp(Math.log(9) * dive);
    const fx = lerp(640, PUMP[0], dive), fy = lerp(360 + 40 * pull, PUMP[1] - 36, dive);
    x.save(); x.translate(640, 360 + 70 * pull); x.scale(zc, zc); x.translate(-fx, -fy);

    planet(x, 1160 - t * 4, 110, 46, PL.moon);
    planet(x, 90 + t * 3, 640, 70, PL.coral, { glowA: 0.22 });

    const bagS = back(seg(t, TL.bagIn[0], TL.bagIn[1]), 1.3), pumpS = back(seg(t, TL.pumpIn[0], TL.pumpIn[1]), 1.3), patS = back(seg(t, TL.patIn[0], TL.patIn[1]), 1.3);
    const flowP = eio(seg(t, TL.flow[0], TL.flow[1]));
    const kinkK = eo(seg(t, TL.kink, TL.kink + 0.35)), airU = seg(t, TL.air, TL.air + 1.6), typo = seg(t, TL.typo, TL.typo + 0.12);
    const bad = kinkK > 0.5;

    tube(x, TUBE1, t, { prog: eio(seg(t, 3.2, 3.8)), flow: flowP * (bad ? 0.2 : 1) });
    const p2 = tube(x, TUBE2, t, { prog: eio(seg(t, 3.4, 4.0)), flow: flowP * (bad ? 0 : 1), kink: kinkK, ku: 0.42 });
    ivBag(x, BAG[0], BAG[1], bagS, t);
    const scr = typo > 0.5 ? '500 mL/h' : '50 mL/h';
    pump(x, PUMP[0], PUMP[1], pumpS, t, { screen: scr, red: typo > 0.5 ? 0.6 + 0.4 * Math.sin(t * 8) : 0, run: bad ? 0.3 : 1 });
    patient(x, PAT[0], PAT[1] + Math.sin(t * 1.6) * 4, PATR * patS, t, { worry: t > TL.kink + 0.3 ? 1 : 0, look: [-0.6, 0.1] });

    // air bubble rides along the first tube
    if (airU > 0 && airU < 1) { const p = bez(TUBE1, 0.15 + 0.8 * eio(airU)); bubbleDot(x, p[0], p[1], 15); }
    if (t > TL.air + 1.6) { const p = bez(TUBE1, 0.95); bubbleDot(x, p[0], p[1], 15, 1 - seg(t, TL.pull[0], TL.pull[0] + 0.4)); }

    // labels for the setup
    const lblOut = 1 - seg(t, 9.4, 9.9);
    pill(x, BAG[0] + 150, 260, 'IV bag', 32, { s: back(seg(t, TL.lbl[0], TL.lbl[0] + 0.35)), a: lblOut, bg: '#ffffff' });
    pill(x, PUMP[0], 290, 'Pump', 32, { s: back(seg(t, TL.lbl[0] + 0.4, TL.lbl[0] + 0.75)), a: lblOut, bg: C.yellow, ptr: true });
    pill(x, PAT[0], 258, 'Patient', 32, { s: back(seg(t, TL.lbl[0] + 0.8, TL.lbl[0] + 1.15)), a: lblOut, bg: '#ffffff', ptr: true });
    // dotted "flow" arrow above the line
    arrow(x, [[300, 150], [520, 90], [800, 120], [930, 260]], flowP, '#ffcf8a', 9, { dots: true, a: 0.8 * lblOut });
    text(x, 'drug flows to the vein', 640, 200, 32, '#ffe2b8', { a: seg(t, TL.flow[1] - 0.3, TL.flow[1]) * lblOut, w: 800 });

    // what goes wrong: three problems, each a red badge and a label
    const probOut = 1 - seg(t, TL.pull[0] + 0.6, TL.pull[0] + 1.0);
    const kp = p2[Math.round(0.42 * 80)];
    badge(x, kp[0] + 4, kp[1] + 70, 32, false, back(seg(t, TL.kink + 0.2, TL.kink + 0.5), 2.2) * probOut);
    pill(x, kp[0] + 4, kp[1] + 140, 'Kinked tube', 32, { s: back(seg(t, TL.kink + 0.3, TL.kink + 0.6)), a: probOut, bg: C.red, fg: '#ffffff' });
    const bp = bez(TUBE1, 0.95);
    badge(x, bp[0] - 30, bp[1] + 70, 32, false, back(seg(t, TL.air + 1.5, TL.air + 1.8), 2.2) * probOut);
    pill(x, bp[0] - 50, bp[1] + 140, 'Air in the line', 32, { s: back(seg(t, TL.air + 1.6, TL.air + 1.9)), a: probOut, bg: C.red, fg: '#ffffff' });
    badge(x, PUMP[0] + 140, PUMP[1] - 120, 32, false, back(seg(t, TL.typo + 0.1, TL.typo + 0.4), 2.2) * probOut);
    pill(x, PUMP[0], PUMP[1] - 160, '500, not 50', 34, { s: back(seg(t, TL.typo + 0.2, TL.typo + 0.5)), a: probOut, bg: C.red, fg: '#ffffff', ptr: true });
    x.restore();

    // how often: big counter over the dimmed scene
    if (t > TL.count[0] - 0.4) {
      const ca = seg(t, TL.count[0] - 0.4, TL.count[0]) * (1 - seg(t, TL.dive[0], TL.dive[0] + 0.3));
      x.save(); x.globalAlpha = ca * 0.8; x.fillStyle = '#090b2c'; x.fillRect(0, 0, W, H_); x.restore();
      const v = Math.round(56000 * Math.pow(seg(t, TL.count[0], TL.count[1]), 2.2));
      const land = seg(t, TL.count[1], TL.count[1] + 0.35), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      flare(x, 640, 300, land > 0 ? Math.max(0, 1 - Math.abs(t - TL.count[1] - 0.2) / 0.8) : 0, t);
      x.save(); x.translate(640, 290); x.scale(pop, pop); x.globalAlpha = ca;
      text(x, v.toLocaleString('en-US'), 0, 0, 150, land > 0 ? C.yellow : '#ffffff'); x.restore();
      text(x, 'reports of pump problems', 640, 410, 48, '#ffffff', { a: ca * seg(t, TL.count[0] + 0.3, TL.count[0] + 0.7) });
      text(x, 'sent to the FDA, 2005 to 2009', 640, 470, 34, '#bfe9ff', { a: ca * seg(t, TL.count[0] + 0.6, TL.count[0] + 1.0), w: 800 });
      burst(x, 640, 290, land * 1.2, 77, 320);
    }

    // title hook, then it shrinks into the corner header
    const tp = eio(seg(t, TL.shrink[0], TL.shrink[1]));
    if (tp < 1) {
      const words = [['When', '#ffffff'], ['a', '#ffffff'], ['chemo', C.yellow], ['pump', '#ffffff'], ['goes', '#ffffff'], ['wrong', C.pink]], px = 70;
      x.font = F(900, px);
      const sp = x.measureText(' ').width, ws = words.map(([w]) => x.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      const cx = lerp(640, 132, tp), cy = lerp(340, 44, tp), sc = lerp(1, 30 / px, tp);
      x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = 1 - seg(tp, 0.6, 0.9);
      let wx = -tot / 2;
      words.forEach(([w, c], i) => {
        const u = back(seg(t, TL.title + i * 0.11, TL.title + i * 0.11 + 0.4), 1.2);
        x.save(); x.translate(wx + ws[i] / 2, (1 - u) * 40); x.scale(u, u); text(x, w, 0, 0, px, c); x.restore();
        wx += ws[i] + sp;
      });
      x.restore();
    }
  }

  // ================= SCENE B: inside today's pump, one program does everything =================
  const QUEUE = [['Screen', '#ffffff'], ['Buttons', '#ffffff'], ['Motor', '#ffffff'], ['Logs', '#ffffff'], ['Alarm check', '#ff8d3f']];
  function sceneB(x, W, H_, t) {
    const em = 1 + 1.4 * (1 - eo(seg(t, TL.dive[1], TL.dive[1] + 0.8)));
    sky(x, W, H_, t, { z: em, x: 200 + t * 14, tint: '#3a5cc6' });
    x.save(); x.translate(640, 360); x.scale(em, em); x.translate(-640, -360);
    const cIn = back(seg(t, TL.chipIn, TL.chipIn + 0.5), 1.3);
    const busy = seg(t, TL.queue[0] + 1.0, TL.queue[0] + 1.6);
    chip(x, 860, 420, cIn, { busy });
    text(x, 'one program', 860, 420, 40, '#ffffff', { a: seg(t, TL.chipIn + 0.3, TL.chipIn + 0.6) });
    text(x, 'When one program does it all', 640, 92, 52, '#ffffff', { a: seg(t, TL.chipIn, TL.chipIn + 0.4) });
    // tasks queue up and enter the chip one at a time; the alarm check waits at the back
    const qa = seg(t, TL.queue[0], TL.queue[0] + 0.3);
    arrow(x, [[110, 420], [300, 420], [520, 420], [700, 420]], eio(seg(t, TL.queue[0], TL.queue[0] + 0.6)), '#9ff7ff', 8, { dots: true, a: 0.7 * qa });
    const served = Math.floor(cl((t - (TL.queue[0] + 1.0)) / 0.75, 0, 3.999)); // how many tasks went in
    QUEUE.forEach(([lab, col], i) => {
      const enter = TL.queue[0] + 0.15 * i;
      const s = back(seg(t, enter, enter + 0.35));
      let slot = i - (t > TL.queue[0] + 1.0 ? served : 0);
      let px = 600 - slot * 118, py = 420;
      if (slot < 0) { px = 860; s * 0; }
      const into = slot < 0 ? 1 : 0;
      const isAlarm = i === QUEUE.length - 1;
      const waitK = isAlarm ? seg(t, TL.waitT, TL.waitT + 0.3) : 0;
      if (!into) pill(x, px, py + (i % 2 ? 70 : -70), lab, 32, { s, bg: isAlarm ? (waitK > 0 ? C.red : C.orange[1]) : col, fg: isAlarm ? '#ffffff' : C.ink, ptr: false });
    });
    // the alarm check waits: a clock and a "waiting..." label
    const wk = seg(t, TL.waitT, TL.waitT + 0.3);
    const alarmX = 600 - (QUEUE.length - 1 - served) * 118;
    clock(x, alarmX, 600, 44 * back(wk, 2), t, { speed: 8 });
    text(x, 'safety check waits', alarmX + 30 > 640 ? 640 : 640, 660, 36, '#ffb0c8', { a: wk });
    x.restore();
  }

  // ================= SCENE C: InfuSafe, priorities, the catch, takeaway =================
  const PUMPC = [330, 440], GU = [760, 400], GUR = 104;
  const LANES = [['Safety check', '50', C.yellow], ['Sensor', '40', '#9ff7ff'], ['Screen and logs', '5', '#d9dcff']];
  function sceneC(x, W, H_, t) {
    const tk = eio(seg(t, TL.take[0], TL.take[1]));
    sky(x, W, H_, t, { x: 600 + t * 16, y: -tk * 240, z: 1 });
    const lanesK = eio(seg(t, TL.lanes[0], TL.lanes[1])) * (1 - eio(seg(t, TL.back[0], TL.back[1])));
    x.save(); x.globalAlpha = 1 - lanesK;
    planet(x, 1250 - (t - 32) * 4, 700, 96, PL.magenta, { glowA: 0.26 });
    x.restore();
    planet(x, 120 + (t - 32) * 3, 110, 30, PL.moon);
    const sceneA_ = 1 - lanesK;

    // the pump and the guardian, linked by a sensor line (hidden while the lanes show)
    x.save(); x.globalAlpha = sceneA_ * (1 - tk);
    const caught1 = t > TL.stop1, caught2 = t > TL.stop2;
    const kinkK = eo(seg(t, TL.kink2, TL.kink2 + 0.25)) * (1 - seg(t, TL.air2 - 0.6, TL.air2 - 0.3));
    const tubeC = [[PUMPC[0] + 128, 440], [470, 560], [560, 640], [700, 690]];
    tube(x, tubeC, t, { flow: caught1 && t < TL.air2 - 0.3 ? 0 : caught2 ? 0 : 1, kink: kinkK, ku: 0.45 });
    pump(x, PUMPC[0], PUMPC[1], 1, t, { screen: (caught1 && t < TL.air2 - 0.3) || caught2 ? 'STOPPED' : '50 mL/h', screenPx: 36, run: (caught1 && t < TL.air2 - 0.3) || caught2 ? 0 : 1 });
    const air2 = seg(t, TL.air2 - 0.5, TL.air2);
    if (air2 > 0 && t < TL.stop2 + 2.2) { const p = bez(tubeC, 0.1 + 0.5 * eio(air2)); bubbleDot(x, p[0], p[1], 15); }
    // sensor link: dotted arrows both ways
    const lk = eio(seg(t, TL.link[0], TL.link[1]));
    arrow(x, [[PUMPC[0] + 130, 380], [520, 300], [600, 300], [GU[0] - GUR * 1.1, GU[1] - 30]], lk, '#9ff7ff', 8, { dots: true, a: 0.8 });
    pill(x, 545, 262, 'reads the sensors', 28, { s: back(seg(t, TL.link[1] - 0.1, TL.link[1] + 0.25)), bg: '#ffffff', a: 1 - seg(t, TL.tick[1], TL.tick[1] + 0.4) });
    const gIn = back(seg(t, TL.guardIn[0], TL.guardIn[1]), 1.3);
    const alert = Math.max(0, 1 - Math.abs(t - TL.stop1) / 0.5) + Math.max(0, 1 - Math.abs(t - TL.stop2) / 0.5);
    guardian(x, GU[0], GU[1] + Math.sin(t * 1.8) * 7, GUR * gIn, t, { look: t > TL.kink2 ? [-1, 0.6] : [-0.8, -0.1], alert: cl(alert), happy: t > TL.stop2 + 1.6 ? 1 : 0 });
    pill(x, GU[0], GU[1] + GUR * 1.45, 'InfuSafe', 34, { s: back(seg(t, TL.guardIn[1], TL.guardIn[1] + 0.3)), bg: C.yellow });
    pill(x, GU[0], GU[1] + GUR * 1.45 + 64, 'runs on QNX', 30, { s: back(seg(t, TL.qnx, TL.qnx + 0.3)), bg: '#ffffff' });
    // 1,000 checks a second
    const tka = seg(t, TL.tick[0] - 0.2, TL.tick[0]) * (1 - seg(t, TL.lanes[0] - 0.4, TL.lanes[0]));
    if (tka > 0) {
      const v = Math.round(1000 * eio(seg(t, TL.tick[0], TL.tick[1] - 0.6)));
      const land = seg(t, TL.tick[1] - 0.6, TL.tick[1] - 0.25), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      x.save(); x.translate(1030, 250); x.scale(pop, pop); text(x, v.toLocaleString('en-US'), 0, 0, 112, land > 0 ? C.yellow : '#ffffff', { a: tka }); x.restore();
      text(x, 'checks every second', 1030, 340, 34, '#bfe9ff', { a: tka, w: 800 });
      // heartbeat rings around the guardian
      for (let i = 0; i < 3; i++) { const u = (t * 1.4 + i / 3) % 1; x.save(); x.globalAlpha = tka * (1 - u) * 0.7; x.strokeStyle = C.yellow; x.lineWidth = 5; x.beginPath(); x.arc(GU[0], GU[1], GUR * (1.15 + u * 0.9), 0, TAU); x.stroke(); x.restore(); }
    }
    // the catches
    stamp(x, PUMPC[0], PUMPC[1] - 175, back(seg(t, TL.stop1, TL.stop1 + 0.25), 2.4) * (1 - seg(t, TL.air2 - 0.6, TL.air2 - 0.3)), 'STOP');
    stamp(x, PUMPC[0], PUMPC[1] - 175, back(seg(t, TL.stop2, TL.stop2 + 0.25), 2.4) * (1 - seg(t, TL.take[0], TL.take[0] + 0.3)), 'STOP');
    const n1 = seg(t, TL.stop1 + 0.2, TL.stop1 + 0.5) * (1 - seg(t, TL.air2 - 0.6, TL.air2 - 0.3));
    const n2 = seg(t, TL.stop2 + 0.2, TL.stop2 + 0.5) * (1 - seg(t, TL.take[0], TL.take[0] + 0.3));
    for (const [k, num, lab, tt] of [[n1, '10 ms', 'blocked line stopped in', TL.stop1], [n2, '3 ms', 'air bubble stopped in', TL.stop2]]) {
      if (k <= 0) continue;
      const pop = 1 + 0.22 * Math.sin(seg(t, tt + 0.2, tt + 0.55) * Math.PI);
      flare(x, 1020, 300, Math.max(0, 1 - Math.abs(t - tt - 0.3) / 0.7), t);
      text(x, lab, 1020, 190, 36, '#ffffff', { a: k, w: 800 });
      x.save(); x.translate(1020, 300); x.scale(pop, pop); text(x, num, 0, 0, 136, C.yellow, { a: k }); x.restore();
      text(x, 'about, in our tests', 1020, 400, 28, '#bfe9ff', { a: k, w: 800 });
      burst(x, 1020, 300, (t - tt - 0.2) * 1.2, Math.round(tt * 10), 300);
    }
    x.restore();

    // priority lanes: the safety check always goes first
    if (lanesK > 0.01) {
      x.save(); x.globalAlpha = lanesK;
      text(x, 'Safety goes first', 640, 120, 56, '#ffffff');
      const race = seg(t, TL.race[0], TL.race[1]);
      LANES.forEach(([lab, pr, col], i) => {
        const y = 270 + i * 140, li = back(seg(t, TL.lanes[0] + i * 0.15, TL.lanes[0] + i * 0.15 + 0.4));
        x.save(); x.translate(0, (1 - li) * 40);
        text(x, lab, 300, y - 20, 32, '#ffffff', { align: 'right', w: 900 });
        pill(x, 210, y + 30, 'priority ' + pr, 28, { bg: col });
        x.fillStyle = 'rgba(10,8,46,0.35)'; rr(x, 340 + 5, y - 34 + 8, 620, 68, 34); x.fill();
        x.fillStyle = 'rgba(160,170,255,0.18)'; rr(x, 340, y - 34, 620, 68, 34); x.fill();
        // the higher the priority, the sooner it reaches the CPU
        const delay = [0, 0.32, 0.62][i], u = eio(cl((race - delay) / 0.4));
        const tx = lerp(382, 930, u);
        if (i === 0) guardian(x, tx, y, 30, t, { happy: u >= 1 ? 1 : 0, look: [1, 0] });
        else ball(x, tx, y, 26, i === 1 ? C.teal : ['#ffffff', '#d9dcff', '#7a7fc8'], { sha: 0.35 });
        if (u >= 1 && i === 0) badge(x, 930, y - 50, 22, true, back(seg(t, TL.race[0] + 0.4, TL.race[0] + 0.7), 2));
        x.restore();
      });
      chip(x, 1100, 410, 0.72 * back(seg(t, TL.lanes[0] + 0.3, TL.lanes[0] + 0.7)), { busy: 0 });
      text(x, 'CPU', 1100, 410, 40, '#ffffff', { w: 900 });
      x.restore();
    }

    // takeaway: everyone on the horizon, the line lands
    if (tk > 0) {
      planet(x, 640, lerp(1400, 1120, tk), 700, PL.teal, { glowA: 0.3, atmo: 1 });
      const ps = back(seg(t, TL.take[0] + 0.4, TL.take[0] + 0.8)), gs = back(seg(t, TL.take[0] + 0.55, TL.take[0] + 0.95)), us = back(seg(t, TL.take[0] + 0.7, TL.take[0] + 1.1));
      pump(x, 360, 470 + (1 - ps) * 100, 0.62 * ps, t, { screen: '50 mL/h' });
      guardian(x, 640, 450 + Math.sin(t * 2) * 6 + (1 - gs) * 100, 80 * gs, t, { happy: 1, armUp: 1 });
      patient(x, 920, 430 + Math.sin(t * 2.2) * 5 + (1 - us) * 100, 66 * us, t, { happy: 1 });
      const l1 = back(seg(t, TL.line1, TL.line1 + 0.4)), l2 = back(seg(t, TL.line2, TL.line2 + 0.4));
      x.save(); x.translate(640, 112); x.scale(l1, l1); text(x, '100 of 100 faults caught', 0, 0, 66, C.yellow); x.restore();
      x.save(); x.translate(640, 196); x.scale(l2, l2); text(x, 'On time, every time.', 0, 0, 54, '#ffffff'); x.restore();
      if (t > TL.line2) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(120, 1160), q.range(60, 300), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.line2, TL.line2 + 0.4)); }
    }
  }


  // ================= REAL FOOTAGE: the problem, in a real hospital =================
  // Shots are JPG frame folders cut by cut_footage.sh (30 fps, 1280x720).
  const FPS = 30;
  const SHOTS = [
    { n: 'patient', a: 0.0, b: 4.0, len: 126 },
    { n: 'drip', a: 4.0, b: 6.4, len: 78 },
    { n: 'pumpline', a: 6.4, b: 8.4, len: 66 },
    { n: 'hand', a: 8.4, b: 10.4, len: 66 },
    { n: 'kink', a: 10.4, b: 12.9, len: 81 },
    { n: 'chamber', a: 12.9, b: 15.2, len: 75 },
    { n: 'nurse', a: 15.2, b: 18.0, len: 90 },
    { n: 'patient2', a: 18.0, b: 23.4, len: 168 },
    { n: 'keypad', a: 23.4, b: 24.7, len: 42 },
  ];
  const XF = 0.3; // cross-dissolve between shots
  const IMG = new Map();
  const frameKey = (sh, t) => sh.n + '/' + String(cl(Math.floor((t - sh.a) * FPS) + 1, 1, sh.len)).padStart(4, '0');
  function shotsAt(t) { // the shot on screen, plus the previous one while dissolving
    const i = SHOTS.findIndex((s) => t >= s.a && t < s.b);
    if (i < 0) return [];
    const out = [[SHOTS[i], 1]];
    if (i > 0 && t - SHOTS[i].a < XF) out.unshift([SHOTS[i - 1], 1]);
    return out;
  }
  window.prepare = async function (t) {
    const base = window.FOOTAGE_BASE || 'media/frames/';
    const need = shotsAt(t).map(([sh]) => frameKey(sh, Math.min(t, sh.b - 0.001)));
    await Promise.all(need.map((k) => {
      if (IMG.has(k)) return IMG.get(k).ready;
      const im = new Image(); im.ready = new Promise((res) => { im.onload = res; im.onerror = res; }); im.src = base + k + '.jpg';
      IMG.set(k, im); return im.ready;
    }));
    if (IMG.size > 90) { const keep = new Set(need); for (const k of [...IMG.keys()]) if (!keep.has(k) && IMG.size > 60) IMG.delete(k); }
  };
  function footage(x, W, H_, t) {
    const list = shotsAt(t);
    list.forEach(([sh], j) => {
      const im = IMG.get(frameKey(sh, Math.min(t, sh.b - 0.001)));
      const a = j === list.length - 1 && list.length > 1 ? eio(seg(t, sh.a, sh.a + XF)) : 1;
      x.save(); x.globalAlpha = a;
      // slow push-in on every shot; the keypad shot dives toward the screen
      const u = seg(t, sh.a, sh.b);
      let z = 1 + 0.06 * u, fx = 640, fy = 360;
      if (sh.n === 'keypad') { z = Math.exp(Math.log(3.2) * H.ease.in(u)); fx = 560; fy = 560; }
      x.translate(fx, fy); x.scale(z, z); x.translate(-fx, -fy);
      if (im && im.complete && im.naturalWidth) x.drawImage(im, 0, 0, W, H_);
      else { x.fillStyle = '#1a1840'; x.fillRect(0, 0, W, H_); }
      x.restore();
    });
    // grade the footage toward the explainer's night palette so it sits with the drawings
    x.save();
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(120,105,220,0.28)'; x.fillRect(0, 0, W, H_);
    x.globalCompositeOperation = 'source-over';
    const vg = x.createRadialGradient(640, 360, 260, 640, 360, 820); vg.addColorStop(0, 'rgba(9,11,44,0)'); vg.addColorStop(1, 'rgba(9,11,44,0.6)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H_);
    x.restore();
  }
  // a caption bar at the bottom of a shot
  function caption(x, s, t, a0, a1, top) {
    const k = seg(t, a0, a0 + 0.3) * (1 - seg(t, a1 - 0.25, a1));
    if (k <= 0) return;
    x.save(); x.globalAlpha = k;
    const g = top ? x.createLinearGradient(0, 160, 0, 0) : x.createLinearGradient(0, 560, 0, 720);
    g.addColorStop(0, 'rgba(9,11,44,0)'); g.addColorStop(1, 'rgba(9,11,44,0.85)');
    x.fillStyle = g; if (top) x.fillRect(0, 0, 1280, 180); else x.fillRect(0, 540, 1280, 180);
    x.restore();
    text(x, s, top ? 700 : 640, (top ? 64 : 650) + (1 - eo(k)) * 16, 40, '#ffffff', { a: k });
  }

  function sceneReal(x, W, H_, t) {
    footage(x, W, H_, t);

    // 1 HOOK: title over the real patient, then it shrinks into the corner header
    const tp = eio(seg(t, TL.shrink[0], TL.shrink[1]));
    if (tp < 1) {
      x.save(); x.globalAlpha = 0.5 * (1 - tp); x.fillStyle = '#090b2c'; x.fillRect(0, 0, W, H_); x.restore();
      const words = [['When', '#ffffff'], ['a', '#ffffff'], ['chemo', C.yellow], ['pump', '#ffffff'], ['goes', '#ffffff'], ['wrong', C.pink]], px = 70;
      x.font = F(900, px);
      const sp = x.measureText(' ').width, ws = words.map(([w]) => x.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      const cx = lerp(640, 132, tp), cy = lerp(340, 44, tp), sc = lerp(1, 30 / px, tp);
      x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = 1 - seg(tp, 0.6, 0.9);
      let wx = -tot / 2;
      words.forEach(([w, c], i) => {
        const u = back(seg(t, TL.title + i * 0.11, TL.title + i * 0.11 + 0.4), 1.2);
        x.save(); x.translate(wx + ws[i] / 2, (1 - u) * 40); x.scale(u, u); text(x, w, 0, 0, px, c); x.restore();
        wx += ws[i] + sp;
      });
      x.restore();
    }

    // 2 SETUP: bag, pump, vein
    pill(x, 640, 110, 'IV bag', 34, { s: back(seg(t, 4.25, 4.6)), a: 1 - seg(t, 6.2, 6.45), bg: '#ffffff' });
    caption(x, 'The drug drips from a bag', t, 4.4, 6.4);
    pill(x, 640, 430, 'Pump', 34, { s: back(seg(t, 6.6, 6.95)), a: 1 - seg(t, 8.2, 8.45), bg: C.yellow, ptr: true });
    arrow(x, [[600, 250], [520, 300], [540, 420], [600, 470]], eio(seg(t, 6.8, 7.5)), '#ffcf8a', 8, { dots: true, a: 0.85 * (1 - seg(t, 8.2, 8.45)) });
    caption(x, 'A pump pushes it down a thin tube', t, 6.7, 8.4);
    pill(x, 640, 190, 'Into the vein', 34, { s: back(seg(t, 8.6, 8.95)), a: 1 - seg(t, 10.2, 10.45), bg: '#ffffff', ptr: true });
    arrow(x, [[380, 620], [430, 520], [520, 420], [610, 330]], eio(seg(t, 8.7, 9.5)), '#ffcf8a', 8, { dots: true, a: 0.85 * (1 - seg(t, 10.2, 10.45)) });

    // 3 WHAT GOES WRONG, on the real footage
    // kink: a red V drawn over the real tube loop
    const kk = eo(seg(t, TL.kink + 0.1, TL.kink + 0.5)), kOut = 1 - seg(t, 12.7, 12.95);
    if (kk > 0) {
      x.save(); x.globalAlpha = kOut;
      glow(x, 370, 600, 170, C.red, 0.55 * kk);
      x.strokeStyle = C.red; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(290, 560); x.lineTo(290 + 80 * kk, 560 + 80 * kk); x.lineTo(290 + 160 * kk, 560); x.stroke();
      x.restore();
      badge(x, 370, 460, 34, false, back(seg(t, TL.kink + 0.4, TL.kink + 0.7), 2.2) * kOut);
      pill(x, 370, 385, 'Kinked tube', 36, { s: back(seg(t, TL.kink + 0.5, TL.kink + 0.8)), a: kOut, bg: C.red, fg: '#ffffff' });
      caption(x, 'Flow stops. Pressure builds.', t, TL.kink + 0.8, 12.9, true);
    }
    // air: a bubble slides down the real line under the drip chamber
    if (t > 12.9 && t < 15.2) {
      const aOut = 1 - seg(t, 15.0, 15.2);
      const u = ((t - 13.2) / 1.3) % 1;
      if (t > 13.2) { x.save(); x.globalAlpha = aOut; bubbleDot(x, 660, lerp(590, 700, eio(u)), 24); x.restore(); }
      badge(x, 900, 300, 34, false, back(seg(t, 13.5, 13.8), 2.2) * aOut);
      pill(x, 900, 380, 'Air in the line', 36, { s: back(seg(t, 13.6, 13.9)), a: aOut, bg: C.red, fg: '#ffffff', ptr: true });
      arrow(x, [[860, 420], [800, 520], [740, 600], [700, 640]], eio(seg(t, 13.8, 14.3)), C.red, 7, { dots: true, a: aOut });
    }
    // typo: what the nurse typed, shown as a pump screen card
    if (t > 15.2 && t < 18.0) {
      const nOut = 1 - seg(t, 17.8, 18.0), cs = back(seg(t, 15.5, 15.85), 1.4);
      x.save(); x.globalAlpha = nOut; x.translate(1010, 330); x.scale(cs, cs);
      glow(x, 0, 0, 220, C.red, 0.45);
      x.fillStyle = 'rgba(10,8,46,0.45)'; rr(x, -170 + 6, -70 + 10, 340, 140, 28); x.fill();
      x.fillStyle = '#0d1246'; rr(x, -170, -70, 340, 140, 28); x.fill();
      x.strokeStyle = 'rgba(255,93,143,0.9)'; x.lineWidth = 5; rr(x, -160, -60, 320, 120, 22); x.stroke();
      x.font = F(900, 72); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = Math.sin(t * 9) > 0 ? '#ff8da0' : '#ffd0da'; x.fillText('500', -40, 2);
      x.font = F(800, 34); x.fillStyle = '#ffb0c8'; x.fillText('mL/h', 95, 10);
      x.restore();
      arrow(x, [[1010, 410], [1060, 500], [1070, 600], [1050, 680]], eio(seg(t, 15.8, 16.3)), '#ff8da0', 7, { dots: true, a: nOut });
      badge(x, 1170, 250, 32, false, back(seg(t, 16.0, 16.3), 2.2) * nOut);
      pill(x, 1010, 175, '500, not 50', 38, { s: back(seg(t, 16.1, 16.4)), a: nOut, bg: C.red, fg: '#ffffff' });
    }

    // 4 HOW OFTEN: counter over the darkened patient
    if (t > TL.count[0] - 0.6 && t < 23.6) {
      const ca = seg(t, TL.count[0] - 0.6, TL.count[0] - 0.1) * (1 - seg(t, 23.2, 23.5));
      x.save(); x.globalAlpha = ca * 0.78; x.fillStyle = '#090b2c'; x.fillRect(0, 0, W, H_); x.restore();
      const v = Math.round(56000 * Math.pow(seg(t, TL.count[0], TL.count[1]), 2.2));
      const land = seg(t, TL.count[1], TL.count[1] + 0.35), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      flare(x, 640, 290, land > 0 ? Math.max(0, 1 - Math.abs(t - TL.count[1] - 0.2) / 0.8) * ca : 0, t);
      x.save(); x.translate(640, 290); x.scale(pop, pop); x.globalAlpha = ca;
      text(x, v.toLocaleString('en-US'), 0, 0, 150, land > 0 ? C.yellow : '#ffffff'); x.restore();
      text(x, 'reports of pump problems', 640, 410, 48, '#ffffff', { a: ca * seg(t, TL.count[0] + 0.3, TL.count[0] + 0.7) });
      text(x, 'sent to the FDA, 2005 to 2009', 640, 470, 34, '#bfe9ff', { a: ca * seg(t, TL.count[0] + 0.6, TL.count[0] + 1.0), w: 800 });
      if (ca > 0.5) burst(x, 640, 290, land * 1.2, 77, 320);
    }
  }


  // ================= SOUND =================
  window.scoreSound = function (k) {
    const hz = k.hz, D = TL.D;
    const pluck = (t, n, g = 1, p = 0, minor = false) => { const f = hz(n);
      k.tone(t, { f, dur: 0.9, gain: 0.2 * g, a: 0.003, pan: p, verb: 0.25, minor });
      k.tone(t, { f: f * 4, dur: 0.09, gain: 0.04 * g, a: 0.001, pan: p, minor });
      k.tone(t, { f: f * 2, type: 'triangle', dur: 0.32, gain: 0.045 * g, a: 0.003, pan: p, minor }); };
    const boop = (t, f0, g = 1, p = 0, minor = true) => {
      k.tone(t, { f: [[0, f0], [0.07, f0 * 1.45], [0.16, f0 * 1.3]], dur: 0.2, gain: 0.17 * g, a: 0.008, pan: p, verb: 0.15, minor });
      k.tone(t, { f: [[0, f0 * 0.5], [0.08, f0 * 0.72]], type: 'triangle', dur: 0.14, gain: 0.06 * g, a: 0.006, pan: p, minor }); };
    const air = (t, dur, top, g = 1, p = 0, peak = 0.55, minor = false) =>
      k.noise(t, { dur, color: 'pink', filter: 'bandpass', f: [[0, 260], [dur * peak, top], [dur, 340]], q: 0.55, gain: 0.26 * g, a: dur * peak, pan: p, verb: 0.3, minor });
    const chord = (t, notes, g = 1, dur = 2.2) => notes.forEach((n, i) => {
      k.tone(t + i * 0.012, { f: n, type: 'triangle', dur, gain: 0.07 * g, a: 0.02, verb: 0.35, filter: 'lowpass', f2: 1800, pan: (i / (notes.length - 1) - 0.5) * 0.6 });
      k.tone(t + i * 0.012, { f: hz(n) * 1.003, dur, gain: 0.06 * g, a: 0.03, verb: 0.35 }); });
    const nope = (t, p = 0) => {
      k.tone(t, { f: 'E3', type: 'triangle', dur: 0.26, gain: 0.24, hold: 0.1, filter: 'lowpass', f2: 900, pan: p });
      k.tone(t, { f: 'E2', dur: 0.26, gain: 0.18, hold: 0.1 });
      k.tone(t + 0.2, { f: 'C3', type: 'triangle', dur: 0.5, gain: 0.24, hold: 0.18, filter: 'lowpass', f2: 800, pan: p });
      k.tone(t + 0.2, { f: 'C2', dur: 0.5, gain: 0.2, hold: 0.18 });
      k.play('thud', t, { f: 95, gain: 0.3, pan: p }); };
    const counter = (t0, t1, f0, f1, pan) => { for (let tt = t0 + 0.1; tt < t1 - 0.04;) { const u = seg(tt, t0, t1); k.play('tock', tt, { f: f0 + (f1 - f0) * u, gain: 0.5, pan, minor: true }); tt += 0.22 - 0.135 * u; } };

    // 1 hook: air, a pluck per title word, title glides to the corner
    air(0, 1.4, 1500, 0.8, 0, 0.35);
    ['A3', 'C4', 'E4', 'G4', 'A4', 'C5'].forEach((n, i) => pluck(TL.title + i * 0.11 + 0.18, n, 0.8, (i - 2.5) * 0.15, i < 5));
    k.noise(TL.shrink[0], { dur: 0.6, color: 'pink', filter: 'bandpass', f: [[0, 700], [0.6, 300]], q: 0.7, gain: 0.08, a: 0.2, pan: -0.3, minor: true });
    // soft swish on every footage cut
    [4.0, 6.4, 8.4, 10.4, 12.9, 15.2, 18.0].forEach((t) => k.play('swish', t - 0.08, { gain: 0.5, dur: 0.22, minor: true }));
    // 2 setup labels and arrows
    pluck(4.45, 'C4', 0.8); pluck(6.8, 'E4', 0.8); pluck(8.8, 'G4', 0.8);
    for (let i = 1; i <= 4; i++) { k.play('tock', 6.8 + i * 0.16, { f: 520 + i * 40, gain: 0.3, minor: true }); k.play('tock', 8.7 + i * 0.18, { f: 560 + i * 40, gain: 0.3, minor: true }); }
    // 3 what goes wrong
    nope(TL.kink + 0.2, -0.4); k.play('pop', TL.kink + 0.6, { gain: 0.6, pan: -0.4 });
    k.tone(13.2, { f: [[0, 900], [1.2, 420]], type: 'sine', dur: 1.25, gain: 0.05, a: 0.05, pan: 0.1, minor: true });
    nope(13.6, 0.3); k.play('pop', 13.7, { gain: 0.6, pan: 0.3 });
    k.play('typing', 15.3, { n: 4, rate: 0.08, gain: 0.5, pan: 0.5 });
    k.play('error', 15.6, { gain: 0.9, pan: 0.5 }); nope(16.1, 0.5);
    // 4 how often: counter climbs, warm impact on 56,000
    counter(TL.count[0], TL.count[1], 700, 900, 0);
    k.noise(TL.count[1] - 0.8, { dur: 0.85, color: 'pink', filter: 'bandpass', f: [[0, 250], [0.8, 1800]], q: 0.8, gain: 0.22, a: 0.78, verb: 0.3 });
    k.play('impact', TL.count[1], { gain: 0.75 }); chord(TL.count[1], ['A2', 'E3', 'A3', 'C4', 'E4'], 1.2, 2.2);
    // 5 dive into the pump screen, one program, the safety check waits
    k.play('riser', TL.dive[0], { dur: TL.dive[1] - TL.dive[0], gain: 0.9 });
    chord(TL.dive[1], ['C3', 'G3', 'E4'], 0.6, 1.4);
    boop(TL.chipIn + 0.2, 300, 1, 0.2, false);
    for (let i = 0; i < 5; i++) k.play('pop', TL.queue[0] + 0.15 * i + 0.2, { f: 520 + i * 60, gain: 0.45, pan: -0.3, minor: true });
    [26.4, 27.15, 27.9].forEach((t) => k.play('tock', t, { f: 400, gain: 0.5, pan: 0.3 }));
    k.tone(TL.waitT, { f: [[0, 220], [0.8, 150]], type: 'triangle', dur: 0.9, gain: 0.12, a: 0.05, filter: 'lowpass', f2: 700 });
    for (let tt = TL.waitT + 0.2; tt < 30.8; tt += 0.25) k.play('tick', tt, { f: 3600, gain: 0.5, minor: true });
    // 6 planet sweep into the fix, InfuSafe arrives
    air(TL.sweep[0], TL.sweep[1] - TL.sweep[0], 1300, 1.3, 0, 0.5);
    k.noise(TL.sweep[0] + 0.1, { dur: 0.75, color: 'brown', filter: 'lowpass', f: 260, gain: 0.32, a: 0.35, verb: 0.2 });
    boop(TL.guardIn[0] + 0.5, 330, 1.2, 0.2, false);
    pluck(TL.guardIn[1] + 0.2, 'E4', 0.9, 0.2); pluck(TL.qnx + 0.2, 'G4', 0.9, 0.2);
    for (let i = 1; i <= 4; i++) k.play('tock', TL.link[0] + i * 0.18, { f: 620 + i * 40, gain: 0.3, minor: true });
    counter(TL.tick[0], TL.tick[1] - 0.6, 760, 980, 0.5);
    k.play('success', TL.tick[1] - 0.6, { gain: 0.7, pan: 0.5 });
    for (let tt = TL.tick[0]; tt < TL.lanes[0]; tt += 0.72) k.play('blip', tt, { f: 'E6', dur: 0.05, gain: 0.5, minor: true });
    // 7 safety goes first
    ['C4', 'E4', 'G4'].forEach((n, i) => pluck(TL.lanes[0] + i * 0.15 + 0.2, n, 0.7, -0.3, true));
    [0, 0.32, 0.62].forEach((d, i) => k.play('swish', TL.race[0] + d * 3.4, { dur: 0.4, gain: 0.6 - i * 0.12, pan: 0.4 }));
    k.play('success', TL.race[0] + 1.36, { gain: 0.9, pan: 0.4 });
    // 8 the catch
    air(TL.back[0], 0.8, 1000, 0.6, 0, 0.5, true);
    nope(TL.kink2, -0.3);
    k.play('stamp', TL.stop1, { gain: 1, pan: -0.4 });
    k.play('impact', TL.stop1 + 0.25, { gain: 0.8, pan: 0.4 }); chord(TL.stop1 + 0.25, ['D3', 'A3', 'D4', 'F#4'], 1.0, 1.8);
    k.tone(TL.air2 - 0.5, { f: [[0, 900], [0.5, 500]], dur: 0.5, gain: 0.05, a: 0.03, minor: true });
    k.play('stamp', TL.stop2, { gain: 1, pan: -0.4 });
    k.play('impact', TL.stop2 + 0.25, { gain: 0.8, pan: 0.4 }); chord(TL.stop2 + 0.25, ['E3', 'B3', 'E4', 'G#4'], 1.0, 1.8);
    // 9 takeaway
    air(TL.take[0], TL.take[1] - TL.take[0], 1000, 0.6, 0, 0.5, true);
    boop(TL.take[0] + 0.8, 400, 0.9, -0.4); boop(TL.take[0] + 0.95, 480, 0.9, 0); boop(TL.take[0] + 1.1, 540, 0.9, 0.4);
    pluck(TL.line1 + 0.3, 'E4', 1.0, 0);
    chord(TL.line2 + 0.3, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 2.4); pluck(TL.line2 + 0.3, 'C4', 1.0, 0);
    k.play('sparkle', TL.line2 + 0.4, { gain: 0.6, n: 6 });
  };


  // ================= OUTRO: live on QNX, how it uses QNX, bugs found, complete product, end =================
  const TERM_S = window.TERM_S || 55.4;              // length of the recorded QNX session
  const O = {};
  O.term0 = 3.2; O.term1 = O.term0 + TERM_S;
  O.arch0 = O.term1 + 0.5; O.arch1 = O.arch0 + 22;
  O.bug0 = O.arch1; O.bug1 = O.bug0 + 14;
  O.prod0 = O.bug1; O.prod1 = O.prod0 + 10;
  O.end0 = O.prod1; O.D = O.end0 + 8;
  window.OUTRO_DURATION = O.D; window.O_TL = O;
  const TERM = { n: 'term', a: O.term0, b: O.term1, len: Math.round(TERM_S * FPS) };
  window.prepareOutro = async function (t) {
    if (t < TERM.a || t >= TERM.b) return;
    const base = window.FOOTAGE_BASE || 'media/frames/', k = frameKey(TERM, t);
    if (IMG.has(k)) return IMG.get(k).ready;
    const im = new Image(); im.ready = new Promise((res) => { im.onload = res; im.onerror = res; }); im.src = base + k + '.jpg';
    IMG.set(k, im);
    if (IMG.size > 60) for (const kk of [...IMG.keys()].slice(0, 30)) IMG.delete(kk);
    return im.ready;
  };
  const MONO = (px) => `700 ${px}px "Menlo", "SF Mono", monospace`;
  function codePill(x, cx, cy, code, file, s, a = 1) {
    if (s <= 0.01 || a <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s); x.globalAlpha *= a;
    x.font = MONO(28); const w1 = x.measureText(code).width;
    x.font = F(800, 24); const w2 = x.measureText(file).width;
    const w = Math.max(w1, w2) + 48, h = 96;
    x.fillStyle = 'rgba(10,8,46,0.45)'; rr(x, -w / 2 + 5, -h / 2 + 10, w, h, 22); x.fill();
    x.fillStyle = '#0d1246'; rr(x, -w / 2, -h / 2, w, h, 22); x.fill();
    x.strokeStyle = 'rgba(86,232,255,0.7)'; x.lineWidth = 3; rr(x, -w / 2, -h / 2, w, h, 22); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = MONO(28); x.fillStyle = '#9ff7ff'; x.fillText(code, 0, -14);
    x.font = F(800, 24); x.fillStyle = '#bfc6ff'; x.fillText(file, 0, 24);
    x.restore();
  }
  // a monitor bezel the QNX terminal plays inside
  function monitor(x, cx, cy, w, h, s) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    glow(x, 0, 0, w * 0.75, '#56e8ff', 0.18);
    slab(x, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 34, ['#5a6ad8', '#2a2f8e', '#120f4a']);
    x.fillStyle = '#05061c'; rr(x, -w / 2, -h / 2, w, h, 14); x.fill();
    x.restore();
  }
  function termScreen(x, t, rect) {
    const im = IMG.get(frameKey(TERM, Math.min(t, TERM.b - 0.001)));
    x.save(); rr(x, rect[0], rect[1], rect[2], rect[3], 14); x.clip();
    if (im && im.complete && im.naturalWidth) x.drawImage(im, rect[0], rect[1], rect[2], rect[3]);
    x.restore();
  }

  function outro(ctx, W, H_, t) {
    const x = ctx;
    sky(x, W, H_, t, { x: 900 + t * 12, y: 0, z: 1 });
    // ---- live on QNX: the monitor drops in, the camera pushes onto its screen
    if (t < O.arch0 + 0.4) {
      const mIn = back(seg(t, 0.2, 0.9), 1.3), push = eio(seg(t, 2.2, O.term0));
      const pullOut = eio(seg(t, O.term1 - 0.2, O.arch0 + 0.3));
      const z = lerp(0.78, 1.0, push) * (1 - 0.25 * pullOut), fade = 1 - pullOut;
      x.save(); x.globalAlpha = fade; x.translate(640, 372); x.scale(z, z); x.translate(-640, -372);
      monitor(x, 640, 372, 1180, 664, mIn);
      if (t >= O.term0) termScreen(x, t, [50, 40, 1180, 664]);
      else {
        x.save(); x.globalAlpha *= seg(t, 0.6, 1.0);
        text(x, 'Running on real QNX 8.0', 640, 300, 64, '#ffffff');
        x.restore();
        pill(x, 640, 410, 'QEMU · x86_64 · booted from our own image', 30, { s: back(seg(t, 1.0, 1.35)), bg: C.yellow });
      }
      x.restore();
      if (t > O.term0) pill(x, 1130, 34, 'Live on QNX 8.0', 26, { s: back(seg(t, O.term0 + 0.3, O.term0 + 0.6)), a: fade, bg: C.green });
    }

    // ---- how it uses QNX: the architecture builds up, each piece labelled with its real code
    if (t > O.arch0 - 0.2 && t < O.arch1 + 0.6) {
      const a = seg(t, O.arch0 - 0.2, O.arch0 + 0.3) * (1 - seg(t, O.arch1, O.arch1 + 0.5));
      const L = (d) => O.arch0 + d;
      x.save(); x.globalAlpha = a;
      text(x, 'How it uses QNX', 640, 70, 56, '#ffffff');
      // microkernel bar
      const kIn = back(seg(t, L(0.6), L(1.1)));
      x.save(); x.translate(640, 662); x.scale(kIn, kIn);
      slab(x, -520, -44, 1040, 88, 44, ['#ffa0c4', '#de4b93', '#4e1670']);
      text(x, 'QNX 8.0 microkernel', 0, 0, 40, '#ffffff');
      x.restore();
      // the threads and the resource manager
      const nodes = [
        { k: 'sensor', x: 250, y: 370, d: 1.6, lab: 'Sensor thread', pr: 'priority 40' },
        { k: 'mon', x: 640, y: 340, d: 2.2, lab: 'Safety monitor', pr: 'priority 50' },
        { k: 'dev', x: 1030, y: 370, d: 2.8, lab: '/dev/infusafe', pr: 'resource manager' },
      ];
      nodes.forEach((n) => {
        const s2 = back(seg(t, L(n.d), L(n.d + 0.4)), 1.4);
        if (n.k === 'sensor') ball(x, n.x, n.y, 62 * s2, C.teal, { sha: 0.45 });
        if (n.k === 'mon') guardian(x, n.x, n.y + Math.sin(t * 2) * 5, 76 * s2, t, { look: [0, 0.4] });
        if (n.k === 'dev') { chip(x, n.x, n.y, 0.55 * s2); }
        pill(x, n.x, n.y + 120, n.lab, 30, { s: back(seg(t, L(n.d + 0.2), L(n.d + 0.55))), bg: n.k === 'mon' ? C.yellow : '#ffffff' });
        text(x, n.pr, n.x, n.y + 170, 28, '#bfe9ff', { a: seg(t, L(n.d + 0.4), L(n.d + 0.7)), w: 800 });
      });
      // kernel timer pulses: dots rise from the kernel to the monitor and sensor every beat
      const pulseOn = seg(t, L(4.0), L(4.4));
      for (const [tx, ty] of [[640, 420], [250, 430]]) {
        arrow(x, [[tx, 616], [tx, 600], [tx, 580], [tx, ty + 160]], eio(seg(t, L(4.0), L(4.6))), '#ffe28a', 7, { dots: true, a: 0.85 });
        if (pulseOn > 0) for (let i = 0; i < 2; i++) { const u = (t * 1.6 + i * 0.5) % 1; const py = lerp(612, ty + 165, u); glow(x, tx, py, 22, '#ffe28a', 0.8 * pulseOn); x.fillStyle = '#fff6c8'; x.beginPath(); x.arc(tx, py, 6, 0, TAU); x.fill(); }
      }
      pill(x, 445, 590, 'timer pulse every 1 ms', 28, { s: back(seg(t, L(4.5), L(4.85))), bg: '#ffe28a' });
      // sensor -> monitor: lock-free reading
      arrow(x, [[320, 340], [400, 290], [500, 290], [560, 320]], eio(seg(t, L(7.0), L(7.6))), '#9ff7ff', 7, { dots: true });
      pill(x, 420, 262, 'lock-free reading', 28, { s: back(seg(t, L(7.4), L(7.75))), bg: '#ffffff' });
      // shell -> /dev/infusafe
      arrow(x, [[1210, 200], [1180, 240], [1110, 270], [1070, 300]], eio(seg(t, L(9.6), L(10.2))), '#9ff7ff', 7, { dots: true });
      pill(x, 1150, 175, 'cat · echo', 28, { s: back(seg(t, L(9.4), L(9.75))), bg: '#ffffff' });
      // the real code, one callout at a time
      const calls = [
        [L(12.0), 'timer_create + SIGEV_PULSE_INIT', 'src/rt.c'],
        [L(14.2), 'MsgReceivePulse · SCHED_FIFO', 'src/rt.c · src/main.c'],
        [L(16.4), 'resmgr_attach · iofunc', 'src/control.c'],
        [L(18.6), 'mkifs boot image', 'qnx/infusafe.build'],
      ];
      calls.forEach(([tc, code, file], i) => {
        const s3 = back(seg(t, tc, tc + 0.35), 1.6), out = seg(t, tc + 2.0, tc + 2.25);
        codePill(x, 640, 168, code, file, s3 * (1 - out * 0.15), 1 - out);
      });
      x.restore();
    }

    // ---- bugs QNX helped find
    if (t > O.bug0 - 0.2 && t < O.bug1 + 0.6) {
      const a = seg(t, O.bug0, O.bug0 + 0.4) * (1 - seg(t, O.bug1, O.bug1 + 0.5));
      x.save(); x.globalAlpha = a;
      text(x, '3 real bugs QNX helped me find', 640, 80, 54, '#ffffff');
      const cards = [
        ['The monitor printed', 'to a slow console', 'Now a low-priority', 'thread prints'],
        ['Deadlock on one CPU', 'monitor waited on sensor', 'Now it never waits:', 'it uses the last reading'],
        ['A bubble slipped past', 'a late check', 'Now air is a', 'running total'],
      ];
      cards.forEach((c, i) => {
        const cx = 225 + i * 415, cy = 380, s4 = back(seg(t, O.bug0 + 0.5 + i * 0.5, O.bug0 + 0.9 + i * 0.5), 1.3);
        const fix = seg(t, O.bug0 + 4.5 + i * 2.2, O.bug0 + 4.8 + i * 2.2);
        x.save(); x.translate(cx, cy); x.scale(s4, s4);
        slab(x, -185, -190, 370, 380, 36, fix > 0.5 ? ['#c8ffe0', '#38e08e', '#178a5a'] : ['#ffc1d8', '#ff5d8f', '#9a2775']);
        x.restore();
        if (s4 > 0.5) {
          const on = fix > 0.5;
          text(x, on ? c[2] : c[0], cx, cy - 30, 30, '#ffffff', { w: 900 });
          text(x, on ? c[3] : c[1], cx, cy + 14, 28, '#ffffff', { w: 800 });
          badge(x, cx, cy - 120, 38, on, back(seg(t, O.bug0 + 1.0 + i * 0.5, O.bug0 + 1.3 + i * 0.5), 2) * (on ? back(seg(t, O.bug0 + 4.5 + i * 2.2, O.bug0 + 4.9 + i * 2.2), 2.2) : 1));
          pill(x, cx, cy + 110, on ? 'fixed and tested' : 'found on QNX', 28, { bg: on ? '#ffffff' : C.red, fg: on ? '#178a5a' : '#ffffff' });
        }
      });
      pill(x, 640, 650, '30 of 30 tests pass on QNX', 32, { s: back(seg(t, O.bug0 + 11.0, O.bug0 + 11.4)), bg: C.yellow });
      x.restore();
    }

    // ---- a complete product
    if (t > O.prod0 - 0.2 && t < O.prod1 + 0.6) {
      const a = seg(t, O.prod0, O.prod0 + 0.4) * (1 - seg(t, O.prod1, O.prod1 + 0.5));
      x.save(); x.globalAlpha = a;
      text(x, 'A complete safety product', 640, 80, 54, '#ffffff');
      guardian(x, 1080, 420 + Math.sin(t * 2) * 6, 90, t, { happy: 1, armUp: 0.6 });
      const items = ['Drug library with soft and hard limits', 'Live device: /dev/infusafe', 'Fault bench: 5 faults, timed', '30 unit tests, run on QNX', 'Boots from one QNX image'];
      items.forEach((it, i) => {
        const ti = O.prod0 + 0.8 + i * 1.3, s5 = back(seg(t, ti, ti + 0.35), 1.4);
        const y = 190 + i * 92;
        badge(x, 120, y, 26, true, back(seg(t, ti + 0.25, ti + 0.55), 2.2));
        x.save(); x.globalAlpha *= s5; text(x, it, 170, y, 36, '#ffffff', { align: 'left', w: 800 }); x.restore();
      });
      x.restore();
    }

    // ---- end card
    if (t > O.end0 - 0.2) {
      const a = seg(t, O.end0, O.end0 + 0.4);
      x.save(); x.globalAlpha = a;
      planet(x, 640, 1180, 640, PL.teal, { glowA: 0.3, atmo: 1 });
      guardian(x, 640, 400 + Math.sin(t * 2) * 6, 84 * back(seg(t, O.end0 + 0.2, O.end0 + 0.7)), t, { happy: 1, armUp: 1 });
      const l1 = back(seg(t, O.end0 + 0.5, O.end0 + 0.9));
      x.save(); x.translate(640, 120); x.scale(l1, l1); text(x, 'InfuSafe', 0, 0, 96, '#ffffff'); x.restore();
      text(x, 'A real-time safety monitor for chemo pumps', 640, 200, 34, '#bfe9ff', { a: seg(t, O.end0 + 0.8, O.end0 + 1.1), w: 800 });
      pill(x, 640, 560, 'github.com/KushagraRishi/infusafe-qnx', 32, { s: back(seg(t, O.end0 + 1.2, O.end0 + 1.55)), bg: '#ffffff' });
      pill(x, 640, 640, 'Robotics & Medical · Built on QNX 8.0', 30, { s: back(seg(t, O.end0 + 1.5, O.end0 + 1.85)), bg: C.yellow });
      if (t > O.end0 + 1.5) for (let i = 0; i < 7; i++) { const q = H.rng(500 + i); spark(x, q.range(120, 1160), q.range(60, 320), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, O.end0 + 1.5, O.end0 + 1.9)); }
      x.restore();
    }
    header(x, 1 - seg(t, O.term0 - 0.3, O.term0) + seg(t, O.term1, O.term1 + 0.4));
    finish(x, W, H_, t);
  }
  window.outro = outro;

  window.outroSound = function (k) {
    const hz = k.hz;
    const pluck = (t, n, g = 1, p = 0, minor = false) => { const f = hz(n);
      k.tone(t, { f, dur: 0.9, gain: 0.2 * g, a: 0.003, pan: p, verb: 0.25, minor });
      k.tone(t, { f: f * 2, type: 'triangle', dur: 0.32, gain: 0.045 * g, a: 0.003, pan: p, minor }); };
    const boop = (t, f0, g = 1, p = 0) => k.tone(t, { f: [[0, f0], [0.07, f0 * 1.45], [0.16, f0 * 1.3]], dur: 0.2, gain: 0.17 * g, a: 0.008, pan: p, verb: 0.15, minor: true });
    const chord = (t, notes, g = 1, dur = 2.2) => notes.forEach((n, i) => k.tone(t + i * 0.012, { f: n, type: 'triangle', dur, gain: 0.07 * g, a: 0.02, verb: 0.35, filter: 'lowpass', f2: 1800 }));
    // live on QNX
    k.play('boot', 0.4, { gain: 0.8 }); pluck(1.1, 'E4', 0.8);
    k.play('whoosh', 2.2, { dur: 1.0, gain: 0.7 }); k.play('crtOn', O.term0, { gain: 0.6 });
    // the terminal types: soft keys under each typed command would need the replay timing, so keep a quiet room tone instead
    k.play('whoosh', O.term1 - 0.2, { dur: 0.8, gain: 0.6 });
    // how it uses QNX
    const L = (d) => O.arch0 + d;
    pluck(L(0.2), 'C4', 0.8); k.play('thud', L(0.9), { f: 110, gain: 0.5 });
    [[1.6, 'E4'], [2.2, 'G4'], [2.8, 'C5']].forEach(([d, n]) => { boop(L(d + 0.3), hz(n) / 2, 0.9); pluck(L(d + 0.4), n, 0.6, 0, true); });
    for (let tt = L(4.4); tt < L(11.5); tt += 0.62) k.play('blip', tt, { f: 'E6', dur: 0.04, gain: 0.4, minor: true });
    pluck(L(4.7), 'D4', 0.7); pluck(L(7.6), 'F4', 0.7); pluck(L(9.6), 'A4', 0.7);
    [12.0, 14.2, 16.4, 18.6].forEach((d, i) => { k.play('typing', L(d), { n: 5, rate: 0.05, gain: 0.5 }); k.play('pop', L(d + 0.3), { f: 600 + i * 80, gain: 0.5 }); });
    // bugs
    [0.5, 1.0, 1.5].forEach((d, i) => k.play('pop', O.bug0 + d + 0.35, { f: 500 + i * 70, gain: 0.6 }));
    [0, 1, 2].forEach((i) => k.play('error', O.bug0 + 1.1 + i * 0.5, { gain: 0.35, minor: true }));
    [0, 1, 2].forEach((i) => k.play('success', O.bug0 + 4.7 + i * 2.2, { gain: 0.7 }));
    chord(O.bug0 + 11.2, ['C3', 'G3', 'C4', 'E4'], 0.9, 1.6);
    // product checklist
    for (let i = 0; i < 5; i++) { k.play('tock', O.prod0 + 0.8 + i * 1.3 + 0.1, { f: 600 + i * 50, gain: 0.4 }); pluck(O.prod0 + 0.8 + i * 1.3 + 0.35, ['C5', 'D5', 'E5', 'G5', 'A5'][i], 0.6, 0, true); }
    // end
    k.play('whoosh', O.end0 - 0.1, { dur: 0.7, gain: 0.6 });
    boop(O.end0 + 0.6, 400, 1); pluck(O.end0 + 0.8, 'E4', 1.0);
    chord(O.end0 + 1.6, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.1, 3.0); k.play('sparkle', O.end0 + 1.7, { gain: 0.6, n: 6 });
  };

  // ================= EXPLAINER =================
  function explainer(ctx, W, H_, t) {
    const x = ctx;
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 980, -980, sw);
    if (t < TL.dive[1] + 0.1) sceneReal(x, W, H_, t);
    else if (t < TL.sweep[0] || spx > 640) sceneB(x, W, H_, t);
    else sceneC(x, W, H_, t);
    // dive into the pump screen: glow whiteout
    const wo = seg(t, TL.dive[0] + 0.5, TL.dive[1]) * (1 - seg(t, TL.dive[1], TL.dive[1] + 0.45));
    if (wo > 0) {
      const g = x.createRadialGradient(640, 360, 0, 640, 360, 800);
      g.addColorStop(0, H.rgba('#e8fdff', wo)); g.addColorStop(0.5, H.rgba('#8ff0ff', wo * 0.95)); g.addColorStop(1, H.rgba('#2a3a9c', wo * 0.9));
      x.fillStyle = g; x.fillRect(0, 0, W, H_);
    }
    // the foreground planet sweep (wipe) into the solution
    if (sw > 0 && sw < 1) planet(x, spx, 380 + (sw - 0.5) * 120, 880, PL.coral, { glowA: 0.4 });
    if (t > TL.shrink[1] - 0.2) header(x, seg(t, TL.shrink[1] - 0.2, TL.shrink[1]));
    finish(x, W, H_, t);
  }
  window.explainer = explainer;
  window.EXPLAINER_INTERNALS = { C, TL, seg, back, eio };
})();
