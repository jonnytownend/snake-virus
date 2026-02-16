# Multiplayer Implementation Plan

## Goal
Implement Firebase-backed real-time multiplayer for Snake Virus with:
- Name capture at launch
- Automatic room assignment (max 5 players per room)
- Shared board session with remote snakes rendered locally
- Player-vs-player collision elimination
- Live player name/score display

## Delivery Steps
1. Introduce networking architecture:
- Add a Firebase backend adapter module.
- Add a session orchestrator module for join/leave/sync lifecycle.
- Add pure room/normalization helper functions.

2. Integrate gameplay with multiplayer:
- Render remote snakes.
- Detect and handle local collision against remote snakes.
- Publish local state (snake, score, stage, game-over) periodically.
- Receive room player snapshots and update UI/game state.

3. Player onboarding and UX:
- Extend intro modal to collect player name.
- Prevent starting until name is entered and room join succeeds.
- Add HUD leaderboard for live player names/scores.

4. Scaling and rooming:
- Join least-populated room under cap.
- Create a new room when existing rooms are full.
- Keep rooming fully transparent to players.

5. Testing and docs:
- Unit test room selection/normalization helpers.
- Unit test multiplayer session orchestration behavior.
- Update architecture notes and decisions log.

## Status
- Steps 1-5 completed in this iteration.
