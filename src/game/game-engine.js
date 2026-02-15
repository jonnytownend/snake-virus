import {
  GRID,
  KEYWORDS,
  SPEED,
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

export class GameEngine {
  constructor({ renderer, audio, sourceText }) {
    this.renderer = renderer;
    this.audio = audio;
    this.sourceText = sourceText;

    this.codeGrid = [];
    this.styleGrid = [];
    this.state = createInitialState(GRID.width, GRID.height);
    this.interval = null;
  }

  reset() {
    this.stopLoop();
    this.rebuildBoard();
    this.state = createInitialState(GRID.width, GRID.height);

    this.pickNextTarget();
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
    this.audio.playStartSfx();
    this.renderer.setMessage(this.progressMessage());
    this.updateLoopSpeed();
  }

  setDirection(x, y) {
    if (this.state.direction.x === -x && this.state.direction.y === -y) return;
    this.state.queuedDirection = { x, y };
  }

  toggleAudio() {
    void this.audio.toggle();
  }

  dispose() {
    this.stopLoop();
    this.audio.dispose();
  }

  rebuildBoard() {
    this.codeGrid = buildCodeGrid(this.sourceText, GRID.width, GRID.height);
    this.styleGrid = buildStyleGrid(this.codeGrid, KEYWORDS);
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
      targetChar: this.currentTargetChar(),
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
      activeTargets: this.state.activeTargets,
      snake: this.state.snake,
      gameOver: this.state.gameOver,
      won: this.state.won
    });
  }

  tick() {
    if (!this.state.running || this.state.gameOver) return;

    this.state.direction = this.state.queuedDirection;

    const head = this.state.snake[0];
    const next = {
      x: head.x + this.state.direction.x,
      y: head.y + this.state.direction.y
    };

    if (!inBounds(next.x, next.y, GRID.width, GRID.height)) {
      this.endGame(false);
      return;
    }

    if (this.collidesWithSnake(next.x, next.y)) {
      this.endGame(false);
      return;
    }

    this.state.snake.unshift(next);

    const nextKey = cellKey(next.x, next.y);
    if (this.state.activeTargets.has(nextKey)) {
      this.eatTarget(nextKey);
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

    this.syncHud();
    this.renderer.setMessage(this.progressMessage());
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

  eatTarget(cell) {
    this.state.activeTargets.delete(cell);
    this.state.eaten.add(cell);
    this.state.eatenCount += 1;
    this.state.eatenThisTarget += 1;
    this.state.score += 12 + this.state.snake.length;
    this.state.growth += 1;
    this.state.speed = Math.min(
      SPEED.maxMultiplier,
      1 + this.state.eatenCount * SPEED.increasePerEat
    );

    this.renderer.triggerGlitch();
    this.audio.playEatSfx();

    if (this.state.eatenThisTarget >= this.state.targetQuota) {
      this.state.currentTargetIndex =
        (this.state.currentTargetIndex + 1) % TARGET_SEQUENCE.length;
      this.pickNextTarget();
      return;
    }

    this.maybeRefreshTargets();
  }

  maybeRefreshTargets() {
    if (this.state.activeTargets.size > 0) return;
    this.pickNextTarget();
  }

  pickNextTarget() {
    for (let i = 0; i < TARGET_SEQUENCE.length; i += 1) {
      const idx = (this.state.currentTargetIndex + i) % TARGET_SEQUENCE.length;
      const char = TARGET_SEQUENCE[idx];
      const pool = collectTargetCandidates(this.codeGrid, char, this.state.eaten);

      if (pool.length > 0) {
        this.state.currentTargetIndex = idx;
        this.state.activeTargets = new Set(
          shuffled(pool).slice(0, TARGETS.maxActive)
        );
        this.state.eatenThisTarget = 0;
        this.state.targetQuota = Math.min(
          TARGETS.maxQuota,
          TARGETS.baseQuota + Math.floor(this.state.score / TARGETS.scoreStep)
        );
        return true;
      }
    }

    this.state.won = true;
    this.state.running = false;
    this.state.gameOver = true;
    this.stopLoop();
    this.renderer.setMessage(UI_TEXT.fullCorruptionReset);
    return false;
  }

  endGame(didWin) {
    this.state.running = false;
    this.state.gameOver = true;
    this.state.won = didWin;
    this.stopLoop();

    if (!didWin) this.audio.playCrashSfx();

    this.renderer.setMessage(didWin ? UI_TEXT.fullCorruption : UI_TEXT.crash);
    this.render();
  }

  currentTargetChar() {
    return TARGET_SEQUENCE[this.state.currentTargetIndex] || TARGET_SEQUENCE[0];
  }

  progressMessage() {
    return `Corrupt '${this.currentTargetChar()}' characters (${this.state.eatenThisTarget}/${this.state.targetQuota}).`;
  }
}
