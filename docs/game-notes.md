# Code Virus Game Notes

## Current Controls
- `Arrow keys` or `W/A/S/D`: move virus.
- `Space` or `Enter`: start/restart run.
- `M`: toggle audio (SFX + background track).

## Rendering Rules
- The game board is a fixed-size character grid sourced from `src/game/source-text.js`.
- Editor typography keeps standard code-like spacing (non-square glyph geometry).
- Corrupted characters are replaced with whitespace holes (blank cells).

## Movement Timing
- The game uses one shared movement speed for all directions.
- Speed increases as the virus corrupts more target characters.

## Highlighting Rules
- Lightweight JavaScript-style syntax highlighting is applied per character cell.
- Highlight classes include keyword, string, number, comment, function name, and punctuation.
- Active target characters always override syntax color to remain readable.

## Audio
- Audio is generated with Web Audio API oscillators (no external assets).
- Eat, start, and crash events each trigger short synthesized SFX.
- A low-volume looping pattern runs while audio is enabled.

## Structure
- `index.html` is a thin shell for layout containers and IDs.
- `src/styles/main.css` contains all styling.
- `src/main.js` is the bootstrap/assembly entrypoint.
- Gameplay is split into dedicated modules under `src/game/` (engine, renderer, audio, input, syntax, grid, constants, state).
