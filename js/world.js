// Fruit Punch - environments (backgrounds, hiding-spot obstacles, ambient effects)
(function () {
  const INK = '#2b1a10';
  const rnd = (a, b) => a + Math.random() * (b - a);

  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function vgrad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  function hills(ctx, W, baseY, amp, color, freq, phase) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY + 400);
    for (let x = 0; x <= W + 20; x += 20) {
      ctx.lineTo(x, baseY - amp * (0.5 + 0.5 * Math.sin(x * freq + phase)) - amp * 0.3 * Math.sin(x * freq * 2.3 + phase * 2));
    }
    ctx.lineTo(W, baseY + 400);
    ctx.closePath();
    ctx.fill();
  }

  function cloud(ctx, x, y, s, color) {
    ctx.fillStyle = color || 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(x, y, 30 * s, 0, 7);
    ctx.arc(x + 35 * s, y - 15 * s, 38 * s, 0, 7);
    ctx.arc(x + 75 * s, y, 30 * s, 0, 7);
    ctx.arc(x + 38 * s, y + 10 * s, 30 * s, 0, 7);
    ctx.fill();
  }

  function ground(ctx, W, H, HZ, c1, c2) {
    ctx.fillStyle = vgrad(ctx, HZ, H, [c1, c2]);
    ctx.fillRect(0, HZ, W, H - HZ);
  }

  function sun(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(255,230,80,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  // ---------- Backgrounds ----------
  const BG = {
    meadow(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#5ec8ff', '#c9efff']);
      ctx.fillRect(0, 0, W, HZ + 5);
      sun(ctx, W * 0.85, 90, 55);
      hills(ctx, W, HZ - 10, 70, '#9be37a', 0.006, 1);
      hills(ctx, W, HZ + 5, 40, '#7ed35a', 0.011, 3);
      ground(ctx, W, H, HZ, '#79d350', '#3f9e2c');
      for (let i = 0; i < 120; i++) {
        const x = R() * W, y = HZ + 20 + R() * (H - HZ);
        ctx.fillStyle = ['#fff', '#ffe14d', '#ff7ab8', '#ffffff'][i % 4];
        ctx.beginPath();
        ctx.arc(x, y, 2 + (y - HZ) / 90, 0, 7);
        ctx.fill();
      }
    },
    beach(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#3fb7ff', '#bdf0ff']);
      ctx.fillRect(0, 0, W, HZ);
      sun(ctx, W * 0.15, 85, 50);
      ctx.fillStyle = vgrad(ctx, HZ - 70, HZ + 30, ['#1f8fe0', '#2fc0e8']);
      ctx.fillRect(0, HZ - 70, W, 110);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 25; i++) {
        const x = R() * W, y = HZ - 60 + R() * 80;
        ctx.beginPath();
        ctx.arc(x, y, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ground(ctx, W, H, HZ + 20, '#ffe7a8', '#f2c46a');
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, HZ + 25);
      for (let x = 0; x <= W; x += 30) ctx.lineTo(x, HZ + 20 + Math.sin(x * 0.05) * 6);
      ctx.lineTo(W, HZ + 30);
      ctx.lineTo(0, HZ + 30);
      ctx.fill();
      // palm tree
      const px = W * 0.88;
      ctx.strokeStyle = '#a0662a';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px, HZ + 40);
      ctx.quadraticCurveTo(px - 50, HZ - 120, px - 10, HZ - 240);
      ctx.stroke();
      ctx.fillStyle = '#2fa04a';
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(px - 10, HZ - 240);
        ctx.rotate(-2.6 + i * 0.75);
        ctx.beginPath();
        ctx.ellipse(70, 0, 80, 18, 0.2, 0, 7);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = 'rgba(200,150,60,0.4)';
        ctx.beginPath();
        ctx.arc(R() * W, HZ + 40 + R() * (H - HZ), 2, 0, 7);
        ctx.fill();
      }
    },
    kitchen(ctx, W, H, HZ, R) {
      ctx.fillStyle = '#fff6e3';
      ctx.fillRect(0, 0, W, HZ);
      const ts = 48;
      for (let y = 0; y < HZ; y += ts)
        for (let x = 0; x < W; x += ts) {
          ctx.fillStyle = ((x + y) / ts) % 2 ? '#ffd9d9' : '#ffffff';
          ctx.fillRect(x, y, ts - 2, ts - 2);
        }
      // window
      const wx = W * 0.5 - 150;
      ctx.fillStyle = '#8fd8ff';
      ctx.fillRect(wx, 40, 300, 200);
      cloud(ctx, wx + 60, 120, 0.7);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.strokeRect(wx, 40, 300, 200);
      ctx.beginPath();
      ctx.moveTo(wx + 150, 40);
      ctx.lineTo(wx + 150, 240);
      ctx.moveTo(wx, 140);
      ctx.lineTo(wx + 300, 140);
      ctx.stroke();
      // cabinets
      ctx.fillStyle = '#7fc7a8';
      ctx.fillRect(0, 0, wx - 40, 130);
      ctx.fillRect(wx + 340, 0, W - wx - 340, 130);
      ctx.strokeStyle = '#4f9a7c';
      ctx.lineWidth = 4;
      for (let x = 10; x < W; x += 140) {
        if (x > wx - 160 && x < wx + 330) continue;
        ctx.strokeRect(x, 8, 120, 110);
      }
      // counter
      ground(ctx, W, H, HZ, '#e2b47c', '#b07a44');
      ctx.fillStyle = '#c99b63';
      ctx.fillRect(0, HZ - 10, W, 14);
      ctx.strokeStyle = 'rgba(120,70,30,0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        const y = HZ + 20 + R() * (H - HZ);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(W * 0.3, y + 8, W * 0.6, y - 8, W, y);
        ctx.stroke();
      }
    },
    jungle(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#1f6b3a', '#7cc96b']);
      ctx.fillRect(0, 0, W, HZ);
      for (let i = 0; i < 7; i++) {
        const x = R() * W;
        ctx.fillStyle = '#4a3420';
        ctx.fillRect(x, 0, 30 + R() * 30, HZ + 10);
      }
      ctx.strokeStyle = '#2e8b3a';
      ctx.lineWidth = 6;
      for (let i = 0; i < 12; i++) {
        const x = R() * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 40, 100, x - 10, 180 + R() * 100);
        ctx.stroke();
      }
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = i % 2 ? '#2b8a3e' : '#37a24b';
        ctx.beginPath();
        ctx.ellipse(R() * W, R() * 120, 70, 30, R() * 3, 0, 7);
        ctx.fill();
      }
      hills(ctx, W, HZ + 5, 30, '#2f8f3f', 0.02, 2);
      ground(ctx, W, H, HZ, '#4f9a3a', '#2c6420');
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = 'rgba(30,80,20,0.5)';
        ctx.beginPath();
        ctx.ellipse(R() * W, HZ + 30 + R() * (H - HZ), 14, 6, R() * 3, 0, 7);
        ctx.fill();
      }
    },
    snow(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#8ab8e8', '#e6f3ff']);
      ctx.fillRect(0, 0, W, HZ);
      for (let i = 0; i < 5; i++) {
        const x = (i / 4) * W, h = 180 + R() * 100;
        ctx.fillStyle = '#9fb3cc';
        ctx.beginPath();
        ctx.moveTo(x - 220, HZ + 10);
        ctx.lineTo(x, HZ - h);
        ctx.lineTo(x + 220, HZ + 10);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 66, HZ - h * 0.7);
        ctx.lineTo(x, HZ - h);
        ctx.lineTo(x + 66, HZ - h * 0.7);
        ctx.lineTo(x + 30, HZ - h * 0.62);
        ctx.lineTo(x, HZ - h * 0.72);
        ctx.lineTo(x - 30, HZ - h * 0.62);
        ctx.fill();
      }
      hills(ctx, W, HZ + 5, 30, '#f4f9ff', 0.008, 1);
      ground(ctx, W, H, HZ, '#f7fbff', '#cfe0f2');
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(160,190,230,0.4)';
        ctx.beginPath();
        ctx.ellipse(R() * W, HZ + 30 + R() * (H - HZ), 30, 6, 0, 0, 7);
        ctx.fill();
      }
    },
    candy(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#ff9ad5', '#ffe0f3']);
      ctx.fillRect(0, 0, W, HZ);
      for (let i = 0; i < 5; i++) cloud(ctx, R() * W, 50 + R() * 140, 0.8 + R() * 0.5, 'rgba(255,255,255,0.85)');
      // lollipops in the distance
      for (let i = 0; i < 6; i++) {
        const x = 80 + R() * (W - 160), h = 120 + R() * 120;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x, HZ);
        ctx.lineTo(x, HZ - h);
        ctx.stroke();
        ctx.fillStyle = ['#ff4f9a', '#6ad1ff', '#ffd23f', '#9b6bff'][i % 4];
        ctx.beginPath();
        ctx.arc(x, HZ - h, 34, 0, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let a = 0; a < 16; a += 0.3) ctx.lineTo(x + Math.cos(a) * a * 2, HZ - h + Math.sin(a) * a * 2);
        ctx.stroke();
      }
      hills(ctx, W, HZ + 5, 35, '#8a5a3c', 0.012, 0.5);
      ground(ctx, W, H, HZ, '#b8f5d9', '#7fd9b3');
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = ['#ff4f9a', '#ffd23f', '#6ad1ff', '#ffffff', '#9b6bff'][i % 5];
        ctx.save();
        ctx.translate(R() * W, HZ + 20 + R() * (H - HZ));
        ctx.rotate(R() * 3);
        ctx.fillRect(-6, -2, 12, 4);
        ctx.restore();
      }
    },
    spooky(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#140a2e', '#4a2a7a']);
      ctx.fillRect(0, 0, W, HZ);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.7) + ')';
        ctx.fillRect(R() * W, R() * HZ * 0.8, 2, 2);
      }
      ctx.fillStyle = 'rgba(255,250,200,0.2)';
      ctx.beginPath();
      ctx.arc(W * 0.78, 110, 90, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#fff6c9';
      ctx.beginPath();
      ctx.arc(W * 0.78, 110, 62, 0, 7);
      ctx.fill();
      hills(ctx, W, HZ, 60, '#24143f', 0.007, 2);
      // dead trees
      ctx.strokeStyle = '#120a20';
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const x = R() * W;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(x, HZ + 10);
        ctx.lineTo(x + 10, HZ - 170);
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 6, HZ - 100);
        ctx.lineTo(x - 50, HZ - 160);
        ctx.moveTo(x + 9, HZ - 140);
        ctx.lineTo(x + 60, HZ - 200);
        ctx.moveTo(x + 30, HZ - 170);
        ctx.lineTo(x + 40, HZ - 220);
        ctx.stroke();
      }
      ground(ctx, W, H, HZ, '#3a2d4f', '#1d1530');
      ctx.fillStyle = 'rgba(180,255,180,0.08)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(R() * W, HZ + 40 + R() * 200, 200, 25, 0, 0, 7);
        ctx.fill();
      }
    },
    pirate(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#ffb36b', '#ffe7b5']);
      ctx.fillRect(0, 0, W, HZ);
      sun(ctx, W * 0.3, HZ - 60, 60);
      ctx.fillStyle = '#2a6fb0';
      ctx.fillRect(0, HZ - 60, W, 70);
      // mast + sail
      const mx = W * 0.7;
      ctx.fillStyle = '#6b4220';
      ctx.fillRect(mx - 12, 0, 24, HZ);
      ctx.fillStyle = '#f7f0dc';
      ctx.beginPath();
      ctx.moveTo(mx - 200, 30);
      ctx.quadraticCurveTo(mx, 70, mx + 200, 30);
      ctx.lineTo(mx + 180, 230);
      ctx.quadraticCurveTo(mx, 260, mx - 180, 230);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(mx, 130, 34, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#f7f0dc';
      ctx.beginPath();
      ctx.arc(mx - 12, 125, 7, 0, 7);
      ctx.arc(mx + 12, 125, 7, 0, 7);
      ctx.fill();
      // railing
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(0, HZ - 25, W, 14);
      for (let x = 10; x < W; x += 50) ctx.fillRect(x, HZ - 25, 10, 40);
      // deck planks
      ground(ctx, W, H, HZ + 10, '#b97a3e', '#8a5426');
      ctx.strokeStyle = 'rgba(60,30,10,0.45)';
      ctx.lineWidth = 3;
      for (let y = HZ + 10, i = 0; y < H; i++, y += 22 + i * 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    },
    moon(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#05051a', '#1b1b45']);
      ctx.fillRect(0, 0, W, HZ);
      for (let i = 0; i < 150; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.7) + ')';
        const s = R() < 0.1 ? 3 : 1.5;
        ctx.fillRect(R() * W, R() * HZ, s, s);
      }
      // earth
      const ex = W * 0.18, ey = 110;
      ctx.fillStyle = '#2f7de0';
      ctx.beginPath();
      ctx.arc(ex, ey, 55, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#4fc760';
      ctx.beginPath();
      ctx.ellipse(ex - 15, ey - 10, 22, 14, 0.5, 0, 7);
      ctx.ellipse(ex + 20, ey + 18, 16, 10, -0.4, 0, 7);
      ctx.fill();
      hills(ctx, W, HZ + 5, 40, '#8d8da0', 0.009, 1);
      ground(ctx, W, H, HZ, '#b9b9c9', '#7c7c92');
      for (let i = 0; i < 25; i++) {
        const x = R() * W, y = HZ + 40 + R() * (H - HZ - 40), r = 10 + R() * 30;
        ctx.fillStyle = 'rgba(90,90,110,0.45)';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.35, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = 'rgba(230,230,240,0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.08, r * 0.8, r * 0.22, 0, 0, Math.PI);
        ctx.fill();
      }
    },
    volcano(ctx, W, H, HZ, R) {
      ctx.fillStyle = vgrad(ctx, 0, HZ, ['#3b0d0d', '#ff6a2b']);
      ctx.fillRect(0, 0, W, HZ);
      const vx = W * 0.5;
      ctx.fillStyle = '#2a1414';
      ctx.beginPath();
      ctx.moveTo(vx - 420, HZ + 5);
      ctx.lineTo(vx - 70, HZ - 230);
      ctx.lineTo(vx + 70, HZ - 230);
      ctx.lineTo(vx + 420, HZ + 5);
      ctx.fill();
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(vx - 70, HZ - 230);
      ctx.lineTo(vx - 40, HZ - 150);
      ctx.lineTo(vx - 10, HZ - 190);
      ctx.lineTo(vx + 20, HZ - 120);
      ctx.lineTo(vx + 45, HZ - 200);
      ctx.lineTo(vx + 70, HZ - 230);
      ctx.fill();
      ctx.fillStyle = 'rgba(80,60,60,0.6)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(vx - 20 + i * 15, HZ - 270 - i * 30, 30 + i * 8, 0, 7);
        ctx.fill();
      }
      ground(ctx, W, H, HZ, '#4a2a22', '#241210');
      ctx.strokeStyle = '#ff6a00';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff9a00';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 9; i++) {
        let x = R() * W, y = HZ + 30 + R() * (H - HZ - 30);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
          x += 20 + R() * 30;
          y += (R() - 0.5) * 25;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    },
  };

  // ---------- Obstacles (hiding spots). Drawn bottom-centre at (0,0) with size w x h ----------
  function outline(ctx, lw) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw || 4;
    ctx.stroke();
  }

  // Puffy mound made of overlapping circles (bushes, snow piles)
  function mound(ctx, w, h, color, dark, bumps) {
    const n = bumps || 4;
    const circles = [];
    const r = w / (n + 0.6);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + r * 0.9 + (i / (n - 1)) * (w - r * 1.8);
      const lift = Math.sin(((i + 0.5) / n) * Math.PI);
      circles.push([x, -h + r * (1.05 - 0.25 * lift) + (1 - lift) * h * 0.25, r * (0.95 + 0.15 * lift)]);
    }
    circles.push([0, -h * 0.35, w * 0.45]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w, -h * 2, w * 2, h * 2);
    ctx.clip();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    for (const [x, y, rr] of circles) {
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, 7);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    for (const [x, y, rr] of circles) {
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, 7);
      ctx.fill();
    }
    ctx.fillRect(-w / 2 + 4, -h * 0.4, w - 8, h * 0.4 - 2);
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 2, 0);
    ctx.lineTo(w / 2 + 2, 0);
    ctx.stroke();
    if (dark) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(0, -2, w * 0.4, h * 0.1, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  function box(ctx, w, h, color, edge) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(-w / 2, -h, w, h);
    ctx.fill();
    outline(ctx);
    if (edge) {
      ctx.fillStyle = edge;
      ctx.fillRect(-w / 2 + 2, -h + 2, w - 4, h * 0.12);
    }
  }

  function rockShape(ctx, w, h, color, light) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w * 0.48, -h * 0.5);
    ctx.lineTo(-w * 0.3, -h * 0.92);
    ctx.lineTo(w * 0.05, -h);
    ctx.lineTo(w * 0.38, -h * 0.82);
    ctx.lineTo(w / 2, -h * 0.35);
    ctx.lineTo(w * 0.46, 0);
    ctx.closePath();
    ctx.fill();
    outline(ctx);
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.88);
    ctx.lineTo(w * 0.05, -h * 0.95);
    ctx.lineTo(-w * 0.05, -h * 0.6);
    ctx.lineTo(-w * 0.4, -h * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  const OBS = {
    bush: { w: 190, h: 150, top: 0.92, draw(ctx, w, h) {
      mound(ctx, w, h, '#2fa84a', null, 4);
      ctx.fillStyle = '#4fcf62';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(-w * 0.3 + (i % 3) * w * 0.3, -h * (0.35 + Math.floor(i / 3) * 0.3), 10, 0, 7);
        ctx.fill();
      }
    } },
    flowerbush: { w: 190, h: 150, top: 0.92, draw(ctx, w, h) {
      OBS.bush.draw(ctx, w, h);
      const cols = ['#ff5ca8', '#ffe14d', '#ffffff'];
      for (let i = 0; i < 7; i++) {
        const x = -w * 0.38 + (i / 6) * w * 0.76, y = -h * (0.3 + ((i * 37) % 5) / 9);
        ctx.fillStyle = cols[i % 3];
        for (let p = 0; p < 5; p++) {
          ctx.beginPath();
          ctx.arc(x + Math.cos(p * 1.26) * 7, y + Math.sin(p * 1.26) * 7, 5, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = '#ff9a00';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 7);
        ctx.fill();
      }
    } },
    rock: { w: 180, h: 140, top: 0.9, draw(ctx, w, h) { rockShape(ctx, w, h, '#8f8f99', '#b5b5c0'); } },
    hay: { w: 200, h: 140, top: 1, draw(ctx, w, h) {
      ctx.fillStyle = '#f1c94a';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 18);
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#c99a1e';
      ctx.lineWidth = 3;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, -h + (i / 8) * h);
        ctx.lineTo(w / 2 - 8, -h + (i / 8) * h + 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#b5521e';
      ctx.fillRect(-w * 0.3, -h, 10, h);
      ctx.fillRect(w * 0.25, -h, 10, h);
    } },
    sandcastle: { w: 190, h: 160, top: 0.72, draw(ctx, w, h) {
      ctx.fillStyle = '#f4cf7c';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      const tw = w * 0.28;
      for (const tx of [-w / 2, w / 2 - tw]) {
        ctx.beginPath();
        ctx.rect(tx, -h, tw, h);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.rect(tx + i * (tw / 3) + 2, -h - 14, tw / 3 - 6, 14);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.rect(-w / 2 + tw - 4, -h * 0.72, w - tw * 2 + 8, h * 0.72);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7a5520';
      ctx.beginPath();
      ctx.arc(0, -h * 0.18, 18, Math.PI, 0);
      ctx.lineTo(18, 0);
      ctx.lineTo(-18, 0);
      ctx.fill();
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath();
      ctx.moveTo(-w / 2 + tw / 2, -h - 14);
      ctx.lineTo(-w / 2 + tw / 2, -h - 50);
      ctx.lineTo(-w / 2 + tw / 2 + 26, -h - 40);
      ctx.lineTo(-w / 2 + tw / 2, -h - 30);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    } },
    cooler: { w: 190, h: 135, top: 1, draw(ctx, w, h) {
      box(ctx, w, h, '#3d8bff');
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.rect(-w / 2, -h, w, h * 0.25);
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(-25, -h - 12, 50, 12);
    } },
    beachrock: { w: 190, h: 140, top: 0.9, draw(ctx, w, h) {
      rockShape(ctx, w, h, '#a58a6a', '#c8ae8c');
      ctx.fillStyle = '#ff7a5c';
      FruitArt.star(ctx, w * 0.15, -h * 0.4, 16);
      ctx.fill();
    } },
    cereal: { w: 150, h: 200, top: 1, draw(ctx, w, h) {
      box(ctx, w, h, '#ff5a3c');
      ctx.fillStyle = '#ffe14d';
      ctx.font = 'bold 30px "Luckiest Guy", "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FRUITY', 0, -h + 50);
      ctx.fillText('O\'s', 0, -h + 82);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.3, w * 0.35, h * 0.16, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = '#ffb000';
      ctx.lineWidth = 6;
      ctx.lineWidth = 5;
      for (const [cx, cy] of [[-34, -6], [-8, 8], [20, -10], [38, 10], [6, -22]]) {
        ctx.beginPath();
        ctx.arc(cx, -h * 0.3 + cy, 7, 0, 7);
        ctx.stroke();
      }
    } },
    toaster: { w: 200, h: 145, top: 1, draw(ctx, w, h) {
      ctx.fillStyle = '#c9d3dd';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 28);
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#333';
      ctx.fillRect(-w * 0.32, -h + 10, w * 0.24, 10);
      ctx.fillRect(w * 0.08, -h + 10, w * 0.24, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(-w * 0.4, -h * 0.75, 14, h * 0.55);
      ctx.fillStyle = '#222';
      ctx.fillRect(w / 2 - 4, -h * 0.55, 16, 10);
    } },
    jar: { w: 160, h: 170, top: 1, draw(ctx, w, h) {
      ctx.fillStyle = 'rgba(190,230,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h * 0.88, w, h * 0.88, 22);
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#b3123a';
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 6, -h * 0.65, w - 12, h * 0.62, 16);
      ctx.fill();
      ctx.fillStyle = '#ff6b3c';
      ctx.beginPath();
      ctx.rect(-w / 2 - 4, -h, w + 8, h * 0.14);
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-w * 0.3, -h * 0.5, w * 0.6, h * 0.22);
      ctx.fillStyle = '#b3123a';
      ctx.font = 'bold 22px "Luckiest Guy", "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JAM', 0, -h * 0.33);
    } },
    fern: { w: 210, h: 160, top: 0.85, draw(ctx, w, h) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.32;
        ctx.save();
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = i % 2 ? '#1f8a3a' : '#2fae4a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(w * 0.28, -h * 0.5, 0, -h);
        ctx.quadraticCurveTo(-w * 0.28, -h * 0.5, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -h * 0.95);
        ctx.stroke();
        ctx.restore();
      }
    } },
    stump: { w: 180, h: 140, top: 0.95, draw(ctx, w, h) {
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 10, 0);
      ctx.lineTo(-w / 2, -h);
      ctx.lineTo(w / 2, -h);
      ctx.lineTo(w / 2 + 10, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#e0b07a';
      ctx.beginPath();
      ctx.ellipse(0, -h, w / 2, 18, 0, 0, 7);
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#a8763c';
      ctx.lineWidth = 2;
      for (let r = 1; r < 4; r++) {
        ctx.beginPath();
        ctx.ellipse(0, -h, (w / 2) * (r / 4), 18 * (r / 4), 0, 0, 7);
        ctx.stroke();
      }
      ctx.strokeStyle = '#5e3a18';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.35 + i * w * 0.22, -h * 0.85);
        ctx.lineTo(-w * 0.37 + i * w * 0.23, -h * 0.1);
        ctx.stroke();
      }
    } },
    mossrock: { w: 190, h: 150, top: 0.9, draw(ctx, w, h) {
      rockShape(ctx, w, h, '#6f7a6a', '#8f9a88');
      ctx.fillStyle = '#4fae3a';
      ctx.beginPath();
      ctx.ellipse(-w * 0.1, -h * 0.9, w * 0.28, 14, 0.1, 0, 7);
      ctx.fill();
    } },
    snowman: { w: 170, h: 200, top: 0.75, draw(ctx, w, h) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      const r1 = w * 0.5, r2 = w * 0.36, r3 = w * 0.24;
      ctx.beginPath();
      ctx.arc(0, -r1, r1, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -r1 * 2 - r2 * 0.6, r2, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -r1 * 2 - r2 * 1.6 - r3 * 0.5, r3, 0, 7);
      ctx.fill();
      ctx.stroke();
      const hy = -r1 * 2 - r2 * 1.6 - r3 * 0.5;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-10, hy - 5, 4, 0, 7);
      ctx.arc(10, hy - 5, 4, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#ff8a1a';
      ctx.beginPath();
      ctx.moveTo(0, hy + 2);
      ctx.lineTo(28, hy + 6);
      ctx.lineTo(0, hy + 10);
      ctx.fill();
      ctx.fillStyle = '#e8202a';
      ctx.fillRect(-r2 * 0.9, -r1 * 2 - r2 * 1.35, r2 * 1.8, 12);
    } },
    snowpile: { w: 210, h: 140, top: 0.9, draw(ctx, w, h) { mound(ctx, w, h, '#ffffff', 'rgba(170,200,235,0.6)', 3); } },
    igloo: { w: 220, h: 150, top: 0.92, draw(ctx, w, h) {
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#a9c8e8';
      ctx.lineWidth = 3;
      for (let y = -h + 30; y < 0; y += 30) {
        ctx.beginPath();
        ctx.moveTo(-w, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        for (let x = -w / 2 + ((y / 30) % 2 ? 20 : 0); x < w / 2; x += 45) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 30);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.fillStyle = '#26384f';
      ctx.beginPath();
      ctx.arc(w * 0.18, 0, 28, Math.PI, 0);
      ctx.fill();
    } },
    cupcake: { w: 170, h: 170, top: 0.9, draw(ctx, w, h) {
      ctx.fillStyle = '#ff7ab8';
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -h * 0.5);
      ctx.lineTo(w * 0.4, -h * 0.5);
      ctx.lineTo(w * 0.32, 0);
      ctx.lineTo(-w * 0.32, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#d94f90';
      ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w * 0.11, -h * 0.5);
        ctx.lineTo(i * w * 0.09, 0);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff3fa';
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -h * 0.5);
      ctx.quadraticCurveTo(-w * 0.5, -h * 0.85, 0, -h * 0.9);
      ctx.quadraticCurveTo(w * 0.5, -h * 0.85, w * 0.48, -h * 0.5);
      ctx.quadraticCurveTo(0, -h * 0.42, -w * 0.48, -h * 0.5);
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#e8202a';
      ctx.beginPath();
      ctx.arc(0, -h * 0.94, 14, 0, 7);
      ctx.fill();
      outline(ctx, 3);
      ['#6ad1ff', '#ffd23f', '#9b6bff', '#4fcf62'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(-w * 0.3 + i * w * 0.18, -h * 0.7 + (i % 2) * 10, 10, 4);
      });
    } },
    gumdrop: { w: 180, h: 150, top: 0.92, draw(ctx, w, h) {
      ctx.fillStyle = this.color || '#9b6bff';
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.bezierCurveTo(-w / 2, -h * 1.3, w / 2, -h * 1.3, w / 2, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 18; i++) {
        ctx.fillRect(-w * 0.35 + ((i * 47) % 100) / 100 * w * 0.7, -h * 0.85 + ((i * 31) % 80) / 100 * h, 4, 4);
      }
    } },
    tombstone: { w: 160, h: 180, top: 0.95, draw(ctx, w, h) {
      ctx.fillStyle = '#8c8ca3';
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w / 2, -h + w / 2);
      ctx.arc(0, -h + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(w / 2, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#5a5a70';
      ctx.font = 'bold 34px "Luckiest Guy", "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R.I.P.', 0, -h * 0.55);
      ctx.fillStyle = '#3c6b2e';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.6, 12, 0, Math.PI, 0);
      ctx.fill();
    } },
    pumpkin: { w: 190, h: 145, top: 0.88, draw(ctx, w, h) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      for (const [ox, rw, c] of [[-w * 0.22, 0.32, '#e86a0f'], [w * 0.22, 0.32, '#e86a0f'], [0, 0.36, '#ff8a1f']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(ox, -h * 0.45, w * rw, h * 0.45, 0, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#3c6b2e';
      ctx.fillRect(-8, -h - 14, 16, 26);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(-w * 0.25, -h * 0.6);
      ctx.lineTo(-w * 0.12, -h * 0.75);
      ctx.lineTo(-w * 0.05, -h * 0.55);
      ctx.moveTo(w * 0.25, -h * 0.6);
      ctx.lineTo(w * 0.12, -h * 0.75);
      ctx.lineTo(w * 0.05, -h * 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, -h * 0.35);
      for (let i = 0; i <= 6; i++) ctx.lineTo(-w * 0.28 + (i / 6) * w * 0.56, -h * (i % 2 ? 0.3 : 0.2));
      ctx.lineTo(w * 0.2, -h * 0.12);
      ctx.lineTo(-w * 0.2, -h * 0.12);
      ctx.fill();
    } },
    barrel: { w: 160, h: 175, top: 1, draw(ctx, w, h) {
      ctx.fillStyle = '#a0612a';
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, 0);
      ctx.quadraticCurveTo(-w * 0.58, -h / 2, -w * 0.42, -h);
      ctx.lineTo(w * 0.42, -h);
      ctx.quadraticCurveTo(w * 0.58, -h / 2, w * 0.42, 0);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.strokeStyle = '#5c5c66';
      ctx.lineWidth = 9;
      for (const y of [0.18, 0.82]) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * y);
        ctx.lineTo(w * 0.5, -h * y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(60,30,10,0.5)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w * 0.15, -h + 5);
        ctx.quadraticCurveTo(i * w * 0.2, -h / 2, i * w * 0.15, -5);
        ctx.stroke();
      }
    } },
    crate: { w: 170, h: 160, top: 1, draw(ctx, w, h) {
      box(ctx, w, h, this.color || '#c98b45');
      ctx.strokeStyle = this.dark || '#8a5426';
      ctx.lineWidth = 10;
      ctx.strokeRect(-w / 2 + 8, -h + 8, w - 16, h - 16);
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 12, -12);
      ctx.lineTo(w / 2 - 12, -h + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-w / 2, -h, w, h);
      outline(ctx);
    } },
    chest: { w: 200, h: 140, top: 1, draw(ctx, w, h) {
      box(ctx, w, h * 0.6, '#9a5a22');
      ctx.fillStyle = '#b5702e';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h * 0.6);
      ctx.quadraticCurveTo(0, -h * 1.15, w / 2, -h * 0.6);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(-w / 2 + 14, -h * 0.95, 14, h * 0.95);
      ctx.fillRect(w / 2 - 28, -h * 0.95, 14, h * 0.95);
      ctx.fillRect(-14, -h * 0.68, 28, 30);
      ctx.fillStyle = INK;
      ctx.fillRect(-4, -h * 0.62, 8, 12);
    } },
    moonrock: { w: 190, h: 140, top: 0.9, draw(ctx, w, h) {
      rockShape(ctx, w, h, '#9a9aae', '#c4c4d4');
      ctx.fillStyle = 'rgba(80,80,100,0.5)';
      for (const [x, y, r] of [[-0.2, -0.5, 14], [0.18, -0.3, 10], [0.05, -0.75, 8]]) {
        ctx.beginPath();
        ctx.arc(x * w, y * h, r, 0, 7);
        ctx.fill();
      }
    } },
    lander: { w: 170, h: 210, top: 0.8, draw(ctx, w, h) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.3);
      ctx.lineTo(-w * 0.5, 0);
      ctx.moveTo(w * 0.3, -h * 0.3);
      ctx.lineTo(w * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = '#f0f0f5';
      ctx.beginPath();
      ctx.moveTo(-w * 0.32, -h * 0.15);
      ctx.lineTo(-w * 0.32, -h * 0.65);
      ctx.quadraticCurveTo(0, -h * 1.15, w * 0.32, -h * 0.65);
      ctx.lineTo(w * 0.32, -h * 0.15);
      ctx.closePath();
      ctx.fill();
      outline(ctx);
      ctx.fillStyle = '#e8202a';
      ctx.fillRect(-w * 0.32, -h * 0.3, w * 0.64, 16);
      ctx.fillStyle = '#6ad1ff';
      ctx.beginPath();
      ctx.arc(0, -h * 0.6, 22, 0, 7);
      ctx.fill();
      outline(ctx);
    } },
    lavarock: { w: 190, h: 150, top: 0.9, draw(ctx, w, h) {
      rockShape(ctx, w, h, '#2f2222', '#4a3434');
      ctx.strokeStyle = '#ff7a00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.2);
      ctx.lineTo(-w * 0.1, -h * 0.45);
      ctx.lineTo(w * 0.05, -h * 0.3);
      ctx.lineTo(w * 0.25, -h * 0.65);
      ctx.stroke();
    } },
    basalt: { w: 170, h: 180, top: 1, draw(ctx, w, h) {
      const cols = [[-0.35, 0.75], [-0.12, 1], [0.12, 0.88], [0.35, 0.7]];
      for (const [x, hh] of cols) {
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath();
        ctx.rect(x * w - w * 0.13, -h * hh, w * 0.26, h * hh);
        ctx.fill();
        outline(ctx, 3);
        ctx.fillStyle = '#ff6a00';
        ctx.fillRect(x * w - w * 0.1, -h * hh + 2, w * 0.2, 5);
      }
    } },
  };

  // ---------- Environments ----------
  const ENVS = [
    { key: 'meadow', name: 'Sunny Meadow', obstacles: ['bush', 'flowerbush', 'rock', 'hay'], ambient: 'clouds', music: { root: 60, tempo: 126 }, bar: '#3f9e2c' },
    { key: 'beach', name: 'Sandy Beach', obstacles: ['sandcastle', 'cooler', 'beachrock'], ambient: 'gulls', music: { root: 62, tempo: 130 }, bar: '#f2c46a' },
    { key: 'kitchen', name: 'Kitchen Chaos', obstacles: ['cereal', 'toaster', 'jar'], ambient: 'none', music: { root: 65, tempo: 136 }, bar: '#b07a44' },
    { key: 'jungle', name: 'Jungle Rumble', obstacles: ['fern', 'stump', 'mossrock'], ambient: 'leaves', music: { root: 57, tempo: 132, minor: true }, bar: '#2c6420' },
    { key: 'snow', name: 'Snowy Peaks', obstacles: ['snowman', 'snowpile', 'igloo'], ambient: 'snow', music: { root: 64, tempo: 128 }, bar: '#cfe0f2' },
    { key: 'candy', name: 'Candy Land', obstacles: ['cupcake', 'gumdrop', 'gumdrop'], ambient: 'sparkles', music: { root: 67, tempo: 140 }, bar: '#7fd9b3' },
    { key: 'spooky', name: 'Spooky Graveyard', obstacles: ['tombstone', 'pumpkin', 'tombstone'], ambient: 'bats', music: { root: 57, tempo: 120, minor: true }, bar: '#1d1530' },
    { key: 'pirate', name: 'Pirate Ship', obstacles: ['barrel', 'crate', 'chest'], ambient: 'clouds', music: { root: 62, tempo: 138, minor: true }, bar: '#8a5426' },
    { key: 'moon', name: 'Moon Base', obstacles: ['moonrock', 'lander', 'moonrock'], ambient: 'twinkle', music: { root: 60, tempo: 124 }, bar: '#7c7c92' },
    { key: 'volcano', name: 'Volcano Smash', obstacles: ['lavarock', 'basalt', 'lavarock'], ambient: 'embers', music: { root: 55, tempo: 146, minor: true }, bar: '#241210' },
  ];

  const GUMDROP_COLORS = ['#9b6bff', '#ff4f9a', '#4fcf62', '#ffb000', '#6ad1ff'];

  function renderBackground(env, W, H, HZ, seed) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W);
    c.height = H;
    const g = c.getContext('2d');
    BG[env.key](g, W, H, HZ, seeded(seed || 12345));
    return c;
  }

  function drawObstacle(ctx, o) {
    const def = OBS[o.kind];
    ctx.save();
    ctx.translate(o.x, o.baseY);
    // contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, o.w * 0.55, 10 * o.s, 0, 0, 7);
    ctx.fill();
    if (o.wobble > 0) {
      const a = Math.sin(o.wobble * 40) * o.wobble * 0.15;
      ctx.rotate(a);
      ctx.scale(1 + o.wobble * 0.08, 1 - o.wobble * 0.08);
    }
    ctx.scale(o.s, o.s);
    def.draw.call(o, ctx, def.w, def.h);
    ctx.restore();
  }

  // ---------- Ambient effects ----------
  function makeAmbient(env, W, H, HZ) {
    const list = [];
    const type = env.ambient;
    const n = { clouds: 5, snow: 80, sparkles: 30, bats: 5, twinkle: 25, embers: 40, leaves: 15, gulls: 3 }[type] || 0;
    for (let i = 0; i < n; i++) {
      list.push({ x: Math.random() * W, y: Math.random() * (type === 'clouds' || type === 'gulls' || type === 'bats' ? HZ * 0.6 : H), s: rnd(0.5, 1.2), p: Math.random() * 10, v: rnd(0.5, 1.5) });
    }
    return { type, list };
  }

  function updateDrawAmbient(ctx, amb, dt, W, H, HZ, time) {
    const t = amb.type;
    for (const a of amb.list) {
      if (t === 'clouds') {
        a.x += dt * 12 * a.v;
        if (a.x > W + 100) a.x = -200;
        cloud(ctx, a.x, a.y + 30, a.s);
      } else if (t === 'snow') {
        a.y += dt * 40 * a.v;
        a.x += Math.sin(time + a.p) * dt * 20;
        if (a.y > H) { a.y = -10; a.x = Math.random() * W; }
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2 + a.s * 2, 0, 7);
        ctx.fill();
      } else if (t === 'sparkles' || t === 'twinkle') {
        const al = 0.5 + 0.5 * Math.sin(time * 3 * a.v + a.p);
        ctx.fillStyle = t === 'sparkles' ? 'rgba(255,255,255,' + al + ')' : 'rgba(255,255,220,' + al + ')';
        const yy = t === 'twinkle' ? a.y * (HZ / H) : a.y;
        FruitArt.star(ctx, a.x, yy, 5 * a.s, 4, 0.3);
        ctx.fill();
      } else if (t === 'bats') {
        a.x += dt * 60 * a.v;
        if (a.x > W + 50) { a.x = -50; a.y = Math.random() * HZ * 0.6; }
        const flap = Math.sin(time * 14 + a.p) * 8;
        const y = a.y + Math.sin(time * 2 + a.p) * 15;
        ctx.fillStyle = '#0a0612';
        ctx.beginPath();
        ctx.moveTo(a.x, y);
        ctx.quadraticCurveTo(a.x - 12, y - 8 - flap, a.x - 24, y - flap);
        ctx.quadraticCurveTo(a.x - 12, y - 2, a.x, y + 4);
        ctx.quadraticCurveTo(a.x + 12, y - 2, a.x + 24, y - flap);
        ctx.quadraticCurveTo(a.x + 12, y - 8 - flap, a.x, y);
        ctx.fill();
      } else if (t === 'embers') {
        a.y -= dt * 50 * a.v;
        a.x += Math.sin(time * 2 + a.p) * dt * 25;
        if (a.y < 0) { a.y = H; a.x = Math.random() * W; }
        ctx.fillStyle = 'rgba(255,' + Math.floor(120 + a.s * 80) + ',0,' + (0.5 + 0.5 * Math.sin(time * 5 + a.p)) + ')';
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2 + a.s * 1.5, 0, 7);
        ctx.fill();
      } else if (t === 'leaves') {
        a.y += dt * 30 * a.v;
        a.x += Math.sin(time + a.p) * dt * 40;
        if (a.y > H) { a.y = -10; a.x = Math.random() * W; }
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(time * a.v + a.p);
        ctx.fillStyle = '#5cbf3a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4, 0, 0, 7);
        ctx.fill();
        ctx.restore();
      } else if (t === 'gulls') {
        a.x += dt * 40 * a.v;
        if (a.x > W + 50) a.x = -50;
        const y = a.y + 20, f = Math.sin(time * 6 + a.p) * 5;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a.x - 16, y - f);
        ctx.quadraticCurveTo(a.x - 8, y - 8, a.x, y);
        ctx.quadraticCurveTo(a.x + 8, y - 8, a.x + 16, y - f);
        ctx.stroke();
      }
    }
  }

  window.World = { ENVS, OBS, GUMDROP_COLORS, renderBackground, drawObstacle, makeAmbient, updateDrawAmbient, cloud };
})();
