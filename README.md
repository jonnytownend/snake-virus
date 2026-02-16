# Snake Virus

Snake Virus is a browser game inspired by classic Snake.
Instead of eating food on an empty board, you control a virus that corrupts characters inside a live code block rendered in an IDE-style interface.

## Features
- IDE-themed game board built from source code text.
- Target-character gameplay loop across punctuation + alphabetic symbols.
- Progressive difficulty (snake growth + speed scaling).
- Corruption-count-based stage progression (every 10 corruptions) that swaps to new source regions mid-run.
- Corruption symbols persist across stage/file swaps, so each run becomes progressively denser and harder.
- Intro mission overlay that explains mechanics and the meta source-code concept.
- Firebase-backed real-time multiplayer with automatic rooming (up to 5 players per room).
- Live player name/score panel and player-vs-player snake collisions.
- Syntax-highlighted code rendering.
- Visual glitch effects on corruption events.
- Synthesized sound effects and background music via Web Audio API.

## Project Structure
```text
snake-code/
  index.html
  src/
    main.js
    styles/
      main.css
    game/
      audio-engine.js
      constants.js
      game-engine.js
      game-state.js
      grid.js
      input-controller.js
      renderer.js
      source-text.js
      syntax-highlighter.js
    network/
      firebase-backend.js
      multiplayer-session.js
      room-logic.js
  tests/
    game-engine.test.js
    game-state.test.js
    grid.test.js
    syntax-highlighter.test.js
  docs/
    architecture.md
    game-notes.md
```

## Getting Started
### Prerequisites
- Node.js 20+ (recommended)
- npm 10+
- Python 3 (for local static hosting)

### Install
```bash
npm install
```

### Run Locally
```bash
npm run run
```
Then open:
- `http://localhost:8000`

Note: The app uses browser ES modules, so run through a local server (not `file://`).

## Controls
- `Arrow keys` / `W A S D`: move
- `Space` or `Enter`: start / restart
- `M`: toggle audio

## Multiplayer Backend
- Firebase is used as the multiplayer backend.
- The repository currently ships with a demo Firebase config fallback in `src/network/firebase-backend.js`.
- You can provide runtime config via either `window.__SNAKE_VIRUS_FIREBASE_CONFIG` or `window.SNAKE_VIRUS_FIREBASE_CONFIG` before `src/main.js` loads.
- Example:
```html
<script>
  window.__SNAKE_VIRUS_FIREBASE_CONFIG = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  };
</script>
```
- Ensure Firestore Database is created for the project.
- Ensure Firestore rules allow the app to read/write.
- If rules require authenticated users (`request.auth != null`), enable Anonymous sign-in in Firebase Auth.
- If using Firebase Auth, ensure `localhost` is listed in Auth -> Settings -> Authorized domains.
- Quick console checklist:
  1. Firebase Auth -> Sign-in method -> enable `Anonymous`.
  2. Firebase Auth -> Settings -> Authorized domains -> include `localhost`.
  3. Firestore Database -> create database (Native mode).
  4. Firestore Rules -> allow reads/writes for your intended auth model.

## Scripts
- `npm run run`: serve app with Python on port `8000`
- `npm test`: run Jest unit tests
- `npm run test:watch`: run tests in watch mode
- `npm run test:coverage`: run tests with coverage output

## Testing Strategy
Unit tests cover:
- Grid utilities and candidate selection logic.
- Syntax highlighting classification behavior.
- Initial state creation.
- Core game-engine behavior (start/reset/tick/collisions/scoring/terminal states).
- Multiplayer session lifecycle and room-selection helper logic.

Coverage reports are generated in:
- Console summary (`text`)
- `coverage/lcov-report/index.html`
- `coverage/lcov.info`

## Engineering Notes
- Game rules are centralized in `src/game/game-engine.js`.
- Rendering is isolated in `src/game/renderer.js`.
- Audio concerns are encapsulated in `src/game/audio-engine.js`.
- Input emits intent only, via `src/game/input-controller.js`.

See `docs/architecture.md` for module boundaries and design rationale.

## Troubleshooting
- If the app does not load scripts, confirm you are serving via `npm run run`.
- If tests fail due to environment issues, verify Node version (`node -v`) and reinstall dependencies (`npm install`).

## License
ISC
