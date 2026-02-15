# Code Virus Game Notes

## Current Controls
- `Arrow keys` or `W/A/S/D`: move virus.
- `Space` or `Enter`: start/restart run.
- `M`: toggle audio (SFX + background track).

## Rendering Rules
- The game board is a fixed-size character grid sourced from `src/game/source-text.js`.
- The virtual IDE window is centered in the browser page with surrounding spacing.
- Editor typography keeps standard code-like spacing (non-square glyph geometry).
- Corrupted characters are replaced with whitespace holes (blank cells).
- Play-area dimensions are measured from the editor viewport so bounds align with visible panel edges.

## Movement Timing
- The game uses one shared movement speed for all directions.
- Speed increases as the virus corrupts more target characters.
- Direction input is buffered (short queue) to preserve rapid turn intent.

## Highlighting Rules
- Lightweight JavaScript-style syntax highlighting is applied per character cell.
- Highlight classes include keyword, string, number, comment, function name, and punctuation.
- Active target characters always override syntax color to remain readable.

## Audio
- Audio is generated with Web Audio API oscillators (no external assets).
- Eat, start, and crash events each trigger short synthesized SFX.
- A low-volume looping pattern runs while audio is enabled and gameplay is active.
- Music tempo scales up with player speed and stops on game over.

## Structure
- `index.html` is a thin shell for layout containers and IDs.
- `src/styles/main.css` contains all styling.
- `src/main.js` is the bootstrap/assembly entrypoint.
- Gameplay is split into dedicated modules under `src/game/` (engine, renderer, audio, input, syntax, grid, constants, state).
- Architecture/design decisions are logged in `docs/decisions.md`.
