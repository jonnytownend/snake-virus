# Decisions Log

## 2026-02-15

### Decision: Add direction input buffering (queue length 2)
- Context: Rapid sequential key presses were collapsing to a single direction update, making sharp turns unreliable.
- Decision: Store up to two upcoming directions and validate each new input against the current queued tail.
- Consequence: Players can perform tight turns reliably while still blocking illegal immediate reversals.

### Decision: Make play-area bounds dynamic to editor viewport
- Context: Fixed grid dimensions made collision boundaries feel disconnected from the visible play area.
- Decision: Measure character metrics and editor viewport in the renderer, then derive runtime board width/height.
- Consequence: Collision edges now align with the visible editor panel edges.

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

### Decision: Source map content from generated real repository corpus
- Context: Static hardcoded code blocks reduced replay value and did not reflect the actual project.
- Decision: Add `scripts/generate-source-corpus.mjs` to generate `src/game/source-corpus.js`, and select random source windows per run.
- Consequence: Each play session can render a different real code slice while remaining browser-only at runtime.

### Decision: Introduce progressive hazard cells separate from target cells
- Context: Gameplay needed additional pressure and failure modes beyond walls/self-collision.
- Decision: Add hazard character classes that unlock after early progression and scale in density over time.
- Consequence: Runs become more challenging as corruption progresses; touching a hazard ends the run.

### Decision: Promote multi-target cycles instead of single active target char
- Context: Single-target loops could feel sparse and repetitive at higher speed.
- Decision: Activate multiple target character classes simultaneously, with per-cycle quotas and dynamic spawn volume.
- Consequence: More actionable targets are present at any moment, improving flow and reducing dead movement.

### Decision: Restrict source corpus generation to JavaScript files
- Context: The game narrative centers on a virus corrupting executable code, and mixed asset/docs content diluted that theme.
- Decision: Update corpus generation to include only `.js` files from project runtime/test/script paths.
- Consequence: Every playable code slice now consistently reads as JavaScript source.

### Decision: Increase challenge by tightening visual cell density via typography
- Context: The measured board exposed too many cells at once, lowering pressure and difficulty.
- Decision: Increase editor code font size while keeping dynamic board measurement edge-aligned to the virtual editor window.
- Consequence: Fewer cells fit on-screen, making routes denser and mistakes more costly without changing collision boundary semantics.

### Decision: Render consumed cells as corruption glyphs instead of blanks
- Context: Whitespace holes conveyed deletion, but the desired story is active source corruption.
- Decision: Persist a random corruption symbol per eaten cell and render it in a dedicated corrupted style.
- Consequence: Corrupted paths remain visible and thematic, showing the virus mutating underlying code over time.

### Decision: Make corrupted cells lethal on re-entry
- Context: Corruption glyphs were visual-only, so traversing already-corrupted code had no gameplay consequence.
- Decision: Treat any previously eaten/corrupted cell as an immediate fail state when the virus collides with it.
- Consequence: Corruption becomes a persistent spatial hazard, increasing route-planning pressure over long runs.

### Decision: Unify danger-cell styling across corruption sources
- Context: Eaten-cell corruption and progression hazards used different color treatments, causing visual ambiguity.
- Decision: Apply one shared red-highlight style to all dangerous corruption cells regardless of origin.
- Consequence: Players can instantly read any corruption-marked cell as the same class of threat.
