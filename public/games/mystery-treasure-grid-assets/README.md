# Mystery Treasure Grid — Complete Browser Game Pack (V3)

This updated pack includes:

- **wider browser background** so Chrome no longer shows empty blue side bars
- **empty dynamic text assets** for the two user-marked UI areas:
  - `counter-board-empty` (top-left small counter board)
  - `progress-pill-empty` (right panel code progress pill)
- **full HTML / CSS / JS**
- **transparent PNG + WebP assets**
- runs directly in **Google Chrome**

## Main Files

- `index.html` — game page
- `styles.css` — layout, art placement, responsive stage scaling, effects
- `game.js` — logic and interactions

## Assets

- `assets/png/` — PNG exports
- `assets/webp/` — WebP exports
- `asset-manifest.json` — list of assets

### Important updated assets
- `background-browser-wide` — fills the browser width outside the fixed game stage
- `background-stage` — stage background inside the fixed 1672×941 game area
- `counter-board-empty` — blank wooden board for dynamic `0 / 16`
- `progress-pill-empty` — blank blue pill for dynamic `0 / 16 CODES`

## Features

- fixed game stage based on the reference layout
- wide tropical background behind the stage
- tile hover effects
- answer hover effects
- correct answer effects: glow, burst, score float, slot fill, chest bounce
- wrong answer effects: flash, wobble, X particles
- timer, score, restart, sound toggle
- completion overlay

## Change Questions
Edit the `QUESTIONS` array at the top of `game.js`.

## Run
Open `index.html` directly in Chrome.
