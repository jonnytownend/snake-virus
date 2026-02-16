import {
  CORRUPTION_CHARS,
  GRID,
  HAZARDS,
  HAZARD_SEQUENCE,
  KEYWORDS,
  SPEED,
  STAGES,
  TARGET_SEQUENCE,
  TARGETS,
  UI_TEXT
} from "./constants.js";
import { createInitialState } from "./game-state.js";
import {
  buildCodeGrid,
  cellKey,
  collectTargetCandidates,
  inBounds,
  shuffled
} from "./grid.js";
import { buildStyleGrid } from "./syntax-highlighter.js";

function asSourceProvider(sourceProvider, sourceText) {
  if (sourceProvider && typeof sourceProvider.nextSource === "function") {
    return sourceProvider;
  }

  return {
    nextSource: () => sourceText || ""
  };
}

export class GameEngine {
  constructor({ renderer, audio, sourceProvider, sourceText = "" }) {
    this.renderer = renderer;
    this.audio = audio;
    this.sourceProvider = asSourceProvider(sourceProvider, sourceText);
    this.onGameOver = null;

    this.currentSourceText = sourceText;
    this.currentSourcePath = "unknown.js";
    this.codeGrid = [];
    this.styleGrid = [];
    this.boardSize = { ...GRID };
    this.remotePlayers = [];
    this.state = createInitialState(this.boardSize.width, this.boardSize.height);
    this.interval = null;
  }

  setOnGameOver(callback) {
    this.onGameOver = callback;
  }

