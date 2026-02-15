# Decisions Log

## 2026-02-15

### Decision: Add direction input buffering (queue length 2)
- Context: Rapid sequential key presses were collapsing to a single direction update, making sharp turns unreliable.
- Decision: Store up to two upcoming directions and validate each new input against the current queued tail.
- Consequence: Players can perform tight turns reliably while still blocking illegal immediate reversals.

### Decision: Make play-area bounds dynamic to editor viewport
- Context: Fixed grid dimensions made collision boundaries feel disconnected from the visible play area.
- Decision: Measure character metrics and editor viewport in the renderer, then derive runtime board width/height.
- Consequence: Collision edges now align with the visible editor panel edges (which now fill the window).

### Decision: Tie music tempo to game speed and stop playback on game-over
- Context: Audio intensity did not track gameplay pacing and continued through terminal states.
- Decision: Introduce `setGameSpeed` and `setPlaybackActive` in the audio engine, and drive both from game state transitions.
- Consequence: Music accelerates as player speed increases and stops when the run ends.

### Decision: Normalize corrupted-cell visual to true background
- Context: Eaten-character holes had visible tinting relative to the editor background.
- Decision: Render hole cells with transparent background and transparent text.
- Consequence: Corrupted characters visually disappear cleanly without residual tint artifacts.

### Decision: Increase target character prominence
- Context: Targets could be lost in syntax-highlighted text at speed.
- Decision: Strengthen target styling using brighter background, outline/glow, and pulse animation.
- Consequence: Targets remain clearly distinguishable from regular syntax tokens.

### Decision: Keep centered virtual window while preserving edge-aligned play bounds
- Context: Full-viewport virtual window removed desired page framing/spacing.
- Decision: Revert to centered virtual window styling and retain dynamic board sizing based on editor viewport.
- Consequence: The snake still reaches the rendered window's visible editor edges, while the virtual window remains centered inside the real browser window.
