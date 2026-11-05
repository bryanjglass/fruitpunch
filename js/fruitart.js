// Fruit Punch - procedural cartoon fruit characters.
// Every fruit is drawn in "unit" space: origin at the feet, body radius ~1.
// The body centre sits at y = BODY_Y.
(function () {
  const BODY_Y = -1.45;
  const INK = '#2b1a10';

  function P(build) {
    const p = new Path2D();
    build(p);
    return p;
  }

  // Body outlines, relative to the body centre
  const bodies = {
    apple: P((p) => {
      p.moveTo(0, -0.72);
      p.bezierCurveTo(0.5, -1.15, 1.18, -0.85, 1.02, 0.02);
      p.bezierCurveTo(0.92, 0.75, 0.42, 1.02, 0, 0.9);
      p.bezierCurveTo(-0.42, 1.02, -0.92, 0.75, -1.02, 0.02);
      p.bezierCurveTo(-1.18, -0.85, -0.5, -1.15, 0, -0.72);
      p.closePath();
    }),
    orange: P((p) => p.arc(0, 0, 1, 0, Math.PI * 2)),
    lemon: P((p) => {
      p.moveTo(0, -1.12);
      p.bezierCurveTo(0.25, -1.1, 0.95, -0.85, 0.95, 0);
      p.bezierCurveTo(0.95, 0.85, 0.3, 1.0, 0, 1.0);
      p.bezierCurveTo(-0.3, 1.0, -0.95, 0.85, -0.95, 0);
      p.bezierCurveTo(-0.95, -0.85, -0.25, -1.1, 0, -1.12);
      p.closePath();
    }),
    grape: P((p) => p.ellipse(0, 0, 0.9, 0.98, 0, 0, Math.PI * 2)),
    watermelon: P((p) => p.ellipse(0, 0, 1.15, 1.0, 0, 0, Math.PI * 2)),
    pineapple: P((p) => p.ellipse(0, 0, 0.88, 1.05, 0, 0, Math.PI * 2)),
    strawberry: P((p) => {
      p.moveTo(0, -0.82);
      p.bezierCurveTo(0.75, -1.05, 1.15, -0.45, 0.92, 0.12);
      p.bezierCurveTo(0.72, 0.62, 0.3, 1.02, 0, 1.06);
      p.bezierCurveTo(-0.3, 1.02, -0.72, 0.62, -0.92, 0.12);
      p.bezierCurveTo(-1.15, -0.45, -0.75, -1.05, 0, -0.82);
      p.closePath();
    }),
    banana: P((p) => {
      p.moveTo(-0.15, -1.22);
      p.bezierCurveTo(0.95, -0.85, 1.0, 0.65, 0.12, 1.05);
      p.bezierCurveTo(-0.18, 1.12, -0.42, 1.02, -0.48, 0.86);
      p.bezierCurveTo(0.2, 0.42, 0.2, -0.55, -0.42, -1.02);
      p.closePath();
    }),
  };

  const TYPES = {
    apple: { name: 'Apple', size: 42, hp: 1, pts: 100, speed: 1.0, color: '#ec3a32', light: '#ff8a7a', dark: '#a0201b', juice: '#ff3d3d', face: { x: 0, y: -0.12, sp: 0.34, er: 0.2 }, waist: 0.38, pitch: 1.0 },
    orange: { name: 'Orange', size: 42, hp: 1, pts: 100, speed: 1.0, color: '#ff9a1f', light: '#ffc875', dark: '#c46a00', juice: '#ffa22b', face: { x: 0, y: -0.15, sp: 0.34, er: 0.2 }, waist: 0.4, pitch: 0.95 },
    banana: { name: 'Banana', size: 46, hp: 1, pts: 110, speed: 1.1, color: '#ffe03a', light: '#fff3a0', dark: '#c9a400', juice: '#ffe866', face: { x: 0.3, y: -0.35, sp: 0.19, er: 0.15 }, waist: 0.42, pitch: 1.1 },
    strawberry: { name: 'Strawberry', size: 40, hp: 1, pts: 120, speed: 1.15, color: '#ff2e4d', light: '#ff8fa0', dark: '#b3001e', juice: '#ff2e63', face: { x: 0, y: -0.25, sp: 0.32, er: 0.19 }, waist: 0.32, pitch: 1.2 },
    lemon: { name: 'Lemon', size: 40, hp: 1, pts: 120, speed: 1.2, color: '#fff03a', light: '#fffaa8', dark: '#c7b800', juice: '#fff56b', face: { x: 0, y: -0.15, sp: 0.32, er: 0.19 }, waist: 0.4, pitch: 1.25 },
    grape: { name: 'Grape', size: 32, hp: 1, pts: 150, speed: 1.5, color: '#8d3fc4', light: '#c99bf0', dark: '#5a1f86', juice: '#9b4fd1', face: { x: 0, y: -0.15, sp: 0.32, er: 0.21 }, waist: 0.4, pitch: 1.45 },
    pineapple: { name: 'Pineapple', size: 44, hp: 2, pts: 200, speed: 0.95, color: '#f7b52b', light: '#ffd877', dark: '#b07a00', juice: '#ffd23f', face: { x: 0, y: -0.2, sp: 0.32, er: 0.19 }, waist: 0.42, pitch: 0.85 },
    watermelon: { name: 'Watermelon', size: 52, hp: 3, pts: 300, speed: 0.75, color: '#3fae3a', light: '#8ee07f', dark: '#1d6b1b', juice: '#ff4d6d', face: { x: 0, y: -0.15, sp: 0.38, er: 0.2 }, waist: 0.4, pitch: 0.7 },
  };
  for (const k in TYPES) TYPES[k].key = k;

  const PANTS = [
    { base: '#ffffff', band: '#ff5ca8', pattern: 'hearts', ink: '#ff3d8b' },
    { base: '#7fd4ff', band: '#1e6fd9', pattern: 'dots', ink: '#ffffff' },
    { base: '#ffffff', band: '#2f9e44', pattern: 'stripes', ink: '#59c76a' },
    { base: '#ffe14d', band: '#ff7a00', pattern: 'stars', ink: '#ff7a00' },
    { base: '#ff6b6b', band: '#ffffff', pattern: 'dots', ink: '#ffffff' },
    { base: '#c4a1ff', band: '#6a3fc4', pattern: 'hearts', ink: '#ffffff' },
    { base: '#ffffff', band: '#999999', pattern: 'plain', ink: '#ffffff' },
    { base: '#7be38a', band: '#1b7a2a', pattern: 'stars', ink: '#ffffff' },
  ];

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.4, y - s, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
    ctx.fill();
  }

  function star(ctx, x, y, r, points, inner) {
    points = points || 5;
    inner = inner || 0.45;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * inner : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  // Underpants: everything below the waistline, clipped to the body outline
  function drawPants(ctx, type, pants, back, bodyPath) {
    const w = type.waist;
    ctx.save();
    ctx.clip(bodyPath);
    const pp = new Path2D();
    pp.moveTo(-2, w);
    pp.quadraticCurveTo(0, w + 0.14, 2, w);
    pp.lineTo(2, 2);
    pp.lineTo(-2, 2);
    pp.closePath();
    ctx.fillStyle = pants.base;
    ctx.fill(pp);
    ctx.save();
    ctx.clip(pp);
    ctx.fillStyle = pants.ink;
    ctx.strokeStyle = pants.ink;
    if (pants.pattern === 'dots') {
      for (let y = w + 0.18; y < 1.2; y += 0.24)
        for (let x = -1.2; x < 1.3; x += 0.28) {
          ctx.beginPath();
          ctx.arc(x + ((y * 10) % 2 ? 0.14 : 0), y, 0.06, 0, 7);
          ctx.fill();
        }
    } else if (pants.pattern === 'stripes') {
      ctx.lineWidth = 0.08;
      for (let x = -1.3; x < 1.4; x += 0.22) {
        ctx.beginPath();
        ctx.moveTo(x, w);
        ctx.lineTo(x, 1.3);
        ctx.stroke();
      }
    } else if (pants.pattern === 'hearts') {
      if (back) heart(ctx, 0, w + 0.3, 0.3);
      else {
        heart(ctx, -0.35, w + 0.3, 0.12);
        heart(ctx, 0.35, w + 0.32, 0.12);
        heart(ctx, 0, w + 0.45, 0.12);
      }
    } else if (pants.pattern === 'stars') {
      for (let i = 0; i < 4; i++) {
        star(ctx, -0.6 + i * 0.4, w + 0.3 + (i % 2) * 0.15, 0.1);
        ctx.fill();
      }
    }
    if (back && pants.pattern !== 'hearts') {
      ctx.fillStyle = pants.band;
      heart(ctx, 0.3, w + 0.35, 0.16);
    }
    ctx.restore();
    // waistband
    ctx.lineWidth = 0.13;
    ctx.strokeStyle = pants.band;
    ctx.beginPath();
    ctx.moveTo(-2, w + 0.04);
    ctx.quadraticCurveTo(0, w + 0.18, 2, w + 0.04);
    ctx.stroke();
    ctx.lineWidth = 0.035;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-2, w - 0.03);
    ctx.quadraticCurveTo(0, w + 0.11, 2, w - 0.03);
    ctx.stroke();
    // leg holes / seam
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    if (back) {
      ctx.moveTo(0, w + 0.2);
      ctx.quadraticCurveTo(0.03, w + 0.45, 0, 1.1);
    } else {
      ctx.moveTo(-0.75, 1.0);
      ctx.quadraticCurveTo(-0.3, 0.68, -0.1, 1.1);
      ctx.moveTo(0.75, 1.0);
      ctx.quadraticCurveTo(0.3, 0.68, 0.1, 1.1);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawDetails(ctx, type, t) {
    const k = type.key;
    ctx.save();
    ctx.clip(bodies[k]);
    // shading
    const g = ctx.createRadialGradient(-0.35, -0.45, 0.1, 0, 0, 1.3);
    g.addColorStop(0, type.light);
    g.addColorStop(0.45, type.color);
    g.addColorStop(1, type.dark);
    ctx.fillStyle = g;
    ctx.fillRect(-2, -2, 4, 4);
    if (k === 'watermelon') {
      ctx.strokeStyle = '#1d6b1b';
      ctx.lineWidth = 0.16;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 0.34, -1.1);
        ctx.bezierCurveTo(i * 0.5 + 0.1, -0.4, i * 0.5 - 0.1, 0.4, i * 0.34, 1.1);
        ctx.stroke();
      }
    } else if (k === 'pineapple') {
      ctx.strokeStyle = 'rgba(140,80,0,0.55)';
      ctx.lineWidth = 0.05;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 0.3 - 1, -1.2);
        ctx.lineTo(i * 0.3 + 1, 1.2);
        ctx.moveTo(i * 0.3 + 1, -1.2);
        ctx.lineTo(i * 0.3 - 1, 1.2);
        ctx.stroke();
      }
    } else if (k === 'strawberry') {
      ctx.fillStyle = '#ffe680';
      for (let y = -0.55; y < 1; y += 0.28)
        for (let x = -0.9; x < 1; x += 0.3) {
          const ox = (Math.round(y * 10) % 2) * 0.15;
          ctx.beginPath();
          ctx.ellipse(x + ox, y, 0.035, 0.06, 0, 0, 7);
          ctx.fill();
        }
    } else if (k === 'orange') {
      ctx.fillStyle = 'rgba(190,90,0,0.35)';
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39, r = 0.25 + (i % 5) * 0.16;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.025, 0, 7);
        ctx.fill();
      }
    } else if (k === 'banana') {
      ctx.strokeStyle = 'rgba(160,120,0,0.6)';
      ctx.lineWidth = 0.04;
      ctx.beginPath();
      ctx.moveTo(-0.2, -1.1);
      ctx.bezierCurveTo(0.65, -0.6, 0.65, 0.5, -0.1, 0.98);
      ctx.stroke();
    }
    // glossy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-0.45, -0.5, 0.18, 0.3, -0.5, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawTop(ctx, type, t) {
    const k = type.key;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (k === 'apple' || k === 'orange' || k === 'grape' || k === 'lemon') {
      if (k !== 'lemon') {
        ctx.strokeStyle = '#6b3d14';
        ctx.lineWidth = 0.1;
        ctx.beginPath();
        const top = k === 'apple' ? -0.72 : k === 'grape' ? -0.95 : -0.98;
        ctx.moveTo(0, top);
        ctx.quadraticCurveTo(0.05, top - 0.25, 0.15, top - 0.35);
        ctx.stroke();
      }
      ctx.fillStyle = '#4cc24a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.05;
      ctx.save();
      const ly = k === 'apple' ? -0.95 : k === 'lemon' ? -1.08 : -1.12;
      ctx.translate(0.3, ly);
      ctx.rotate(-0.5 + Math.sin(t * 3) * 0.1);
      ctx.beginPath();
      ctx.ellipse(0.12, 0, 0.24, 0.1, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (k === 'strawberry') {
      ctx.fillStyle = '#3fb34a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI + (i / 5) * Math.PI;
        ctx.lineTo(Math.cos(a) * 0.6, -0.8 + Math.sin(a) * 0.15 + 0.1);
        ctx.lineTo(Math.cos(a + 0.3) * 0.25, -0.82);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (k === 'pineapple') {
      ctx.fillStyle = '#2f9e44';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.05;
      const sway = Math.sin(t * 4) * 0.05;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 0.12 - 0.12, -0.95);
        ctx.lineTo(i * 0.32 + sway, -1.75 + Math.abs(i) * 0.25);
        ctx.lineTo(i * 0.12 + 0.12, -0.95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (k === 'banana') {
      ctx.fillStyle = '#6b4a1a';
      ctx.beginPath();
      ctx.ellipse(-0.25, -1.15, 0.1, 0.08, -0.3, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-0.3, 0.95, 0.09, 0.07, 0.5, 0, 7);
      ctx.fill();
    } else if (k === 'watermelon') {
      ctx.strokeStyle = '#6b3d14';
      ctx.lineWidth = 0.08;
      ctx.beginPath();
      ctx.moveTo(0, -0.98);
      ctx.bezierCurveTo(0.1, -1.2, 0.3, -1.1, 0.25, -1.25);
      ctx.stroke();
    }
  }

  function drawHeadband(ctx, type, back, t, color) {
    const f = type.face;
    const y = f.y - 0.38;
    const bodyPath = bodies[type.key];
    ctx.save();
    ctx.clip(bodyPath);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-2, y - 0.08);
    ctx.quadraticCurveTo(0, y - 0.2, 2, y - 0.08);
    ctx.lineTo(2, y + 0.1);
    ctx.quadraticCurveTo(0, y - 0.02, -2, y + 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // knot + flapping tails
    const kx = back ? 0 : -0.8 + f.x * 0.4;
    ctx.fillStyle = color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.04;
    const flap = Math.sin(t * 14);
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(kx, y - 0.04);
      ctx.quadraticCurveTo(kx - 0.3, y - 0.1 + i * 0.25 + flap * 0.08, kx - 0.55, y + 0.05 + i * 0.25 + flap * 0.12);
      ctx.lineTo(kx - 0.5, y + 0.18 + i * 0.25 + flap * 0.12);
      ctx.quadraticCurveTo(kx - 0.25, y + 0.05 + i * 0.2, kx, y + 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(kx, y, 0.08, 0, 7);
    ctx.fill();
    ctx.stroke();
  }

  function drawFace(ctx, type, pose, t) {
    const f = type.face;
    const ex1 = f.x - f.sp, ex2 = f.x + f.sp, ey = f.y;
    const er = f.er;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    // eyes
    if (pose.eyes === 'x') {
      ctx.lineWidth = 0.07;
      for (const ex of [ex1, ex2]) {
        ctx.beginPath();
        ctx.moveTo(ex - er * 0.7, ey - er * 0.7);
        ctx.lineTo(ex + er * 0.7, ey + er * 0.7);
        ctx.moveTo(ex + er * 0.7, ey - er * 0.7);
        ctx.lineTo(ex - er * 0.7, ey + er * 0.7);
        ctx.stroke();
      }
    } else if (pose.eyes === 'closed' || pose.eyes === 'happy') {
      ctx.lineWidth = 0.06;
      for (const ex of [ex1, ex2]) {
        ctx.beginPath();
        if (pose.eyes === 'happy') ctx.arc(ex, ey + 0.05, er * 0.8, Math.PI * 1.1, Math.PI * 1.9);
        else ctx.arc(ex, ey - 0.05, er * 0.8, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
    } else if (pose.eyes === 'dizzy') {
      ctx.lineWidth = 0.04;
      for (const ex of [ex1, ex2]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        for (let a = 0; a < 12; a += 0.4) {
          const r = (a / 12) * er * 0.85;
          ctx.lineTo(ex + Math.cos(a + t * 10) * r, ey + Math.sin(a + t * 10) * r);
        }
        ctx.stroke();
      }
    } else {
      const lx = pose.lookX || 0, ly = pose.lookY || 0;
      ctx.lineWidth = 0.04;
      for (const ex of [ex1, ex2]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, er, er * 1.15, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(ex + lx * er * 0.45, ey + ly * er * 0.5, er * 0.5, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex + lx * er * 0.45 - er * 0.18, ey + ly * er * 0.5 - er * 0.18, er * 0.15, 0, 7);
        ctx.fill();
      }
    }
    // angry eyebrows (battle ready!)
    if (pose.eyes !== 'x') {
      ctx.lineWidth = 0.09;
      const lift = pose.brow || 0;
      ctx.beginPath();
      ctx.moveTo(ex1 - er * 1.1, ey - er * 1.75 - lift);
      ctx.lineTo(ex1 + er * 0.9, ey - er * 1.15 + lift * 0.3);
      ctx.moveTo(ex2 + er * 1.1, ey - er * 1.75 - lift);
      ctx.lineTo(ex2 - er * 0.9, ey - er * 1.15 + lift * 0.3);
      ctx.stroke();
    }
    // mouth
    const mx = f.x, my = f.y + 0.42;
    const mw = Math.max(f.sp * 1.1, 0.28);
    ctx.lineWidth = 0.055;
    ctx.fillStyle = '#5a0d0d';
    switch (pose.mouth) {
      case 'open': {
        const o = 0.18 + Math.abs(Math.sin(t * 18)) * 0.08;
        ctx.beginPath();
        ctx.moveTo(mx - mw, my - 0.05);
        ctx.quadraticCurveTo(mx, my + o * 2.2, mx + mw, my - 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff7a8a';
        ctx.beginPath();
        ctx.ellipse(mx, my + o * 0.7, mw * 0.45, o * 0.35, 0, 0, 7);
        ctx.fill();
        break;
      }
      case 'tongue': {
        ctx.beginPath();
        ctx.moveTo(mx - mw * 0.8, my);
        ctx.quadraticCurveTo(mx, my + 0.1, mx + mw * 0.8, my);
        ctx.stroke();
        const wag = Math.sin(t * 16) * 0.06;
        ctx.fillStyle = '#ff5c7a';
        ctx.beginPath();
        ctx.moveTo(mx - 0.12, my + 0.04);
        ctx.quadraticCurveTo(mx - 0.14 + wag, my + 0.36, mx + wag, my + 0.38);
        ctx.quadraticCurveTo(mx + 0.14 + wag, my + 0.36, mx + 0.12, my + 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + wag * 0.5, my + 0.08);
        ctx.lineTo(mx + wag, my + 0.25);
        ctx.lineWidth = 0.03;
        ctx.stroke();
        break;
      }
      case 'o': {
        ctx.beginPath();
        ctx.ellipse(mx, my + 0.05, 0.1, 0.13, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'ouch': {
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) ctx.lineTo(mx - mw + (i / 6) * mw * 2, my + (i % 2 ? -0.06 : 0.06));
        ctx.stroke();
        break;
      }
      case 'dead': {
        ctx.beginPath();
        ctx.moveTo(mx - mw * 0.7, my + 0.08);
        ctx.quadraticCurveTo(mx, my - 0.06, mx + mw * 0.7, my + 0.08);
        ctx.stroke();
        ctx.fillStyle = '#ff5c7a';
        ctx.beginPath();
        ctx.ellipse(mx + mw * 0.35, my + 0.14, 0.08, 0.12, 0.3, 0, 7);
        ctx.fill();
        ctx.stroke();
        break;
      }
      default: { // smug grin with teeth
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(mx - mw, my - 0.04);
        ctx.quadraticCurveTo(mx, my + 0.32, mx + mw * 1.05, my - 0.1);
        ctx.quadraticCurveTo(mx, my + 0.1, mx - mw, my - 0.04);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 0.025;
        ctx.beginPath();
        ctx.moveTo(mx - mw * 0.3, my + 0.04);
        ctx.lineTo(mx - mw * 0.3, my + 0.15);
        ctx.moveTo(mx + mw * 0.3, my + 0.02);
        ctx.lineTo(mx + mw * 0.3, my + 0.14);
        ctx.stroke();
      }
    }
  }

  function glove(ctx, x, y, ang, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05;
    // cuff
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.rect(-0.36, -0.14, 0.16, 0.28);
    ctx.fill();
    ctx.stroke();
    // fist
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.27, 0.24, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    // thumb
    ctx.beginPath();
    ctx.ellipse(-0.02, -0.2, 0.13, 0.08, -0.2, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(0.06, 0.04, 0.09, 0.06, -0.4, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  // Glove target positions (relative to body centre) for each arm pose
  function armTargets(pose, t, type) {
    const s = t * 1;
    switch (pose.arms) {
      case 'ears': { // "nyah nyah" thumbs at the ears, waggling
        const w = Math.sin(t * 20) * 0.08;
        return [[-1.05, type.face.y - 0.35 + w, -2.4], [1.05, type.face.y - 0.35 - w, -0.7]];
      }
      case 'flex':
        return [[-1.25, -0.75 + Math.sin(t * 8) * 0.08, -1.9], [1.25, -0.75 - Math.sin(t * 8) * 0.08, -1.2]];
      case 'up':
        return [[-1.15, -1.05 + Math.sin(t * 10) * 0.2, -2.0], [1.15, -1.05 - Math.sin(t * 10) * 0.2, -1.1]];
      case 'beckon': {
        const b = Math.sin(t * 9) * 0.25;
        return [[-1.0, 0.3, 2.6], [1.35 - b * 0.3, -0.25 + b, -0.3]];
      }
      case 'hips':
        return [[-1.05, 0.25, 2.8], [1.05, 0.25, 0.3]];
      case 'belly':
        return [[-0.55, 0.3 + Math.sin(t * 20) * 0.05, 0.6], [0.55, 0.3 - Math.sin(t * 20) * 0.05, 2.5]];
      case 'flail':
        return [[-1.2 + Math.sin(t * 25) * 0.2, -0.6 + Math.cos(t * 23) * 0.4, -2.2], [1.2 + Math.cos(t * 21) * 0.2, -0.6 + Math.sin(t * 27) * 0.4, -0.9]];
      case 'punch': {
        const p = Math.max(0, Math.sin(t * 12));
        return [[0.55 + p * 0.9, -0.15, 0], [0.75 - p * 0.4, -0.4 + p * 0.1, -0.2]];
      }
      default: { // boxing guard, bobbing
        const b = Math.sin(s * 6) * 0.05;
        return [[0.45, -0.1 + b, -0.3], [0.85, -0.3 - b, -0.2]];
      }
    }
  }

  function drawArms(ctx, type, pose, t) {
    const sh = type.key === 'banana' ? [[-0.1, 0.05], [0.65, 0.0]] : [[-0.8, 0.05], [0.8, 0.05]];
    const tg = armTargets(pose, t, type);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const [sx, sy] = sh[i];
      const [gx, gy] = tg[i];
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo((sx + gx) / 2, (sy + gy) / 2 + 0.25, gx, gy);
      ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
      const [sx, sy] = sh[i];
      const [gx, gy, ang] = tg[i];
      glove(ctx, gx, gy, ang != null ? ang : Math.atan2(gy - sy, gx - sx), pose.gloveColor || '#e8202a');
    }
  }

  function drawLegs(ctx, type, pose, t) {
    const walk = pose.walk || 0;
    const sw = Math.sin(walk) * 0.25;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.09;
    ctx.lineCap = 'round';
    const legs = [[-0.32, -sw], [0.32, sw]];
    for (const [lx, s] of legs) {
      ctx.beginPath();
      ctx.moveTo(lx * 0.9, -0.6);
      ctx.lineTo(lx + s, -0.1 - Math.max(0, -s) * 0.15);
      ctx.stroke();
    }
    for (const [lx, s] of legs) {
      const fx = lx + s + 0.06, fy = -0.08 - Math.max(0, -s) * 0.15;
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 0.045;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 0.22, 0.12, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3d7bff';
      ctx.fillRect(fx - 0.12, fy - 0.03, 0.18, 0.05);
    }
  }

  /**
   * Draw a fruit character.
   * f: { type, size(px), facing(+1/-1), pants, band, t, pose:{arms,mouth,eyes,back,lookX,lookY,walk,brow},
   *      sx, sy (squash), tilt, flash, alpha }
   */
  function drawFruit(ctx, x, y, f) {
    const type = f.type;
    const pose = f.pose || {};
    const t = f.t || 0;
    const body = bodies[type.key];
    ctx.save();
    ctx.translate(x, y);
    if (f.tilt) ctx.rotate(f.tilt);
    ctx.scale(f.size * (f.sx || 1) * (f.facing || 1), f.size * (f.sy || 1));
    if (f.alpha != null) ctx.globalAlpha = f.alpha;
    ctx.lineJoin = 'round';

    if (!f.noLegs) drawLegs(ctx, type, pose, t);
    ctx.translate(0, BODY_Y);
    if (pose.back) drawArms(ctx, type, pose, t);

    drawDetails(ctx, type, t);
    drawPants(ctx, type, f.pants || PANTS[0], pose.back, body);
    if (!pose.back) drawTop(ctx, type, t);
    drawHeadband(ctx, type, pose.back, t, f.band || '#e8202a');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.07;
    ctx.stroke(body);
    if (pose.back) drawTop(ctx, type, t);
    else {
      drawFace(ctx, type, pose, t);
      drawArms(ctx, type, pose, t);
    }
    if (f.flash > 0) {
      ctx.globalAlpha = Math.min(1, f.flash) * (f.alpha != null ? f.alpha : 1);
      ctx.fillStyle = '#fff';
      ctx.fill(body);
    }
    ctx.restore();
  }

  // Lone underpants (used when a fruit gets popped clean out of its pants!)
  function drawLonePants(ctx, x, y, size, pants, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(size, size);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.06;
    ctx.lineJoin = 'round';
    const p = new Path2D();
    p.moveTo(-0.8, -0.3);
    p.lineTo(0.8, -0.3);
    p.lineTo(0.7, 0.25);
    p.quadraticCurveTo(0.25, 0.3, 0.12, 0.55);
    p.lineTo(-0.12, 0.55);
    p.quadraticCurveTo(-0.25, 0.3, -0.7, 0.25);
    p.closePath();
    ctx.fillStyle = pants.base;
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    ctx.fillStyle = pants.ink;
    if (pants.pattern === 'hearts') heart(ctx, 0, 0.05, 0.22);
    else if (pants.pattern === 'dots') {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-0.5 + i * 0.25, (i % 2) * 0.2, 0.06, 0, 7);
        ctx.fill();
      }
    } else if (pants.pattern === 'stars') {
      star(ctx, 0, 0.05, 0.18);
      ctx.fill();
    } else if (pants.pattern === 'stripes') {
      ctx.strokeStyle = pants.ink;
      ctx.lineWidth = 0.08;
      for (let x2 = -0.7; x2 < 0.8; x2 += 0.22) {
        ctx.beginPath();
        ctx.moveTo(x2, -0.3);
        ctx.lineTo(x2, 0.6);
        ctx.stroke();
      }
    }
    ctx.fillStyle = pants.band;
    ctx.fillRect(-0.85, -0.32, 1.7, 0.14);
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    ctx.restore();
  }

  // Little ghost that floats up after a knock-out (with a halo)
  function drawGhost(ctx, x, y, size, t, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.ellipse(0, -1.25, 0.4, 0.12, 0, 0, 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = color || '#999';
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.arc(0, -0.4, 0.6, Math.PI, 0);
    for (let i = 0; i <= 6; i++) {
      const xx = 0.6 - (i / 6) * 1.2;
      ctx.lineTo(xx, 0.5 + (i % 2 ? -0.15 : 0) + Math.sin(t * 8 + i) * 0.05);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-0.2, -0.45, 0.08, 0, 7);
    ctx.arc(0.2, -0.45, 0.08, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -0.15, 0.1, 0.12, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  window.FruitArt = { TYPES, PANTS, BODY_Y, drawFruit, drawLonePants, drawGhost, star, heart, glove, INK };
})();
