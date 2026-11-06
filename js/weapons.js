// Fruit Punch - weapons. A new weapon unlocks every 3 levels.
// Each weapon has its own tap punch, power punch, sound and look.
(function () {
  const INK = '#2b1a10';

  /*
   * tap:   dmg      damage per tap
   *        pad      extra hit radius around a fruit (bigger = easier to hit)
   *        area     >0: splash radius that hits every fruit nearby, ignoring cover
   *        chain    after a hit, the zap jumps to this many more nearby fruit
   *        cooldown seconds before you can swing again
   * power: minR/maxR blast radius at the lowest/full charge
   *        dmgMin/dmgMax damage at the lowest/full charge
   *        charge   seconds of holding to reach full charge
   *        all      true: hits every fruit on screen
   * stun:  multiplier for how long hit fruit stay dizzy
   * death: preferred K.O. animation for fruit out in the open
   * stats: 1-5 bars shown in the weapon picker
   */
  const WEAPONS = [
    {
      key: 'gloves', name: 'Boxing Gloves', unlockLevel: 1,
      desc: 'Trusty all-rounder. Good reach, good power.',
      tap: { dmg: 1, pad: 18, cooldown: 0.08 },
      power: { minR: 80, maxR: 190, dmgMin: 2, dmgMax: 4, charge: 0.9 },
      stun: 1, sound: 'punch',
      words: ['POW!', 'BAM!', 'WHAM!', 'SMACK!', 'KAPOW!', 'THWACK!'],
      powerWords: ['KA-BOOM!', 'SUPER POW!', 'MEGA PUNCH!'],
      stats: { power: 2, reach: 3, speed: 4 },
    },
    {
      key: 'chicken', name: 'Rubber Chicken', unlockLevel: 4,
      desc: 'Huge floppy reach, and it leaves fruit extra dizzy.',
      tap: { dmg: 1, pad: 50, cooldown: 0.12 },
      power: { minR: 110, maxR: 240, dmgMin: 1, dmgMax: 3, charge: 0.9 },
      stun: 2.4, sound: 'squawk',
      words: ['BAWK!', 'SQUAWK!', 'BOK BOK!', 'CLUCK!'],
      powerWords: ['MEGA BAWK!', 'CHICKEN STORM!', 'SQUAAAWK!'],
      stats: { power: 1, reach: 5, speed: 4 },
    },
    {
      key: 'hammer', name: 'Squeaky Hammer', unlockLevel: 7,
      desc: 'Hits twice as hard and squashes fruit flat. Slow to swing.',
      tap: { dmg: 2, pad: 12, cooldown: 0.4 },
      power: { minR: 100, maxR: 220, dmgMin: 3, dmgMax: 5, charge: 1.1 },
      stun: 1, sound: 'squeak', death: 'squash',
      words: ['SQUEAK!', 'BONK!', 'SPLAT!', 'THUD!'],
      powerWords: ['GROUND POUND!', 'MEGA BONK!', 'SQUASH!'],
      stats: { power: 4, reach: 2, speed: 2 },
    },
    {
      key: 'balloon', name: 'Water Balloons', unlockLevel: 10,
      desc: 'Every throw splashes ALL fruit nearby, even behind cover.',
      tap: { dmg: 1, area: 75, cooldown: 0.18 },
      power: { minR: 120, maxR: 260, dmgMin: 1, dmgMax: 3, charge: 0.7 },
      stun: 1.2, sound: 'splash',
      words: ['SPLOOSH!', 'SPLASH!', 'SPLISH!', 'DRENCHED!'],
      powerWords: ['TIDAL WAVE!', 'MEGA SPLASH!', 'SOAKED!'],
      stats: { power: 2, reach: 5, speed: 3 },
    },
    {
      key: 'pan', name: 'Frying Pan', unlockLevel: 13,
      desc: 'CLANG! Massive damage, but you have to aim well.',
      tap: { dmg: 3, pad: 8, cooldown: 0.3 },
      power: { minR: 70, maxR: 140, dmgMin: 4, dmgMax: 7, charge: 0.6 },
      stun: 1.5, sound: 'clang',
      words: ['CLANG!', 'BONG!', 'DONG!', 'KLONK!'],
      powerWords: ['MEGA CLANG!', 'PAN-DEMONIUM!', 'BONNNG!'],
      stats: { power: 5, reach: 1, speed: 3 },
    },
    {
      key: 'thunder', name: 'Thunder Glove', unlockLevel: 16,
      desc: 'Zaps jump to 2 more fruit. Power punch zaps EVERY fruit!',
      tap: { dmg: 1, pad: 22, chain: 2, cooldown: 0.15 },
      power: { minR: 0, maxR: 0, dmgMin: 1, dmgMax: 3, charge: 1.4, all: true },
      stun: 1.3, sound: 'zap',
      words: ['ZAP!', 'BZZT!', 'ZZZAP!', 'KRAKOOM!'],
      powerWords: ['THUNDERSTRIKE!', 'MEGA ZAP!', 'KA-ZZZAP!'],
      stats: { power: 3, reach: 4, speed: 3 },
    },
  ];
  const BY_KEY = {};
  WEAPONS.forEach((w, i) => { w.index = i; BY_KEY[w.key] = w; });

  // ---------------- drawing (unit space, centred on the origin, about 1 unit across) ----------------
  function line(ctx, lw) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw || 0.05;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function bolt(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x + 0.05 * s, y - 0.4 * s);
    ctx.lineTo(x - 0.15 * s, y + 0.05 * s);
    ctx.lineTo(x + 0.02 * s, y + 0.03 * s);
    ctx.lineTo(x - 0.06 * s, y + 0.4 * s);
    ctx.lineTo(x + 0.17 * s, y - 0.08 * s);
    ctx.lineTo(x, y - 0.06 * s);
    ctx.closePath();
  }

  const DRAW = {
    gloves(ctx, o) {
      FruitArt.glove(ctx, 0, 0, -Math.PI / 2, o.hot ? '#ff7a00' : '#e8202a');
    },
    chicken(ctx, o) {
      // feet
      ctx.beginPath();
      ctx.moveTo(-0.06, 0.42); ctx.lineTo(-0.1, 0.55);
      ctx.moveTo(0.06, 0.42); ctx.lineTo(0.1, 0.55);
      ctx.strokeStyle = '#ff8a1a'; ctx.lineWidth = 0.05; ctx.stroke();
      // body + neck
      ctx.fillStyle = o.hot ? '#ffb000' : '#ffe14d';
      ctx.beginPath();
      ctx.ellipse(0, 0.15, 0.17, 0.3, 0, 0, 7);
      ctx.fill(); line(ctx);
      ctx.beginPath();
      ctx.ellipse(0.02, -0.22, 0.08, 0.18, 0.1, 0, 7);
      ctx.fill(); line(ctx);
      // wing
      ctx.beginPath();
      ctx.ellipse(0.09, 0.12, 0.06, 0.16, -0.3, 0, 7);
      ctx.fill(); line(ctx, 0.03);
      // head
      ctx.beginPath();
      ctx.arc(0.03, -0.42, 0.11, 0, 7);
      ctx.fill(); line(ctx);
      // comb
      ctx.fillStyle = '#e8202a';
      ctx.beginPath();
      ctx.moveTo(-0.07, -0.5);
      ctx.lineTo(-0.05, -0.62); ctx.lineTo(0.0, -0.54);
      ctx.lineTo(0.04, -0.64); ctx.lineTo(0.07, -0.54);
      ctx.lineTo(0.12, -0.6); ctx.lineTo(0.12, -0.48);
      ctx.closePath();
      ctx.fill(); line(ctx, 0.03);
      // beak (wide open, squawking)
      ctx.fillStyle = '#ff8a1a';
      ctx.beginPath();
      ctx.moveTo(0.12, -0.45); ctx.lineTo(0.3, -0.48); ctx.lineTo(0.13, -0.4);
      ctx.lineTo(0.27, -0.33); ctx.lineTo(0.11, -0.36);
      ctx.closePath();
      ctx.fill(); line(ctx, 0.03);
      // X eye
      ctx.beginPath();
      ctx.moveTo(0.0, -0.47); ctx.lineTo(0.06, -0.41);
      ctx.moveTo(0.06, -0.47); ctx.lineTo(0.0, -0.41);
      line(ctx, 0.03);
    },
    hammer(ctx, o) {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.rect(-0.05, -0.15, 0.1, 0.65);
      ctx.fill(); line(ctx);
      ctx.fillStyle = o.hot ? '#ff7a00' : '#ff3d6b';
      ctx.beginPath();
      ctx.roundRect(-0.38, -0.42, 0.76, 0.32, 0.1);
      ctx.fill(); line(ctx);
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath();
      ctx.roundRect(-0.44, -0.44, 0.12, 0.36, 0.05);
      ctx.roundRect(0.32, -0.44, 0.12, 0.36, 0.05);
      ctx.fill(); line(ctx, 0.04);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-0.28, -0.38, 0.5, 0.06);
    },
    balloon(ctx, o) {
      ctx.fillStyle = o.hot ? '#2f6bff' : '#4fb8ff';
      ctx.beginPath();
      ctx.moveTo(0, -0.42);
      ctx.bezierCurveTo(0.36, -0.42, 0.38, 0.1, 0, 0.28);
      ctx.bezierCurveTo(-0.38, 0.1, -0.36, -0.42, 0, -0.42);
      ctx.fill(); line(ctx);
      ctx.beginPath();
      ctx.moveTo(-0.05, 0.36); ctx.lineTo(0, 0.27); ctx.lineTo(0.05, 0.36);
      ctx.closePath();
      ctx.fill(); line(ctx, 0.03);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(-0.12, -0.2, 0.05, 0.1, -0.4, 0, 7);
      ctx.fill();
    },
    pan(ctx, o) {
      ctx.fillStyle = '#5c3a1e';
      ctx.beginPath();
      ctx.roundRect(-0.05, 0.12, 0.1, 0.45, 0.04);
      ctx.fill(); line(ctx);
      ctx.fillStyle = '#3a3a44';
      ctx.beginPath();
      ctx.arc(0, -0.15, 0.34, 0, 7);
      ctx.fill(); line(ctx);
      ctx.fillStyle = o.hot ? '#8a4a2a' : '#5a5a66';
      ctx.beginPath();
      ctx.arc(0, -0.15, 0.26, 0, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-0.1, -0.25, 0.07, 0.12, -0.6, 0, 7);
      ctx.fill();
    },
    thunder(ctx, o) {
      ctx.save();
      ctx.shadowColor = '#ffe14d';
      ctx.shadowBlur = o.noGlow ? 0 : 20;
      FruitArt.glove(ctx, 0, 0, -Math.PI / 2, o.hot ? '#b06bff' : '#7b3fe4');
      ctx.restore();
      ctx.fillStyle = '#ffe14d';
      bolt(ctx, 0.02, -0.02, 0.45);
      ctx.fill(); line(ctx, 0.025);
    },
  };

  function draw(ctx, key, o) {
    (DRAW[key] || DRAW.gloves)(ctx, o || {});
  }

  // Small icon canvas for menus
  function icon(key, px, locked) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = px * dpr;
    c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(px / 2, px / 2);
    g.scale(px * 0.82, px * 0.82);
    g.rotate(key === 'gloves' || key === 'thunder' ? 0 : -0.35);
    if (locked) g.filter = 'grayscale(1) brightness(0.55)';
    draw(g, key, { noGlow: true });
    return c;
  }

  function unlockedFor(level) {
    return WEAPONS.filter((w) => w.unlockLevel <= level);
  }

  window.Weapons = { list: WEAPONS, get: (k) => BY_KEY[k] || WEAPONS[0], draw, icon, unlockedFor, bolt };
})();
