# Code Virus

Code Virus is a browser game inspired by classic Snake.
Instead of eating food on an empty board, you control a virus that corrupts characters inside a live code block rendered in an IDE-style interface.

## Features
- IDE-themed game board built from source code text.
- Target-character gameplay loop (`{}`, `()`, `[]`, `;`, `=`, `<`, `>`).
- Progressive difficulty (snake growth + speed scaling).
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
