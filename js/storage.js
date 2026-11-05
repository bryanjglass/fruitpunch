// Fruit Punch - local save data (localStorage only, nothing leaves the device)
(function () {
  const KEY = 'fruitpunch.save.v1';
  const defaults = {
    highScore: 0,
    unlocked: 1,      // highest level the player may start from
    stars: {},        // level number -> best stars (1..3)
    totalKOs: 0,
    muted: false,
    music: true,
  };

  const Store = {
    data: JSON.parse(JSON.stringify(defaults)),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) Object.assign(this.data, JSON.parse(raw));
      } catch (e) { /* private mode or blocked storage: play without saving */ }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
    },
    reset() {
      this.data = JSON.parse(JSON.stringify(defaults));
      this.save();
    },
  };

  window.Store = Store;
})();
