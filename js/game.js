// Fruit Punch - main game: levels, fruit AI, punching, scoring, UI flow.
(function () {
  const { TYPES, PANTS, BODY_Y, drawFruit, drawLonePants, drawGhost, star, glove } = FruitArt;
  const { ENVS, OBS, GUMDROP_COLORS } = World;

  const H = 720;
  const HZ = 360; // horizon
  let W = 1280;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const persp = (y) => 0.55 + 0.6 * (y - HZ) / (H - HZ);

  const TAP_TIME = 0.22;     // seconds: shorter press = quick punch
  const FULL_CHARGE = 0.9;   // seconds of holding (after TAP_TIME) for a full power punch

  const TAUNTS = {
    nyah: { arms: 'ears', mouth: 'tongue', lines: ['Nyah nyah!', 'Bleeeh!', 'Can\'t catch me!', 'Nyah nyah nyah!'] },
    butt: { arms: 'hips', mouth: 'grin', back: true, lines: ['Kiss my peel!', 'Smell ya later!', 'Nice undies, huh?', 'Wiggle wiggle!'] },
    laugh: { arms: 'belly', mouth: 'open', eyes: 'happy', lines: ['HA HA HA!', 'Hee hee hee!', 'LOL!', 'Too slow!'] },
    flex: { arms: 'flex', mouth: 'grin', lines: ['Look at these guns!', 'Come at me!', 'I\'m sooo strong!', 'Fear me!'] },
    beckon: { arms: 'beckon', mouth: 'grin', lines: ['Come on!', 'Over here!', 'Bring it!', 'Is that all?'] },
    dance: { arms: 'up', mouth: 'open', eyes: 'happy', lines: ['La la la!', 'Party time!', 'Can\'t touch this!', 'Woo hoo!'] },
    yawn: { arms: 'hips', mouth: 'o', eyes: 'closed', lines: ['Zzzz... boring!', '*yawn*', 'Wake me up later', 'So sleepy...'] },
    shadow: { arms: 'punch', mouth: 'grin', lines: ['Hi-YAH!', 'Fruit fu!', 'Pow pow!', 'Watch this!'] },
  };
  const PEEK_TAUNTS = ['nyah', 'laugh', 'beckon', 'yawn', 'butt', 'nyah'];
  const ROAM_TAUNTS = ['nyah', 'butt', 'laugh', 'flex', 'beckon', 'dance', 'shadow', 'butt'];
  const MISS_LINES = ['Missed me!', 'Ha! Missed!', 'Whiff!', 'Nope!', 'Too slow!', 'Over here!'];
  const HIT_LINES = ['OOF!', 'OUCH!', 'Hey!', 'Not fair!', 'Ow ow ow!', 'My peel!'];
  const POW_WORDS = ['POW!', 'BAM!', 'WHAM!', 'SMACK!', 'KAPOW!', 'BONK!', 'THWACK!', 'BOOM!'];
  const POWER_WORDS = ['KA-BOOM!', 'SUPER POW!', 'MEGA PUNCH!', 'KA-POW!!'];
  const TYPE_UNLOCK = [
    ['apple', 'orange', 'banana'], // level 1
    ['strawberry'], ['lemon'], ['grape'], ['pineapple'], ['watermelon'],
  ];

  // ---------------------------------------------------------------- state
  const Store = window.Store;
  Store.load();
  Sfx.setMuted(Store.data.muted);
  Sfx.setMusic(Store.data.music);

  let mode = 'title'; // title | intro | play | paused | complete | timeup
  let time = 0;
  let L = null;          // current level state
  let score = 0;
  let levelStartScore = 0;
  let shake = 0;
  let particles = [];
  let titleFruits = [];
  let pointer = { x: W / 2, y: H / 2, down: false, downT: 0, sx: 0, sy: 0, charging: false, inside: false };
  let banner = null;     // big centre text
  let lastTick = -1;

  // ------------------------------------------------------------- resize
  let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
  function resize() {
    const cw = window.innerWidth, ch = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const oldW = W;
    W = clamp(Math.round(H * (cw / ch)), 960, 1700);
    const scale = Math.min(cw / W, ch / H);
    view = { scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, dpr };
    if (L && oldW !== W) {
      const k = W / oldW;
      for (const o of L.obstacles) o.x *= k;
      for (const f of L.fruits) {
        f.x *= k;
        if (f.tx != null) f.tx *= k;
        if (f.jump) { f.jump.x0 *= k; f.jump.x1 *= k; }
        if (f.layer === 'behind' && f.spot) f.x = f.spot.x;
      }
      L.bg = World.renderBackground(L.env, W, H, HZ, L.seed);
      L.ambient = World.makeAmbient(L.env, W, H, HZ);
    }
    if (mode === 'title' || !L) setupTitleScene();
  }
  window.addEventListener('resize', resize);

  function toWorld(cx, cy) {
    return { x: (cx - view.ox) / view.scale, y: (cy - view.oy) / view.scale };
  }

  // ------------------------------------------------------------- levels
  function levelParams(n) {
    const d = n - 1;
    const types = [];
    for (let i = 0; i < Math.min(n, TYPE_UNLOCK.length); i++) types.push(...TYPE_UNLOCK[i]);
    const target = 6 + n * 2;
    return {
      n,
      env: ENVS[d % ENVS.length],
      loop: Math.floor(d / ENVS.length),
      spots: Math.min(4 + Math.floor(n * 0.8), 12),
      target,
      maxActive: Math.min(2 + Math.floor(n / 2), 7),
      hpBonus: Math.floor(d / 4),
      hideTime: [Math.max(0.5, 1.4 - d * 0.07), Math.max(1.0, 2.8 - d * 0.12)],
      peekTime: Math.max(0.65, 1.9 - d * 0.1),
      outChance: Math.max(0.12, 0.55 - d * 0.035),
      speed: 110 + d * 14,
      time: Math.round(25 + target * 3.2 - Math.min(d, 15)),
      types,
    };
  }

  function buildLevel(n) {
    const p = levelParams(n);
    const seed = 1000 + n * 7919;
    const obstacles = [];
    const rows = [470, 560, 650];
    let tries = 0;
    while (obstacles.length < p.spots && tries < 600) {
      tries++;
      const baseY = rows[Math.floor(Math.random() * rows.length)] + rnd(-20, 20);
      const kind = pick(p.env.obstacles);
      const def = OBS[kind];
      const s = persp(baseY) * rnd(0.95, 1.1);
      const w = def.w * s, h = def.h * s;
      const x = rnd(w / 2 + 20, W - w / 2 - 20);
      let okPos = true;
      for (const o of obstacles) {
        if (Math.abs(o.baseY - baseY) < 85 && Math.abs(o.x - x) < (o.w + w) / 2 + 12) okPos = false;
        else if (Math.abs(o.baseY - baseY) < 160 && Math.abs(o.x - x) < 40) okPos = false;
      }
      if (!okPos) continue;
      obstacles.push({ kind, x, baseY, s, w, h, top: baseY - def.h * def.top * s, wobble: 0, occupant: null, color: kind === 'gumdrop' ? pick(GUMDROP_COLORS) : null });
    }
    return {
      p, n, env: p.env, seed,
      obstacles,
      fruits: [],
      spawned: 0, kos: 0, combo: 0, comboT: 0, bestCombo: 0, powerKOs: 0,
      timeLeft: p.time,
      spawnT: 0.8,
      started: false,
      bg: World.renderBackground(p.env, W, H, HZ, seed),
      ambient: World.makeAmbient(p.env, W, H, HZ),
    };
  }

  // ------------------------------------------------------------- fruit
  function newFruit(typeKey, spot) {
    const type = TYPES[typeKey];
    const f = {
      type,
      hp: type.hp + (L ? L.p.hpBonus : 0),
      maxHp: 0,
      pants: pick(PANTS),
      band: pick(['#e8202a', '#1e6fd9', '#111111', '#ff7a00', '#9b30d9']),
      gloveColor: pick(['#e8202a', '#e8202a', '#1e6fd9', '#2f9e44']),
      facing: Math.random() < 0.5 ? 1 : -1,
      t: Math.random() * 10,
      x: spot ? spot.x + rnd(-spot.w * 0.12, spot.w * 0.12) : W / 2,
      y: spot ? spot.baseY : H - 50,
      layer: spot ? 'behind' : 'front',
      spot: spot || null,
      rise: 0,
      state: 'hidden',
      timer: rnd(0.3, 1.2),
      taunt: null,
      bubble: null,
      flash: 0,
      sx: 1, sy: 1, tilt: 0,
      walk: 0,
      vx: 0, vy: 0,
      pose: { arms: 'guard', mouth: 'grin', eyes: 'normal' },
      roamLeft: 0,
      id: Math.random(),
    };
    f.maxHp = f.hp;
    if (spot) spot.occupant = f;
    return f;
  }

  function freeSpots() {
    return L.obstacles.filter((o) => !o.occupant);
  }

  function trySpawn() {
    const free = freeSpots();
    if (!free.length) return false;
    const spot = pick(free);
    const f = newFruit(pick(L.p.types), spot);
    L.fruits.push(f);
    L.spawned++;
    return true;
  }

  function sizeOf(f) {
    let y = f.layer === 'behind' && f.spot ? f.spot.baseY : f.y;
    if (f.jump) y = lerp(f.jump.g0, f.jump.g1, Math.min(1, f.jump.t / f.jump.dur));
    return f.type.size * persp(clamp(y, HZ + 20, H + 40)) * (f.scaleMul || 1);
  }

  // feet y for a fruit hiding behind spot o with rise 0..1
  function behindY(f, o, rise) {
    const R = f.type.size * o.s;
    const hidden = o.baseY + 3.2 * R;
    const up = o.top + 1.15 * R;
    return lerp(hidden, up, rise);
  }

  function bodyCenter(f) {
    const R = sizeOf(f);
    return { x: f.x, y: f.y + BODY_Y * R * (f.sy || 1), r: R * 1.05 };
  }

  function say(f, text, dur) {
    f.bubble = { text, t: 0, max: dur || 1.4 };
  }

  function startTaunt(f, list, dur) {
    const key = pick(list);
    const T = TAUNTS[key];
    f.taunt = { key, t: 0, max: dur };
    f.pose.arms = T.arms;
    f.pose.mouth = T.mouth;
    f.pose.eyes = T.eyes || 'normal';
    f.pose.back = !!T.back;
    if (Math.random() < 0.75) say(f, pick(T.lines), Math.min(dur, 1.6));
    Sfx.taunt(key, f.type.pitch * rnd(0.95, 1.08));
  }

  function endTaunt(f) {
    f.taunt = null;
    f.pose.arms = 'guard';
    f.pose.mouth = 'grin';
    f.pose.eyes = 'normal';
    f.pose.back = false;
    f.tilt = 0;
  }

  function jump(f, x1, y1, dur, height, toLayer, then) {
    const g0 = f.layer === 'behind' && f.spot ? f.spot.baseY : f.y;
    const g1 = toLayer === 'behind' && f.spot ? f.spot.baseY : y1;
    f.jump = { x0: f.x, y0: f.y, x1, y1, g0, g1, t: 0, dur, height, toLayer, switched: false, then };
    f.state = 'jump';
    if (x1 !== f.x) f.facing = x1 > f.x ? 1 : -1;
    Sfx.boing();
  }

  function randomRoamPoint() {
    return { x: rnd(70, W - 70), y: rnd(HZ + 70, H - 20) };
  }

  function goHide(f, fast) {
    const free = freeSpots();
    if (!free.length) {
      f.state = 'roam';
      f.roamLeft = rnd(1, 2);
      return;
    }
    // nearest free spot
    free.sort((a, b) => Math.hypot(a.x - f.x, a.baseY - f.y) - Math.hypot(b.x - f.x, b.baseY - f.y));
    const o = free[0];
    o.occupant = f;
    f.spot = o;
    f.state = 'runTo';
    f.tx = o.x + rnd(-o.w * 0.1, o.w * 0.1);
    f.ty = Math.min(H - 10, o.baseY + 25);
    f.fast = !!fast;
  }

  function updateFruit(f, dt) {
    f.t += dt;
    if (f.flash > 0) f.flash -= dt * 5;
    if (f.bubble) {
      f.bubble.t += dt;
      if (f.bubble.t > f.bubble.max) f.bubble = null;
    }
    // eyes follow the player's fist
    const c = bodyCenter(f);
    const dx = (pointer.x - c.x) * f.facing, dy = pointer.y - c.y;
    const dl = Math.hypot(dx, dy) || 1;
    f.pose.lookX = dx / dl;
    f.pose.lookY = dy / dl;
    f.pose.walk = f.walk;
    f.pose.gloveColor = f.gloveColor;

    // taunt animation
    if (f.taunt) {
      f.taunt.t += dt;
      const k = f.taunt.key;
      if (k === 'butt') { f.tilt = Math.sin(f.t * 16) * 0.18; f.sx = 1 + Math.sin(f.t * 32) * 0.05; }
      else if (k === 'nyah') f.tilt = Math.sin(f.t * 10) * 0.12;
      else if (k === 'laugh') { f.sy = 1 + Math.sin(f.t * 30) * 0.05; f.tilt = Math.sin(f.t * 15) * 0.05; }
      else if (k === 'dance') { f.tilt = Math.sin(f.t * 8) * 0.25; f.hop = Math.abs(Math.sin(f.t * 8)) * 0.4; }
      else if (k === 'flex') f.sy = 1 + Math.sin(f.t * 8) * 0.04;
      if (f.taunt.t > f.taunt.max) endTaunt(f);
    } else {
      f.sy = lerp(f.sy, 1 + Math.sin(f.t * 6) * 0.03, 0.3);
      f.sx = lerp(f.sx, 1, 0.3);
    }
    if (!f.taunt || f.taunt.key !== 'dance') f.hop = lerp(f.hop || 0, 0, 0.3);

    const p = L.p;
    const spd = p.speed * f.type.speed * persp(f.y);

    switch (f.state) {
      case 'hidden': {
        f.layer = 'behind';
        f.rise = 0;
        f.y = behindY(f, f.spot, 0);
        f.timer -= dt;
        if (f.timer <= 0) {
          // sometimes sneak underground to a different hiding spot
          if (Math.random() < 0.3) {
            const free = freeSpots();
            if (free.length) {
              f.spot.occupant = null;
              f.spot = pick(free);
              f.spot.occupant = f;
              f.x = f.spot.x + rnd(-f.spot.w * 0.12, f.spot.w * 0.12);
            }
          }
          f.state = 'rising';
          f.facing = pointer.x > f.x ? 1 : -1;
          if (Math.random() < 0.5) Sfx.boing();
        }
        break;
      }
      case 'rising': {
        f.rise = Math.min(1, f.rise + dt * 4.5);
        f.y = behindY(f, f.spot, easeOutBack(f.rise));
        if (f.rise >= 1) {
          f.state = 'peek';
          f.timer = p.peekTime * rnd(0.8, 1.3);
          if (Math.random() < 0.8) startTaunt(f, PEEK_TAUNTS, f.timer);
        }
        break;
      }
      case 'peek': {
        f.y = behindY(f, f.spot, 1) + Math.sin(f.t * 5) * 2;
        f.timer -= dt;
        if (f.timer <= 0) {
          endTaunt(f);
          if (Math.random() < p.outChance) {
            const o = f.spot;
            o.occupant = null;
            const tx = clamp(o.x + rnd(-1, 1) * o.w * 0.8, 70, W - 70);
            const ty = clamp(o.baseY + rnd(30, 70), HZ + 70, H - 15);
            jump(f, tx, ty, 0.55, 140, 'front', 'roam');
          } else {
            f.state = 'ducking';
          }
        }
        break;
      }
      case 'ducking': {
        f.rise = Math.max(0, f.rise - dt * 5);
        f.y = behindY(f, f.spot, f.rise);
        if (f.rise <= 0) {
          f.state = 'hidden';
          f.timer = rnd(p.hideTime[0], p.hideTime[1]);
        }
        break;
      }
      case 'jump': {
        const j = f.jump;
        j.t += dt;
        const k = Math.min(1, j.t / j.dur);
        f.x = lerp(j.x0, j.x1, k);
        f.y = lerp(j.y0, j.y1, k) - j.height * 4 * k * (1 - k);
        f.pose.arms = 'up';
        if (!j.switched && k >= 0.5) {
          j.switched = true;
          f.layer = j.toLayer;
          if (j.toLayer === 'front') f.spot = null;
        }
        if (k >= 1) {
          f.pose.arms = 'guard';
          f.jump = null;
          if (j.then === 'roam') {
            f.state = 'roam';
            f.roamLeft = rnd(2.2, 4.5) * (1 - Math.min(0.5, (p.n - 1) * 0.03));
            f.tx = null;
            f.sy = 0.7; // landing squash
            f.sx = 1.25;
          } else if (j.then === 'hide') {
            f.state = 'peek';
            f.rise = 1;
            f.timer = 0.35;
          }
        }
        break;
      }
      case 'roam': {
        f.layer = 'front';
        f.roamLeft -= dt;
        if (f.taunt) {
          f.walk = 0;
          break;
        }
        if (f.roamLeft <= 0) {
          goHide(f);
          break;
        }
        if (f.tx == null) {
          if (f.justArrived && Math.random() < 0.65) {
            f.justArrived = false;
            f.facing = pointer.x > f.x ? 1 : -1;
            startTaunt(f, ROAM_TAUNTS, rnd(0.9, 1.6));
            break;
          }
          const pt = randomRoamPoint();
          f.tx = pt.x;
          f.ty = pt.y;
        }
        if (moveToward(f, f.tx, f.ty, spd, dt)) {
          f.tx = null;
          f.justArrived = true;
        }
        break;
      }
      case 'runTo': {
        f.layer = 'front';
        if (moveToward(f, f.tx, f.ty, spd * (f.fast ? 1.8 : 1.2), dt)) {
          const o = f.spot;
          jump(f, f.x, behindY(f, o, 1), 0.5, 120, 'behind', 'hide');
        }
        break;
      }
      case 'stunned': {
        f.timer -= dt;
        f.x += f.vx * dt;
        f.vx *= Math.pow(0.02, dt);
        f.x = clamp(f.x, 50, W - 50);
        f.pose.eyes = 'dizzy';
        f.pose.mouth = 'ouch';
        f.pose.arms = 'flail';
        if (f.layer === 'behind' && f.spot) f.y = behindY(f, f.spot, 1);
        if (f.timer <= 0) {
          f.pose.eyes = 'normal';
          f.pose.mouth = 'grin';
          f.pose.arms = 'guard';
          if (f.layer === 'behind' && f.spot) {
            f.state = 'ducking';
            f.rise = 1;
          } else goHide(f, true);
        }
        break;
      }
      case 'dying':
        updateDying(f, dt);
        break;
    }
  }

  function moveToward(f, tx, ty, spd, dt) {
    const dx = tx - f.x, dy = ty - f.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) {
      f.walk = 0;
      return true;
    }
    const step = Math.min(d, spd * dt);
    f.x += (dx / d) * step;
    f.y += (dy / d) * step;
    if (Math.abs(dx) > 2) f.facing = dx > 0 ? 1 : -1;
    f.walk += dt * 14;
    return false;
  }

  function easeOutBack(k) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  }

  // ------------------------------------------------------------- death
  function kill(f, power, dir) {
    const c = bodyCenter(f);
    if (f.spot && f.spot.occupant === f) f.spot.occupant = null;
    f.state = 'dying';
    f.taunt = null;
    f.bubble = null;
    f.flash = 1;
    f.dieT = 0;
    f.pose = { arms: 'flail', mouth: 'dead', eyes: 'x', back: false };
    const behind = f.layer === 'behind';
    const types = behind ? ['launch', 'pop'] : power ? ['launch', 'pop', 'pop'] : ['squash', 'launch', 'pop'];
    f.death = pick(types);
    f.layer = 'front';
    f.sortY = f.spot ? f.spot.baseY + 1 : f.y;
    f.fixedSize = sizeOf(f);
    if (f.death === 'launch') {
      f.vx = (dir || (Math.random() < 0.5 ? -1 : 1)) * rnd(500, 850);
      f.vy = -rnd(700, 1000);
      f.spin = rnd(8, 14) * Math.sign(f.vx);
    }
    juice(c.x, c.y, f.type.juice, power ? 36 : 22, power ? 1.4 : 1);
    Sfx.splat();

    // scoring
    L.kos++;
    if (L.comboT > 0) L.combo++;
    else L.combo = 1;
    L.comboT = 1.6;
    L.bestCombo = Math.max(L.bestCombo, L.combo);
    const mult = Math.min(L.combo, 5);
    let pts = f.type.pts * mult + (power ? 50 : 0);
    if (behind) pts += 25; // sneaky peek bonus
    if (power) L.powerKOs++;
    score += pts;
    textPop(c.x, c.y - c.r - 10, '+' + pts, '#fff', 34);
    if (mult > 1) {
      textPop(c.x, c.y - c.r - 50, 'COMBO x' + mult + '!', '#ffe14d', 30);
      Sfx.ding(mult);
    }
    Store.data.totalKOs++;

    // other fruits react
    for (const o of L.fruits) {
      if (o !== f && o.state !== 'dying' && Math.random() < 0.3 && o.state !== 'hidden') {
        say(o, pick(['Noooo!', 'He got Bob!', 'Run!!', 'Yikes!', 'You monster!', 'Eek!']), 1.2);
      }
    }

    if (L.spawned < L.p.target) L.spawnT = Math.max(L.spawnT, rnd(0.3, 1.0));
  }

  function updateDying(f, dt) {
    f.dieT += dt;
    f.t += dt;
    const t = f.dieT;
    if (t < 0.12) return; // hit-stop freeze
    if (f.death === 'squash') {
      const k = Math.min(1, (t - 0.12) / 0.15);
      f.sy = lerp(1, 0.18, k);
      f.sx = lerp(1, 1.9, k);
      if (t > 0.3 && !f.ghosted) {
        f.ghosted = true;
        ghost(f.x, f.y - 20, f.fixedSize, f.type.dark);
      }
      if (t > 0.9) f.alpha = Math.max(0, 1 - (t - 0.9) / 0.4);
      if (t > 1.3) f.dead = true;
    } else if (f.death === 'launch') {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 1900 * dt;
      f.tilt += f.spin * dt;
      f.scaleMul = Math.max(0.15, 1 - (t - 0.12) * 0.6);
      if (Math.random() < 0.5) particles.push({ kind: 'star', x: f.x, y: f.y - 30, vx: rnd(-60, 60), vy: rnd(-60, 60), life: 0.5, max: 0.5, size: rnd(6, 12), rot: 0, vr: 6, color: '#ffe14d' });
      if (t > 0.5 && !f.twinkled && (f.y > H + 200 || f.x < -200 || f.x > W + 200 || t > 1.4)) {
        f.dead = true;
      }
      if (t > 1.6) f.dead = true;
    } else { // pop: the fruit bursts and its underpants fly up
      if (!f.popped) {
        f.popped = true;
        const c = bodyCenter(f);
        juice(c.x, c.y, f.type.juice, 30, 1.5);
        Sfx.pop();
        particles.push({ kind: 'pants', x: c.x, y: c.y + c.r * 0.4, vx: rnd(-120, 120), vy: -rnd(500, 700), life: 2.6, max: 2.6, size: f.fixedSize * 0.9, rot: 0, vr: rnd(-6, 6), pants: f.pants });
        ghost(c.x, c.y, f.fixedSize, f.type.dark);
        f.dead = true;
      }
    }
  }

  // ------------------------------------------------------------- particles
  function juice(x, y, color, n, power) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(150, 550) * (power || 1);
      particles.push({ kind: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, life: rnd(0.5, 1), max: 1, size: rnd(4, 10), color });
    }
    particles.push({ kind: 'splat', x, y: y + 20, life: 1.5, max: 1.5, size: 40 * (power || 1), color, seed: Math.random() * 100 });
  }
  function ghost(x, y, size, color) {
    particles.push({ kind: 'ghost', x, y, vx: 0, vy: -70, life: 1.6, max: 1.6, size: size * 0.8, color });
  }
  function textPop(x, y, text, color, size) {
    particles.push({ kind: 'text', x, y, vx: 0, vy: -60, life: 1.0, max: 1.0, text, color, size: size || 30 });
  }
  function burst(x, y, word, big) {
    particles.push({ kind: 'burst', x, y, life: 0.45, max: 0.45, size: big ? 110 : 70, text: word, rot: rnd(-0.3, 0.3) });
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      if (p.kind === 'drop') {
        p.vy += 1400 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.kind === 'pants') {
        p.vy += (p.vy < 0 ? 900 : 120) * dt;
        p.vy = Math.min(p.vy, 90);
        p.vx *= Math.pow(0.4, dt);
        p.x += (p.vx + Math.sin(p.life * 6) * 60) * dt;
        p.y += p.vy * dt;
        p.rot = Math.sin(p.life * 5) * 0.6;
      } else if (p.kind === 'star' || p.kind === 'text' || p.kind === 'ghost') {
        p.x += (p.vx || 0) * dt + (p.kind === 'ghost' ? Math.sin(p.life * 6) * 30 * dt : 0);
        p.y += (p.vy || 0) * dt;
        if (p.vr) p.rot = (p.rot || 0) + p.vr * dt;
      } else if (p.kind === 'ring') {
        p.r += (p.maxR - p.r) * Math.min(1, dt * 12);
      }
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function drawParticles(layer) {
    for (const p of particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (layer === 'ground' && p.kind !== 'splat') continue;
      if (layer !== 'ground' && p.kind === 'splat') continue;
      ctx.save();
      switch (p.kind) {
        case 'splat': {
          ctx.globalAlpha = Math.min(1, a * 1.5) * 0.7;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2;
            const rr = p.size * (0.6 + 0.4 * Math.abs(Math.sin(p.seed + i * 1.7)));
            ctx.lineTo(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr * 0.35);
          }
          ctx.fill();
          break;
        }
        case 'drop':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, 7);
          ctx.fill();
          break;
        case 'star':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          star(ctx, 0, 0, p.size);
          ctx.fill();
          break;
        case 'text':
          ctx.globalAlpha = Math.min(1, a * 2);
          comicText(p.text, p.x, p.y, p.size * (1 + (1 - a) * 0.2), p.color);
          break;
        case 'burst': {
          const k = 1 - a;
          const s = p.size * (0.6 + Math.min(1, k * 4) * 0.5);
          ctx.globalAlpha = Math.min(1, a * 3);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = '#ffe14d';
          ctx.strokeStyle = '#2b1a10';
          ctx.lineWidth = 4;
          star(ctx, 0, 0, s, 12, 0.62);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ff3d3d';
          star(ctx, 0, 0, s * 0.7, 12, 0.65);
          ctx.fill();
          comicText(p.text, 0, 10, s * 0.38, '#fff');
          break;
        }
        case 'ring':
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color || '#fff';
          ctx.lineWidth = 10 * a + 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, 7);
          ctx.stroke();
          break;
        case 'pants':
          ctx.globalAlpha = Math.min(1, a * 3);
          drawLonePants(ctx, p.x, p.y, p.size, p.pants, p.rot);
          break;
        case 'ghost':
          drawGhost(ctx, p.x, p.y, p.size, time, Math.min(1, a * 1.5) * 0.85, p.color);
          break;
        case 'glove': {
          // the player's fist zooming into the screen
          const k = 1 - a;
          const s = p.size * (1.6 - k * 0.9);
          ctx.globalAlpha = Math.min(1, a * 2.5);
          ctx.translate(p.x, p.y + 30 * (1 - k));
          ctx.scale(s, s);
          glove(ctx, 0, 0, -Math.PI / 2, p.color || '#e8202a');
          break;
        }
      }
      ctx.restore();
    }
  }

  function comicText(text, x, y, size, color) {
    ctx.font = Math.round(size) + 'px "Luckiest Guy", "Comic Sans MS", "Chalkboard SE", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size * 0.18);
    ctx.strokeStyle = '#2b1a10';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, x, y);
  }

  // ------------------------------------------------------------- punching
  function renderList() {
    const items = [];
    for (const o of L.obstacles) items.push({ y: o.baseY, o });
    for (const f of L.fruits) {
      if (f.dead) continue;
      if (f.state === 'dying') items.push({ y: f.death === 'launch' ? 9999 : f.sortY, f });
      else if (f.layer === 'behind' && f.spot) items.push({ y: f.spot.baseY - 0.5, f, behind: true });
      else items.push({ y: f.y, f });
    }
    items.sort((a, b) => a.y - b.y);
    return items;
  }

  function fruitHittable(f) {
    if (f.state === 'dying' || f.state === 'hidden') return false;
    if (f.layer === 'behind' && f.rise < 0.35) return false;
    return true;
  }

  function hitTestFruit(f, x, y, pad) {
    const c = bodyCenter(f);
    return Math.hypot(x - c.x, y - c.y) < c.r + pad;
  }

  function hitTestObstacle(o, x, y) {
    return x > o.x - o.w * 0.44 && x < o.x + o.w * 0.44 && y > o.top + 6 && y < o.baseY;
  }

  function punch(x, y, charge) {
    if (mode !== 'play' || !L.started) return;
    particles.push({ kind: 'glove', x, y, life: 0.22, max: 0.22, size: 70 + charge * 40 });
    if (charge <= 0) {
      const items = renderList();
      let target = null;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.f) {
          if (fruitHittable(it.f) && hitTestFruit(it.f, x, y, 18)) { target = it; break; }
        } else if (hitTestObstacle(it.o, x, y)) { target = it; break; }
      }
      if (target && target.f) {
        Sfx.punch();
        burst(x, y, pick(POW_WORDS), false);
        damage(target.f, 1, false, x);
        shake = Math.max(shake, 6);
      } else if (target && target.o) {
        Sfx.bonk();
        target.o.wobble = 1;
        textPop(x, y, 'BONK!', '#fff', 28);
        missTaunt(x, y);
      } else {
        Sfx.whoosh();
        missTaunt(x, y);
      }
    } else {
      const radius = 80 + charge * 110;
      const dmg = 2 + Math.round(charge * 2);
      Sfx.power();
      shake = 14 + charge * 12;
      burst(x, y, pick(POWER_WORDS), true);
      particles.push({ kind: 'ring', x, y, r: 10, maxR: radius * 1.1, life: 0.45, max: 0.45, color: '#fff' });
      particles.push({ kind: 'ring', x, y, r: 10, maxR: radius * 0.7, life: 0.35, max: 0.35, color: '#ffe14d' });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        particles.push({ kind: 'star', x, y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 300, life: 0.5, max: 0.5, size: 12, rot: 0, vr: 8, color: '#ffe14d' });
      }
      let hits = 0;
      for (const f of L.fruits.slice()) {
        if (!fruitHittable(f)) continue;
        const c = bodyCenter(f);
        if (Math.hypot(c.x - x, (c.y - y) * 1.2) < radius + c.r) {
          damage(f, dmg, true, x);
          hits++;
        }
      }
      for (const o of L.obstacles) {
        if (Math.hypot(o.x - x, (o.baseY - o.h / 2) - y) < radius + o.w / 2) o.wobble = 1;
      }
      if (hits >= 2) textPop(x, y - 90, hits + ' FRUIT SMASH!', '#7fffd4', 34);
      if (!hits) missTaunt(x, y);
    }
  }

  function damage(f, dmg, power, fromX) {
    f.hp -= dmg;
    const dir = f.x >= fromX ? 1 : -1;
    if (f.hp <= 0) {
      kill(f, power, dir);
    } else {
      f.flash = 1;
      Sfx.oof(f.type.pitch);
      endTaunt(f);
      f.state = 'stunned';
      f.timer = 0.45;
      f.vx = dir * 260;
      f.jump = null;
      if (f.layer === 'front' && f.spot && f.spot.occupant === f) { f.spot.occupant = null; f.spot = null; }
      say(f, pick(HIT_LINES), 0.9);
      const c = bodyCenter(f);
      juice(c.x, c.y, f.type.juice, 8, 0.6);
    }
  }

  function missTaunt(x, y) {
    let best = null, bd = 380;
    for (const f of L.fruits) {
      if (f.state === 'dying' || f.state === 'hidden' || f.state === 'stunned' || f.state === 'jump') continue;
      const c = bodyCenter(f);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = f; }
    }
    L.combo = 0;
    if (best && Math.random() < 0.8) {
      say(best, pick(MISS_LINES), 1.1);
      if (!best.taunt && (best.state === 'roam' || best.state === 'peek')) {
        best.taunt = { key: 'laugh', t: 0, max: 0.9 };
        best.pose.arms = 'belly';
        best.pose.mouth = 'open';
        best.pose.eyes = 'happy';
      }
      Sfx.laugh(best.type.pitch);
    }
  }

  // ------------------------------------------------------------- input
  function onDown(e) {
    Sfx.init();
    const p = toWorld(e.clientX, e.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;
    pointer.mouse = e.pointerType === 'mouse';
    if (mode !== 'play') return;
    e.preventDefault();
    pointer.down = true;
    pointer.downT = 0;
    pointer.charging = false;
    pointer.id = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  function onMove(e) {
    pointer.mouse = e.pointerType === 'mouse';
    const p = toWorld(e.clientX, e.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;
  }
  function onUp(e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const p = toWorld(e.clientX, e.clientY);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = false;
    Sfx.chargeStop();
    if (mode !== 'play') return;
    const held = pointer.downT;
    const charge = held < TAP_TIME ? 0 : clamp((held - TAP_TIME) / FULL_CHARGE, 0.05, 1);
    punch(p.x, p.y, charge);
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { pointer.down = false; Sfx.chargeStop(); });
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') pointer.inside = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p') {
      if (mode === 'play') pauseGame();
      else if (mode === 'paused') resumeGame();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'play') pauseGame();
  });

  // ------------------------------------------------------------- flow / UI
  const screens = ['titleScreen', 'levelSelect', 'introScreen', 'pauseScreen', 'completeScreen', 'timeupScreen', 'helpScreen'];
  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    $('btnPause').classList.toggle('hidden', !(id === null && mode === 'play'));
    document.body.classList.toggle('playing', id === null && mode === 'play');
  }

  function updateSoundButtons() {
    $('btnMute').textContent = Store.data.muted ? '🔇' : '🔊';
    $('btnMusic').textContent = Store.data.music ? '🎵 Music: ON' : '🎵 Music: OFF';
    $('btnMusic').classList.toggle('off', !Store.data.music);
  }

  function goTitle() {
    mode = 'title';
    L = null;
    particles = [];
    setupTitleScene();
    $('titleHigh').textContent = Store.data.highScore.toLocaleString();
    $('btnContinue').classList.toggle('hidden', Store.data.unlocked <= 1);
    $('btnContinue').textContent = '▶ Continue (Level ' + Store.data.unlocked + ')';
    show('titleScreen');
    Sfx.startMusic({ root: 60, tempo: 120 });
  }

  function startLevel(n, keepScore) {
    if (!keepScore) score = 0;
    levelStartScore = score;
    L = buildLevel(n);
    particles = [];
    mode = 'intro';
    const p = L.p;
    $('introLevel').textContent = 'LEVEL ' + n;
    $('introName').textContent = p.env.name + (p.loop ? ' ' + 'I'.repeat(Math.min(p.loop + 1, 5)) : '');
    $('introGoal').textContent = 'Punch ' + p.target + ' fruit in ' + p.time + ' seconds!';
    const newbies = TYPE_UNLOCK[n - 1];
    $('introNew').textContent = newbies && n > 1 ? 'NEW: ' + newbies.map((k) => TYPES[k].name).join(', ') + ' (' + (TYPES[newbies[0]].hp > 1 ? 'tough! ' + TYPES[newbies[0]].hp + ' hits' : '+' + TYPES[newbies[0]].pts + ' pts') + ')' : '';
    if (p.hpBonus > 0) $('introNew').textContent += (newbies && n > 1 ? ' · ' : '') + 'Fruits are tougher now!';
    show('introScreen');
    Sfx.startMusic(p.env.music);
  }

  function beginPlay() {
    mode = 'play';
    show(null);
    L.started = false;
    L.startDelay = 1.3;
    banner = { text: 'READY?', t: 0, max: 1.0, color: '#ffe14d' };
    for (let i = 0; i < Math.min(L.p.maxActive, L.obstacles.length); i++) trySpawn();
  }

  function pauseGame() {
    if (mode !== 'play') return;
    mode = 'paused';
    pointer.down = false;
    Sfx.chargeStop();
    Sfx.stopMusic();
    show('pauseScreen');
  }
  function resumeGame() {
    mode = 'play';
    show(null);
    Sfx.startMusic(L.env.music);
  }

  function levelComplete() {
    mode = 'complete';
    pointer.down = false;
    Sfx.chargeStop();
    Sfx.stopMusic();
    const timeBonus = Math.ceil(L.timeLeft) * 10;
    const powerBonus = L.powerKOs * 25;
    score += timeBonus + powerBonus;
    const frac = L.timeLeft / L.p.time;
    const stars = frac > 0.45 ? 3 : frac > 0.2 ? 2 : 1;
    const n = L.n;
    const prev = Store.data.stars[n] || 0;
    Store.data.stars[n] = Math.max(prev, stars);
    Store.data.unlocked = Math.max(Store.data.unlocked, n + 1);
    const isHigh = score > Store.data.highScore;
    Store.data.highScore = Math.max(Store.data.highScore, score);
    Store.save();

    $('completeTitle').textContent = pick(['FRUIT-TASTIC!', 'JUICY WIN!', 'SMASHING!', 'KNOCKOUT!', 'PUNCH-TACULAR!']);
    $('completeStats').innerHTML =
      '<div><span>Fruit punched</span><b>' + L.kos + '</b></div>' +
      '<div><span>Best combo</span><b>x' + L.bestCombo + '</b></div>' +
      '<div><span>Time bonus</span><b>+' + timeBonus + '</b></div>' +
      (powerBonus ? '<div><span>Power punch bonus</span><b>+' + powerBonus + '</b></div>' : '') +
      '<div class="total"><span>Score</span><b>' + score.toLocaleString() + '</b></div>' +
      (isHigh ? '<div class="newhigh">★ NEW HIGH SCORE! ★</div>' : '');
    const starEls = $('completeStars').children;
    for (let i = 0; i < 3; i++) {
      starEls[i].classList.remove('on', 'pop');
      if (i < stars) {
        setTimeout(() => {
          starEls[i].classList.add('on', 'pop');
          Sfx.star(i);
        }, 500 + i * 350);
      }
    }
    $('btnNext').textContent = 'Level ' + (n + 1) + ' ▶';
    Sfx.win();
    setTimeout(() => { if (mode === 'complete') show('completeScreen'); }, 900);
    banner = { text: 'K.O.!', t: 0, max: 1.2, color: '#ffe14d' };
  }

  function timeUp() {
    mode = 'timeup';
    pointer.down = false;
    Sfx.chargeStop();
    Sfx.stopMusic();
    Sfx.fail();
    Store.data.highScore = Math.max(Store.data.highScore, score);
    Store.save();
    $('timeupMsg').textContent = pick([
      'The fruit are laughing at you!',
      'Those cheeky fruit got away!',
      'So close! The fruit are doing a victory dance.',
      'The fruit say: "Nyah nyah!"',
    ]);
    $('timeupStats').textContent = L.kos + ' / ' + L.p.target + ' fruit punched';
    // every fruit comes out to gloat
    for (const f of L.fruits) {
      if (f.state === 'dying') continue;
      f.state = 'gloat';
      if (f.layer === 'behind' && f.spot) { f.rise = 1; f.y = behindY(f, f.spot, 1); }
      f.taunt = { key: 'dance', t: 0, max: 999 };
      f.pose.arms = 'up';
      f.pose.mouth = 'open';
      f.pose.eyes = 'happy';
      f.pose.back = Math.random() < 0.4;
      if (f.pose.back) f.taunt.key = 'butt';
      say(f, pick(['We win!', 'Ha ha ha!', 'Nyah nyah!', 'Loser!', 'Fruit rule!']), 3);
    }
    banner = { text: 'TIME\'S UP!', t: 0, max: 1.5, color: '#ff5c5c' };
    setTimeout(() => { if (mode === 'timeup') show('timeupScreen'); }, 1300);
  }

  function buildLevelSelect() {
    const grid = $('levelGrid');
    grid.innerHTML = '';
    const maxShown = Math.max(10, Store.data.unlocked);
    for (let n = 1; n <= maxShown; n++) {
      const env = ENVS[(n - 1) % ENVS.length];
      const b = document.createElement('button');
      b.className = 'lvl env-' + env.key;
      const locked = n > Store.data.unlocked;
      if (locked) b.classList.add('locked');
      const st = Store.data.stars[n] || 0;
      b.innerHTML = '<b>' + n + '</b><small>' + env.name + '</small><i>' + (locked ? '🔒' : '★'.repeat(st) + '☆'.repeat(3 - st)) + '</i>';
      b.disabled = locked;
      b.addEventListener('click', () => { Sfx.click(); startLevel(n, false); });
      grid.appendChild(b);
    }
  }

  // buttons
  function on(id, fn) {
    $(id).addEventListener('click', (e) => {
      Sfx.init();
      Sfx.click();
      fn(e);
    });
  }
  on('btnPlay', () => startLevel(1, false));
  on('btnContinue', () => startLevel(Store.data.unlocked, false));
  on('btnLevels', () => { buildLevelSelect(); show('levelSelect'); });
  on('btnHelp', () => show('helpScreen'));
  on('btnHelpBack', () => show('titleScreen'));
  on('btnLevelsBack', () => show('titleScreen'));
  on('btnGo', () => { Sfx.init(); beginPlay(); });
  on('btnPause', pauseGame);
  on('btnResume', resumeGame);
  on('btnQuit', goTitle);
  on('btnNext', () => startLevel(L.n + 1, true));
  on('btnCompleteMenu', goTitle);
  on('btnRetry', () => { score = levelStartScore; startLevel(L.n, true); });
  on('btnTimeupMenu', goTitle);
  on('btnMute', () => {
    Store.data.muted = !Store.data.muted;
    Sfx.setMuted(Store.data.muted);
    Store.save();
    updateSoundButtons();
  });
  on('btnMusic', () => {
    Store.data.music = !Store.data.music;
    Sfx.setMusic(Store.data.music);
    Store.save();
    updateSoundButtons();
  });
  on('btnReset', () => {
    if (confirm('Erase your high score and unlocked levels?')) {
      Store.reset();
      Sfx.setMuted(false);
      Sfx.setMusic(true);
      updateSoundButtons();
      goTitle();
    }
  });
  // unlock audio on first interaction anywhere
  window.addEventListener('pointerdown', () => {
    const fresh = !Sfx._started;
    Sfx.init();
    if (fresh) {
      Sfx._started = true;
      if (mode === 'title') Sfx.startMusic({ root: 60, tempo: 120 });
    }
  }, { capture: true });
  window.addEventListener('pointerup', () => Sfx.init(), { capture: true });
  window.addEventListener('touchend', () => Sfx.init(), { capture: true });

  // ------------------------------------------------------------- title scene
  function setupTitleScene() {
    titleFruits = [];
    const keys = ['banana', 'apple', 'watermelon', 'strawberry', 'orange', 'pineapple', 'grape', 'lemon'];
    const n = keys.length;
    keys.forEach((k, i) => {
      const f = newFruit(k, null);
      f.x = W * (0.08 + (0.84 * i) / (n - 1));
      f.y = H - 40 - (i % 2) * 30;
      f.layer = 'front';
      f.state = 'title';
      f.scaleMul = 0.85;
      f.tauntT = rnd(0.5, 3);
      titleFruits.push(f);
    });
  }

  function updateTitle(dt) {
    for (const f of titleFruits) {
      f.t += dt;
      const c = { x: f.x, y: f.y - 60 };
      const dx = (pointer.x - c.x) * f.facing, dy = pointer.y - c.y;
      const dl = Math.hypot(dx, dy) || 1;
      f.pose.lookX = dx / dl;
      f.pose.lookY = dy / dl;
      f.pose.gloveColor = f.gloveColor;
      if (f.taunt) {
        f.taunt.t += dt;
        const k = f.taunt.key;
        if (k === 'butt') f.tilt = Math.sin(f.t * 16) * 0.18;
        else if (k === 'dance') { f.tilt = Math.sin(f.t * 8) * 0.25; }
        else f.tilt = Math.sin(f.t * 10) * 0.08;
        if (f.taunt.t > f.taunt.max) { endTaunt(f); f.tauntT = rnd(1.5, 4); }
      } else {
        f.tauntT -= dt;
        f.sy = 1 + Math.sin(f.t * 6) * 0.03;
        if (f.tauntT <= 0) {
          const key = pick(ROAM_TAUNTS);
          const T = TAUNTS[key];
          f.taunt = { key, t: 0, max: rnd(1.2, 2) };
          f.pose.arms = T.arms;
          f.pose.mouth = T.mouth;
          f.pose.eyes = T.eyes || 'normal';
          f.pose.back = !!T.back;
          if (Math.random() < 0.5) say(f, pick(T.lines), 1.4);
        }
      }
      if (f.bubble) { f.bubble.t += dt; if (f.bubble.t > f.bubble.max) f.bubble = null; }
    }
  }

  function drawTitle() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ff7ab8');
    g.addColorStop(0.55, '#ffb35c');
    g.addColorStop(1, '#ffe14d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // sunburst
    ctx.save();
    ctx.translate(W / 2, H * 0.4);
    ctx.rotate(time * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1400, -120);
      ctx.lineTo(1400, 120);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#5fd35a';
    ctx.fillRect(0, H - 70, W, 70);
    for (const f of titleFruits) drawOneFruit(f, f.x, f.y);
    for (const f of titleFruits) drawBubble(f);
  }

  // ------------------------------------------------------------- render helpers
  function drawOneFruit(f, x, y) {
    const size = f.state === 'dying' ? f.fixedSize * (f.scaleMul || 1) : sizeOf(f);
    const hop = (f.hop || 0) * size;
    // shadow
    if (f.layer === 'front' && f.state !== 'jump' && !(f.state === 'dying' && f.death === 'launch')) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.8 * (f.sx || 1), size * 0.18, 0, 0, 7);
      ctx.fill();
    }
    drawFruit(ctx, x, y - hop, {
      type: f.type, size, facing: f.facing, pants: f.pants, band: f.band, t: f.t, pose: f.pose,
      sx: f.sx, sy: f.sy, tilt: f.tilt, flash: f.flash, alpha: f.alpha,
    });
  }

  function drawBehindFruit(f) {
    const o = f.spot;
    ctx.save();
    // clip: everything above the obstacle top, plus the obstacle's own width below it
    ctx.beginPath();
    ctx.rect(-50, -200, W + 100, o.top + 200 + 4);
    ctx.rect(o.x - o.w * 0.47, o.top, o.w * 0.94, o.baseY - o.top);
    ctx.clip();
    drawOneFruit(f, f.x, f.y);
    ctx.restore();
  }

  function drawBubble(f) {
    if (!f.bubble || f.state === 'dying' || f.state === 'hidden') return;
    if (f.layer === 'behind' && f.rise < 0.6) return;
    const size = sizeOf(f);
    const k = f.bubble.t / f.bubble.max;
    const pop = Math.min(1, f.bubble.t * 8);
    const x = f.x, y = f.y - size * 2.9 - (f.hop || 0) * size;
    ctx.save();
    ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
    ctx.font = '22px "Luckiest Guy", "Comic Sans MS", "Chalkboard SE", sans-serif';
    const tw = ctx.measureText(f.bubble.text).width;
    const bw = tw + 26, bh = 40;
    let bx = clamp(x - bw / 2, 8, W - bw - 8);
    const by = Math.max(8, y - bh);
    ctx.translate(bx + bw / 2, by + bh);
    ctx.scale(pop, pop);
    ctx.translate(-(bx + bw / 2), -(by + bh));
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2b1a10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 14);
    ctx.fill();
    ctx.stroke();
    const tx = clamp(x, bx + 14, bx + bw - 14);
    ctx.beginPath();
    ctx.moveTo(tx - 8, by + bh - 1.5);
    ctx.lineTo(tx + 2, by + bh + 14);
    ctx.lineTo(tx + 10, by + bh - 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(tx - 7, by + bh - 4, 16, 4);
    ctx.fillStyle = '#2b1a10';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.bubble.text, bx + bw / 2, by + bh / 2 + 2);
    ctx.restore();
  }

  function drawHP(f) {
    if (f.maxHp <= 1 || f.state === 'dying' || f.state === 'hidden') return;
    if (f.layer === 'behind' && f.rise < 0.6) return;
    const size = sizeOf(f);
    const y = f.y - size * 2.75 - (f.hop || 0) * size;
    const w = 12 * f.maxHp;
    for (let i = 0; i < f.maxHp; i++) {
      ctx.fillStyle = i < f.hp ? '#ff3d6b' : 'rgba(0,0,0,0.3)';
      FruitArt.heart(ctx, f.x - w / 2 + i * 12 + 6, y, 7);
    }
  }

  function drawHUD() {
    const p = L.p;
    // score
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = '22px "Luckiest Guy", "Comic Sans MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 230, 60, 16);
    ctx.fill();
    ctx.fillStyle = '#ffe14d';
    ctx.fillText('SCORE', 28, 30);
    ctx.font = '32px "Luckiest Guy", "Comic Sans MS", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(score.toLocaleString(), 28, 56);
    ctx.restore();

    // level + timer
    const cx = W / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(cx - 220, 12, 440, 60, 16);
    ctx.fill();
    ctx.font = '22px "Luckiest Guy", "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('LEVEL ' + L.n + ' · ' + p.env.name.toUpperCase(), cx, 31);
    const frac = clamp(L.timeLeft / p.time, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(cx - 200, 48, 400, 14, 7);
    ctx.fill();
    const low = L.timeLeft < 10;
    ctx.fillStyle = low ? (Math.floor(time * 4) % 2 ? '#ff3d3d' : '#ffb000') : '#5fe05a';
    ctx.beginPath();
    ctx.roundRect(cx - 200, 48, Math.max(14, 400 * frac), 14, 7);
    ctx.fill();
    ctx.font = '16px "Luckiest Guy", "Comic Sans MS", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('⏱ ' + Math.ceil(L.timeLeft), cx, 56);
    ctx.restore();

    // fruit remaining (leave room for the corner buttons, which are in screen pixels)
    const left = Math.max(0, p.target - L.kos);
    const rx = W - 200 - 132 / view.scale;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(rx, 12, 186, 60, 16);
    ctx.fill();
    drawFruit(ctx, rx + 31, 64, { type: TYPES.apple, size: 17, facing: 1, pants: PANTS[0], t: time, pose: { arms: 'guard', mouth: 'grin' }, noLegs: false });
    ctx.font = '30px "Luckiest Guy", "Comic Sans MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(left + ' left', rx + 61, 44);
    ctx.restore();

    // combo meter
    if (mode === 'play' && L.combo > 1 && L.comboT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, L.comboT * 2);
      const s = 1 + Math.sin(time * 12) * 0.05;
      ctx.translate(W / 2, 100);
      ctx.scale(s, s);
      comicText('COMBO x' + Math.min(L.combo, 5), 0, 0, 30, '#ffe14d');
      ctx.restore();
    }
  }

  function drawCharge() {
    if (mode !== 'play' || !pointer.inside) return;
    const x = pointer.x, y = pointer.y;
    if (pointer.down && pointer.downT > TAP_TIME * 0.6) {
      const c = clamp((pointer.downT - TAP_TIME) / FULL_CHARGE, 0, 1);
      const r = 80 + c * 110;
      ctx.save();
      ctx.strokeStyle = c >= 1 ? (Math.floor(time * 12) % 2 ? '#ffe14d' : '#ff3d3d') : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -time * 60;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.83, 0, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
      // charge arc
      ctx.strokeStyle = '#ffe14d';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c);
      ctx.stroke();
      const jitter = c * 3;
      ctx.translate(x + rnd(-jitter, jitter), y + rnd(-jitter, jitter));
      ctx.scale(70 + c * 30, 70 + c * 30);
      glove(ctx, 0, 0, -Math.PI / 2, c >= 1 ? '#ff7a00' : '#e8202a');
      ctx.restore();
      if (c >= 1) comicText('POWER!', x, y - 90, 26, '#ffe14d');
    } else if (!pointer.down && pointer.mouse) {
      // crosshair fist cursor for mouse users
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.translate(x, y);
      ctx.scale(42, 42);
      glove(ctx, 0, 0, -Math.PI / 2, '#e8202a');
      ctx.restore();
    }
  }

  // ------------------------------------------------------------- main loop
  function update(dt) {
    time += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 60);
    if (banner) {
      banner.t += dt;
      if (banner.t > banner.max) banner = null;
    }
    if (mode === 'title') {
      updateTitle(dt);
      return;
    }
    if (!L) return;
    if (mode === 'paused' || mode === 'intro') return;

    for (const o of L.obstacles) if (o.wobble > 0) o.wobble = Math.max(0, o.wobble - dt * 2.5);

    if (mode === 'play') {
      if (!L.started) {
        L.startDelay -= dt;
        if (L.startDelay <= 0) {
          L.started = true;
          banner = { text: 'FIGHT!', t: 0, max: 0.8, color: '#ff3d3d' };
          Sfx.fight();
        }
      } else {
        L.timeLeft -= dt;
        if (L.comboT > 0) L.comboT -= dt;
        const sec = Math.ceil(L.timeLeft);
        if (L.timeLeft < 5.5 && sec !== lastTick) {
          lastTick = sec;
          Sfx.tick();
        }
        if (pointer.down) {
          const before = pointer.downT;
          pointer.downT += dt;
          if (before < TAP_TIME && pointer.downT >= TAP_TIME) Sfx.chargeStart();
        }
      }
      // spawning
      const active = L.fruits.filter((f) => f.state !== 'dying').length;
      if (L.started && L.spawned < L.p.target && active < L.p.maxActive) {
        L.spawnT -= dt;
        if (L.spawnT <= 0) {
          if (!trySpawn()) L.spawnT = 0.3;
          else L.spawnT = rnd(0.3, 0.9);
        }
      }
    }

    if (mode === 'play' && L.started) {
      for (const f of L.fruits) updateFruit(f, dt);
    } else if (mode === 'timeup' || mode === 'complete') {
      for (const f of L.fruits) {
        f.t += dt;
        if (f.state === 'dying') updateDying(f, dt);
        else if (f.taunt) {
          f.taunt.t += dt;
          if (f.taunt.key === 'butt') f.tilt = Math.sin(f.t * 16) * 0.18;
          else { f.tilt = Math.sin(f.t * 8) * 0.25; f.hop = Math.abs(Math.sin(f.t * 8)) * 0.3; }
        }
        if (f.bubble) { f.bubble.t += dt; if (f.bubble.t > f.bubble.max) f.bubble = null; }
      }
    }
    L.fruits = L.fruits.filter((f) => !f.dead);
    updateParticles(dt);

    if (mode === 'play' && L.started) {
      if (L.kos >= L.p.target) levelComplete();
      else if (L.timeLeft <= 0) {
        L.timeLeft = 0;
        timeUp();
      }
    }
  }

  function render(dt) {
    const { scale, ox, oy, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = L ? L.env.bar : '#ff9a5c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let sx = 0, sy = 0;
    if (shake > 0) { sx = rnd(-shake, shake); sy = rnd(-shake, shake); }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx * scale), dpr * (oy + sy * scale));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    if (mode === 'title' || !L) {
      drawTitle();
    } else {
      ctx.drawImage(L.bg, 0, 0, W, H);
      World.updateDrawAmbient(ctx, L.ambient, mode === 'paused' ? 0 : dt, W, H, HZ, time);
      drawParticles('ground');
      const items = renderList();
      for (const it of items) {
        if (it.o) World.drawObstacle(ctx, it.o);
        else if (it.behind) drawBehindFruit(it.f);
        else drawOneFruit(it.f, it.f.x, it.f.y);
      }
      for (const f of L.fruits) { drawHP(f); drawBubble(f); }
      drawParticles('top');
      if (mode !== 'intro') drawHUD();
      drawCharge();
    }

    if (banner) {
      const k = banner.t / banner.max;
      const s = k < 0.2 ? easeOutBack(k / 0.2) : 1;
      ctx.save();
      ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
      ctx.translate(W / 2, H / 2 - 20);
      ctx.scale(s, s);
      ctx.rotate(-0.06);
      comicText(banner.text, 0, 0, 120, banner.color);
      ctx.restore();
    }
    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render(dt);
    requestAnimationFrame(frame);
  }

  // polyfill for older browsers
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };
  }

  resize();
  updateSoundButtons();
  goTitle();
  requestAnimationFrame(frame);

  // expose a little for debugging / testing
  window.FruitPunch = { get mode() { return mode; }, get level() { return L; }, get score() { return score; }, startLevel, beginPlay, punch, toWorld };
})();