  setRemotePlayers(players) {
    this.remotePlayers = (players || [])
      .filter((player) => player && Array.isArray(player.snake))
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        snake: player.snake
      }));
    this.render();
  }

  reset() {
    this.stopLoop();
    this.audio.setPlaybackActive(false);
    this.boardSize = this.computeBoardSize();
    this.rebuildBoard();
    this.state = createInitialState(this.boardSize.width, this.boardSize.height);

    this.pickNextTargets();
    this.refreshHazards();
    this.syncHud();
    this.renderer.setMessage(UI_TEXT.ready);
    this.render();
  }

  start() {
    if (this.state.running) return;
    if (this.state.gameOver) this.reset();

    if (!this.audio.isEnabled()) {
      void this.audio.ensureEnabledForGameplay();
    }

    this.state.running = true;
    this.audio.setPlaybackActive(true);
    this.audio.setGameSpeed(this.state.speed);
    this.audio.playStartSfx();
    this.renderer.setMessage(this.progressMessage());
    this.updateLoopSpeed();
  }

  setDirection(x, y) {
    const tail = this.state.directionQueue.length > 0
      ? this.state.directionQueue[this.state.directionQueue.length - 1]
      : this.state.direction;

    if (tail.x === -x && tail.y === -y) return;
    if (tail.x === x && tail.y === y) return;

    this.state.directionQueue.push({ x, y });
    if (this.state.directionQueue.length > 2) this.state.directionQueue.shift();
  }

  toggleAudio() {
    void this.audio.toggle();
  }

  dispose() {
    this.stopLoop();
    this.audio.dispose();
  }

  rebuildBoard() {
    this.currentSourceText = this.sourceProvider.nextSource({
      width: this.boardSize.width,
      height: this.boardSize.height
    });
    this.currentSourcePath = this.extractSourcePath(this.currentSourceText);

    this.codeGrid = buildCodeGrid(
      this.currentSourceText,
      this.boardSize.width,
      this.boardSize.height
    );
    this.styleGrid = buildStyleGrid(this.codeGrid, KEYWORDS);
  }

  computeBoardSize() {
    const measured = this.renderer.measureBoardSize?.();
    if (
      measured &&
      Number.isInteger(measured.width) &&
      Number.isInteger(measured.height) &&
      measured.width > 0 &&
      measured.height > 0
    ) {
      return measured;
    }
    return { ...GRID };
  }

  updateLoopSpeed() {
    const delayMs = Math.max(SPEED.minDelayMs, Math.floor(SPEED.baseDelayMs / this.state.speed));
    this.stopLoop();
    this.interval = setInterval(() => this.tick(), delayMs);
  }

  stopLoop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }

  syncHud() {
    this.renderer.updateStatus({
      score: this.state.score,
      stage: this.state.stage,
      targetChar: this.currentTargetLabel(),
      avoidChars: this.currentAvoidLabel(),
      eaten: this.state.eatenCount,
      speed: this.state.speed,
      audioEnabled: this.audio.isEnabled()
    });
  }

  render() {
    this.renderer.renderBoard({
      codeGrid: this.codeGrid,
      styleGrid: this.styleGrid,
      eaten: this.state.eaten,
      corruptedChars: this.state.corruptedChars,
      activeTargets: this.state.activeTargets,
      hazardCells: this.state.hazardCells,
      remotePlayers: this.remotePlayers,
      snake: this.state.snake,
      gameOver: this.state.gameOver,
      won: this.state.won
    });
  }

  tick() {
    if (!this.state.running || this.state.gameOver) return;

    const queued = this.state.directionQueue.shift();
    if (queued) this.state.direction = queued;

    const head = this.state.snake[0];
    const next = {
      x: head.x + this.state.direction.x,
      y: head.y + this.state.direction.y
    };

    if (!inBounds(next.x, next.y, this.boardSize.width, this.boardSize.height)) {
      this.endGame(false);
      return;
    }

    if (this.collidesWithSnake(next.x, next.y)) {
      this.endGame(false);
      return;
    }

    if (this.collidesWithRemoteSnake(next.x, next.y)) {
      this.endGame(false, false, false, true);
      return;
    }

    const nextKey = cellKey(next.x, next.y);
    if (this.state.eaten.has(nextKey)) {
      this.endGame(false, false, true);
      return;
    }

    if (this.state.hazardCells.has(nextKey)) {
      this.endGame(false, true);
      return;
    }

    this.state.snake.unshift(next);

    let leveledUp = false;
    if (this.state.activeTargets.has(nextKey)) {
      leveledUp = this.eatTarget(nextKey);
    } else if (this.state.growth > 0) {
      this.state.growth -= 1;
    } else {
      this.state.snake.pop();
    }

    if (this.state.gameOver) {
      this.syncHud();
      this.render();
      return;
    }

    this.refreshHazards();
    this.syncHud();
    if (!leveledUp) this.renderer.setMessage(this.progressMessage());
    this.updateLoopSpeed();
    this.render();
  }

  collidesWithSnake(x, y) {
    for (let i = 0; i < this.state.snake.length; i += 1) {
      const segment = this.state.snake[i];
      if (segment.x === x && segment.y === y) return true;
    }
    return false;
  }

  collidesWithRemoteSnake(x, y) {
    for (const player of this.remotePlayers) {
      for (let i = 0; i < player.snake.length; i += 1) {
        const segment = player.snake[i];
        if (segment.x === x && segment.y === y) return true;
      }
    }
    return false;
  }

  eatTarget(cell) {
    this.state.activeTargets.delete(cell);
    this.state.eaten.add(cell);
    this.state.corruptedChars.set(cell, this.randomCorruptionChar());
    this.state.hazardCells.delete(cell);
    this.state.eatenCount += 1;
    this.state.eatenThisTarget += 1;
    this.state.score += 12 + this.state.snake.length;
    this.state.growth += 1;
    this.state.speed = Math.min(
      SPEED.maxMultiplier,
      1 + this.state.eatenCount * SPEED.increasePerEat
    );
    this.audio.setGameSpeed(this.state.speed);

    this.renderer.triggerGlitch();
    this.audio.playEatSfx();

    if (this.checkStageProgress()) return true;

    if (this.state.eatenThisTarget >= this.state.targetQuota) {
      this.pickNextTargets();
      this.refreshHazards(true);
      return false;
    }

    this.maybeRefreshTargets();
    return false;
  }

  randomCorruptionChar() {
    const idx = Math.floor(Math.random() * CORRUPTION_CHARS.length);
    return CORRUPTION_CHARS[idx];
  }

  maybeRefreshTargets() {
    if (this.state.activeTargets.size > 0) return;
    this.pickNextTargets();
  }

  checkStageProgress() {
    const nextStage = 1 + Math.floor(this.state.eatenCount / STAGES.corruptionsPerLevel);
    if (nextStage <= this.state.stage) return false;

    while (this.state.stage < nextStage && !this.state.gameOver) {
      this.state.stage += 1;
      this.advanceStage();
    }

    return true;
  }

  advanceStage() {
    this.rebuildBoard();
    this.state.activeTargets.clear();
    this.state.hazardCells.clear();
    this.state.activeHazardChars = [];
    this.state.eatenThisTarget = 0;

    const hasTargets = this.pickNextTargets();
    if (!hasTargets) return;

    this.refreshHazards(true);
    this.renderer.triggerGlitch();
    this.audio.playStartSfx();
    this.renderer.setMessage(`Stage ${this.state.stage} breach. Injecting ${this.currentSourcePath}.`);
  }

  pickNextTargets() {
    const charCount = Math.min(
      TARGETS.maxChars,
      TARGETS.minChars + Math.floor(this.state.eatenCount / TARGETS.charGrowthStep)
    );

    const selected = [];
    for (let i = 0; i < TARGET_SEQUENCE.length && selected.length < charCount; i += 1) {
      const idx = (this.state.currentTargetIndex + i) % TARGET_SEQUENCE.length;
      const char = TARGET_SEQUENCE[idx];
      const pool = collectTargetCandidates(this.codeGrid, char, this.state.eaten);
      if (pool.length === 0) continue;
      selected.push({ idx, char, pool });
    }

    if (selected.length === 0) {
      this.state.won = true;
      this.state.running = false;
      this.state.gameOver = true;
      this.stopLoop();
      this.audio.setPlaybackActive(false);
      this.renderer.setMessage(UI_TEXT.fullCorruptionReset);
      return false;
    }

    const perCharCap = Math.min(
      TARGETS.perCharMax,
      TARGETS.perCharBase + Math.floor(this.state.score / TARGETS.perCharScoreStep)
    );

    const targetCells = new Set();
    for (const item of selected) {
      for (const cell of shuffled(item.pool).slice(0, perCharCap)) {
        targetCells.add(cell);
      }
    }

    this.state.activeTargetChars = selected.map((item) => item.char);
    this.state.currentTargetIndex = (selected[selected.length - 1].idx + 1) % TARGET_SEQUENCE.length;
    this.state.activeTargets = targetCells;
    this.state.eatenThisTarget = 0;
    this.state.targetQuota = Math.min(
      TARGETS.maxQuota,
      TARGETS.baseQuota + Math.floor(this.state.score / TARGETS.scoreStep)
    );

    return true;
  }

  desiredHazardCount() {
    if (this.state.eatenCount < HAZARDS.unlockAtEaten) return 0;
    const growth = Math.floor((this.state.eatenCount - HAZARDS.unlockAtEaten) / HAZARDS.growthStep);
    return Math.min(HAZARDS.maxCount, HAZARDS.baseCount + growth * 3);
  }

  refreshHazards(forceReset = false) {
    const desiredCount = this.desiredHazardCount();
    if (desiredCount <= 0) {
      this.state.hazardCells.clear();
      this.state.activeHazardChars = [];
      return;
    }

    if (forceReset) this.state.hazardCells.clear();

    const snakeSet = new Set(this.state.snake.map((segment) => cellKey(segment.x, segment.y)));
    const byChar = new Map();

    for (const char of HAZARD_SEQUENCE) {
      const candidates = collectTargetCandidates(this.codeGrid, char, this.state.eaten)
        .filter((key) => !this.state.activeTargets.has(key))
        .filter((key) => !snakeSet.has(key));

      if (candidates.length > 0) byChar.set(char, shuffled(candidates));
    }

    this.state.activeHazardChars = [...byChar.keys()].slice(0, 4);

    const validExisting = new Set();
    for (const key of this.state.hazardCells) {
      if (this.state.activeTargets.has(key) || this.state.eaten.has(key) || snakeSet.has(key)) continue;
      const [x, y] = key.split(",").map(Number);
      if (!inBounds(x, y, this.boardSize.width, this.boardSize.height)) continue;
      validExisting.add(key);
    }

    this.state.hazardCells = validExisting;

    const pools = [...byChar.values()];
    let poolIndex = 0;
    while (this.state.hazardCells.size < desiredCount && pools.length > 0) {
      const pool = pools[poolIndex % pools.length];
      const next = pool.pop();
      if (next) this.state.hazardCells.add(next);
      poolIndex += 1;

      if (pool.length === 0) {
        const idx = pools.indexOf(pool);
        if (idx >= 0) pools.splice(idx, 1);
      }
    }
  }

  endGame(didWin, hitHazard = false, hitCorruption = false, hitPlayer = false) {
    this.state.running = false;
    this.state.gameOver = true;
    this.state.won = didWin;
    this.state.gameOverReason = didWin
      ? "win"
      : (hitPlayer ? "player" : (hitCorruption ? "corruption" : (hitHazard ? "hazard" : "crash")));
    this.stopLoop();
    this.audio.setPlaybackActive(false);

    if (!didWin) this.audio.playCrashSfx();

    const message = didWin
      ? UI_TEXT.fullCorruption
      : (hitPlayer
        ? UI_TEXT.playerCrash
        : (hitCorruption
        ? UI_TEXT.corruptionCrash
        : (hitHazard ? UI_TEXT.hazardCrash : UI_TEXT.crash)));

    this.renderer.setMessage(message);
    this.render();
    if (typeof this.onGameOver === "function") {
      this.onGameOver(this.state.gameOverReason);
    }
  }

  currentTargetLabel() {
    if (this.state.activeTargetChars.length === 0) {
      return TARGET_SEQUENCE[this.state.currentTargetIndex] || TARGET_SEQUENCE[0];
    }

    return this.state.activeTargetChars.join(" ");
  }

  currentAvoidLabel() {
    if (this.state.activeHazardChars.length === 0) return "-";
    return this.state.activeHazardChars.join(" ");
  }

  progressMessage() {
    const target = this.currentTargetLabel();
    const avoid = this.currentAvoidLabel();
    return `Stage ${this.state.stage} | Corrupt [${target}] (${this.state.eatenThisTarget}/${this.state.targetQuota}). Avoid [${avoid}].`;
  }

  extractSourcePath(text) {
    if (!text) return "unknown.js";
    const firstLine = text.split("\n", 1)[0].trim();
    if (!firstLine.startsWith("// source:")) return "unknown.js";
    const path = firstLine.slice("// source:".length).trim();
    return path || "unknown.js";
  }
}
