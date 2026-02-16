# Decisions Log

## 2026-02-16

### Decision: Add explicit join-in-progress UX for multiplayer startup
- Context: Operators could trigger room join and see no visible state change while network/auth checks were in-flight.
- Decision: Add intro modal busy state (disabled CTA + connecting copy), deduplicate parallel join attempts, and restore controls on completion/failure.
- Consequence: Launch interactions now provide immediate feedback and avoid duplicate join race behavior from repeated key/button input.

### Decision: Replace query reads inside Firestore transactions for room joins
- Context: `tx.get(query)` in room allocation caused runtime failures (`Cannot read properties of undefined (reading 'path')`) in browser SDK transactions.
- Decision: Perform room candidate query with `getDocs` outside the transaction, then run a transaction on the chosen room reference with capacity re-check + bounded retry.
- Consequence: Multiplayer joins no longer crash on transaction lookup and remain safe under concurrent joins.

### Decision: Add explicit Firebase bootstrap/config diagnostics
- Context: Multiplayer join failures were still surfacing generic messages when SDK imports or config validation failed before Firestore returned a structured Firebase code.
- Decision: Validate required Firebase config fields at startup, emit explicit coded errors for invalid config and SDK import failures, and map those codes to actionable UI guidance.
- Consequence: Operators now get precise remediation steps (config shape, invalid API key, unauthorized domain, SDK/network blocking) instead of opaque connection failures.

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

### Decision: Rebrand experience as Snake Virus
- Context: The product identity shifted from generic code-corruption theme to a clearer game title.
- Decision: Rename UI/title copy and virtual file references to `Snake Virus` / `snake-virus.ts`.
- Consequence: The game now has consistent naming across HUD, browser title, and faux IDE frame.

### Decision: Add score-driven stage transitions that reload source slices
- Context: Single-map runs became visually repetitive despite dynamic targets and hazards.
- Decision: Introduce level thresholds by score; on each stage-up, load a new source slice and repopulate targets/hazards while preserving run momentum.
- Consequence: Long sessions traverse more of the corpus and maintain variety without resetting score/speed progression.

### Decision: Add launch briefing overlay with narrative onboarding
- Context: New players needed clearer framing of rules and the meta "real source code" premise.
- Decision: Gate initial start behind a styled intro overlay with mission/story copy and explicit controls.
- Consequence: First interaction has stronger theme, clearer rules, and immediate awareness of the meta source-code mechanic.

### Decision: Expand target character pool with alphabetic symbols
- Context: Punctuation-only targets limited visible code mutation patterns.
- Decision: Extend the target sequence to include high-frequency lowercase letters.
- Consequence: Corruption visibly scrambles words/tokens in addition to punctuation, improving readability of mutation effects.

### Decision: Increase corruption glitch intensity on successful eats
- Context: Previous glitch signal was subtle and under-communicated escalating system instability.
- Decision: Add a stronger glitch mode with amplified jitter/hue/frame distortion for corruption events.
- Consequence: Each successful corruption now produces a clearer sense of system degradation and tension.

### Decision: Drive stage progression by corruption count instead of score
- Context: Score-scaled stage-ups occurred too quickly, reducing time spent visibly corrupting a single source slice.
- Decision: Switch stage thresholds to total corrupted target characters (`eatenCount`) with a larger per-stage quota.
- Consequence: Players stay on each file longer, making local corruption patterns more readable before transitioning.

### Decision: Set stage cadence to every 10 corruptions and persist corruption across swaps
- Context: Previous corruption-based cadence kept players on one file too long, and stage transitions reset visible corruption.
- Decision: Trigger stage transitions every 10 corrupted targets and retain `eaten`/`corruptedChars` state when loading the next file slice.
- Consequence: File changes happen at a brisker pace while corruption continuously accumulates on-screen, increasing sustained difficulty.

### Decision: Revert glitch effect to subtle jitter baseline
- Context: Amplified multi-layer glitch effects felt visually excessive during normal play.
- Decision: Remove the strong glitch mode and return to the earlier short jitter-only animation.
- Consequence: Corruption feedback remains readable without dominating the visual experience.

### Decision: Use Firebase Firestore as multiplayer room/state backend
- Context: Multiplayer required a managed realtime backend with rooming and minimal local infrastructure.
- Decision: Implement a Firebase adapter that allocates players to capped rooms and syncs player state via Firestore snapshots.
- Consequence: Multiplayer can run with a demo config immediately and be switched to a real Firebase project by replacing config values.

### Decision: Gate first run on player name and room join
- Context: Multiplayer sessions need stable identity for UI and room membership before gameplay starts.
- Decision: Extend the intro overlay with operator name capture and defer game start until join succeeds.
- Consequence: Every active player has a visible name/score identity and is placed into a valid room before movement begins.

### Decision: Render remote snakes and enforce player-collision ejection
- Context: Multiplayer needed direct interaction beyond score comparison.
- Decision: Render remote snake bodies/heads on the shared board and treat local collision with remote snakes as terminal with room ejection.
- Consequence: Runs include direct spatial competition; player-vs-player impacts have immediate stakes and clear feedback.

### Decision: Isolate multiplayer logic into backend/session/helper modules
- Context: Networking complexity should not leak into core game-loop and rendering rules.
- Decision: Split networking into `firebase-backend.js`, `multiplayer-session.js`, and pure helper utilities in `room-logic.js`.
- Consequence: Multiplayer behavior is testable in isolation, backend swaps are easier, and core gameplay remains maintainable.

### Decision: Surface Firebase join failures with explicit diagnostics
- Context: A single generic "failed to connect" message made real setup issues hard to debug.
- Decision: Add error-code aware mapping for common Firebase failures (rules, missing Firestore DB, auth configuration, network/API).
- Consequence: Operators get actionable setup feedback directly in the launch modal and can resolve integration issues faster.
