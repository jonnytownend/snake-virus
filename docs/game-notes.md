# Code Virus Game Notes

## Current Controls
- `Arrow keys` or `W/A/S/D`: move virus.
- `Space` or `Enter`: start/restart run.
- `M`: toggle audio (SFX + background track).

## Rendering Rules
- The game board is a fixed-size character grid extracted from the in-page script.
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
