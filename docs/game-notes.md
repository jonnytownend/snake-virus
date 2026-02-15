# Code Virus Game Notes

## Current Controls
- `Arrow keys` or `W/A/S/D`: move virus.
- `Space` or `Enter`: start/restart run.
- `M`: toggle audio (SFX + background track).

## Rendering Rules
- The game board is sourced from real repository JavaScript files via `src/game/source-corpus.js`.
- A different source slice is selected each run/reset.
- The virtual IDE window is centered in the browser page with surrounding spacing.
- Editor typography keeps standard code-like spacing (non-square glyph geometry).
- Corrupted characters are replaced with persistent random corruption glyphs.
- Play-area dimensions are measured from the editor viewport so bounds align with visible panel edges.
- Slightly larger code font reduces visible cell count and raises difficulty.

## Movement Timing
- The game uses one shared movement speed for all directions.
- Speed increases as the virus corrupts more target characters.
- Direction input is buffered (short queue) to preserve rapid turn intent.

## Highlighting Rules
- Lightweight JavaScript-style syntax highlighting is applied per character cell.
- Highlight classes include keyword, string, number, comment, function name, and punctuation.
- Active target characters always override syntax color to remain readable.
- All dangerous corruption cells are highlighted with one consistent red style (including progression hazards and eaten-cell corruption).

## Targeting Rules
- Multiple target character classes are active at the same time.
- As progression increases, more target classes and more active target cells are spawned.
- A target cycle completes after a quota of successful corruptions, then a new target set is selected.

## Hazard Rules
- Hazard characters unlock after an early progression threshold.
- Hazard density increases as more code is corrupted.
- Touching a hazard cell ends the run immediately.
- Re-entering a previously corrupted (eaten) cell also ends the run immediately.

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
- Real source-code corpus generation is handled by `scripts/generate-source-corpus.mjs`.
- Architecture/design decisions are logged in `docs/decisions.md`.
