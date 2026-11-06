# 🥊 Fruit Punch!

A silly, kid-friendly web game: cheeky cartoon fruit in boxing gloves, headbands and
**underpants** pop out from their hiding spots to taunt you. Punch them before time runs out!

No build step and no server: it's plain HTML, CSS and JavaScript.

## Play

* Open `index.html` in any modern browser (double-click it), **or**
* serve the folder with any static server, e.g. `python3 -m http.server`, and visit
  `http://localhost:8000`, **or**
* turn on GitHub Pages for this repository.

Works with mouse or touch (phones and tablets play best in landscape).

## How to play

| Action | What happens |
| --- | --- |
| **Tap** a fruit | Quick punch (1 damage) |
| **Hold**, then release | **Power punch**: a shockwave that hits every fruit nearby. Hold longer for a bigger blast (2–4 damage) |
| Punch fruit in quick succession | **Combo** multiplier, up to x5 |
| Punch a fruit while it peeks from cover | +25 sneaky bonus |

Punch the target number of fruit before the timer runs out to clear the level. You earn 1–3
stars based on time left, plus a time bonus and a power-punch bonus.

## Weapons

A new weapon unlocks every 3 levels. Pick any weapon you've unlocked on the screen before each level.

| Weapon | Unlocks | Tap | Power punch |
| --- | --- | --- | --- |
| 🥊 Boxing Gloves | Level 1 | 1 damage, normal reach | Blast that does 2–4 damage |
| 🐔 Rubber Chicken | Level 4 | 1 damage, huge reach, fruit stay dizzy longer | Very wide blast, 1–3 damage, feathers everywhere |
| 🔨 Squeaky Hammer | Level 7 | 2 damage, slow swing, squashes fruit flat | Ground pound, 3–5 damage |
| 🎈 Water Balloons | Level 10 | Splashes every fruit nearby, even behind cover | Huge splash, 1–3 damage, charges fast |
| 🍳 Frying Pan | Level 13 | 3 damage, but small target | Small blast, 4–7 damage, charges fast |
| ⚡ Thunder Glove | Level 16 | Zap jumps to 2 more fruit | Lightning strikes EVERY fruit on screen, 1–3 damage, slow charge |

## Features

* **8 fruit fighters**: apple, orange, banana, strawberry, lemon, grape (small and fast),
  pineapple (2 hits) and watermelon (3 hits). Each one wears randomly patterned underpants.
* **Obnoxious taunts**: "nyah nyah" tongue-waggling, butt wiggles, belly laughs, flexing,
  beckoning, dancing, yawning and shadow boxing, all with speech bubbles and sounds. Their
  eyes follow your fist, and when you miss they laugh at you.
* **Cartoon K.O.s**: X-eyes, juice splats, getting squashed flat, launched spinning off-screen,
  or popped clean out of their underpants. A little ghost with a halo floats away.
* **10 environments** that get harder as you go: Sunny Meadow, Sandy Beach, Kitchen Chaos,
  Jungle Rumble, Snowy Peaks, Candy Land, Spooky Graveyard, Pirate Ship, Moon Base and
  Volcano Smash. After level 10 the environments repeat, and the difficulty keeps rising.
* **Difficulty curve**: each level adds more hiding spots, more fruit (in total and on screen
  at once), faster and sneakier fruit (shorter peeks, less time out in the open), new fruit
  types, and extra hit points every 4 levels.
* **Sound**: every effect and the chiptune music are synthesized live with the Web Audio
  API, so there are no audio files. Sound and music can each be turned off.
* **Saves locally**: high score, unlocked levels, best stars per level and sound settings
  plus your chosen weapon, live in `localStorage` on your device. Nothing is sent anywhere. "Reset save" on the
  title screen clears it.

## Files

```
index.html       screens and menus
css/style.css    menu styling
js/storage.js    localStorage save data
js/audio.js      synthesized sound effects and music
js/fruitart.js   procedural fruit characters (bodies, faces, gloves, underpants, poses)
js/world.js      environments: backgrounds, hiding-spot obstacles, ambient effects
js/weapons.js    weapon stats, unlock levels and drawings
js/game.js       game loop, fruit AI, punching, scoring, levels, UI flow
```

The title font (Luckiest Guy) loads from Google Fonts. When the game is offline it falls
back to a system font and still works.
