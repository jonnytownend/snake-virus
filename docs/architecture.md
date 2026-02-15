# Code Virus Architecture

## Overview
The app is intentionally split into small, single-purpose modules so game rules, rendering, audio, and input are isolated and easier to maintain.
Because the app uses browser ES modules, run it through a static server if your browser blocks `file://` module loading.
Architecture and tradeoff decisions are recorded in `docs/decisions.md`.

## File Map
- `index.html`: semantic shell only, no inline CSS or gameplay logic.
- `src/styles/main.css`: all presentation styles.
- `src/main.js`: composition root that wires dependencies and bootstraps the app.

## Game Modules (`src/game`)
- `constants.js`: gameplay/system constants and UI copy.
- `source-text.js`: code block content used as the in-game map.
- `game-state.js`: initial state factory.
- `grid.js`: pure grid utilities (bounds, keying, target discovery, shuffling).
- `syntax-highlighter.js`: pure token-class derivation for syntax coloring.
- `renderer.js`: DOM rendering + HUD updates + glitch visual effect.
- `audio-engine.js`: Web Audio lifecycle, SFX, and music loop.
- `input-controller.js`: keyboard mapping and event binding.
- `game-engine.js`: core game loop, collision rules, scoring, growth, target rotation, and orchestration.

## Boundaries
- `game-engine.js` owns game state and timing.
- `renderer.js` receives state snapshots and draws; it does not own game rules.
- `audio-engine.js` is event-driven by the engine; gameplay logic does not depend on Web Audio internals.
- `input-controller.js` only emits intents (direction/start/toggle), keeping controls decoupled from rules.
