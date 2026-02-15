import { jest } from "@jest/globals";
import { HAZARDS, UI_TEXT } from "../src/game/constants.js";
import { GameEngine } from "../src/game/game-engine.js";
import { cellKey } from "../src/game/grid.js";

function buildSource(lines = 30) {
  const row = "{ } ( ) [ ] ; = < > function run() { return 42; } // comment";
  return Array.from({ length: lines }, () => row).join("\n");
}

function createRendererMock({ measuredBoardSize = null } = {}) {
  return {
    updateStatus: jest.fn(),
    updateAudioStatus: jest.fn(),
    setMessage: jest.fn(),
    renderBoard: jest.fn(),
    triggerGlitch: jest.fn(),
    measureBoardSize: jest.fn(() => measuredBoardSize)
  };
}

function createAudioMock({ enabled = true } = {}) {
  return {
    isEnabled: jest.fn(() => enabled),
    ensureEnabledForGameplay: jest.fn(() => Promise.resolve()),
    toggle: jest.fn(() => Promise.resolve()),
    setPlaybackActive: jest.fn(),
    setGameSpeed: jest.fn(),
    dispose: jest.fn(),
    playStartSfx: jest.fn(),
    playEatSfx: jest.fn(),
    playCrashSfx: jest.fn()
  };
}

function createEngine(options = {}) {
  const renderer = createRendererMock({
    measuredBoardSize: options.measuredBoardSize ?? null
  });
  const audio = createAudioMock({ enabled: options.audioEnabled ?? true });
  const engine = new GameEngine({
    renderer,
    audio,
    sourceProvider: options.sourceProvider,
    sourceText: options.sourceText ?? buildSource()
  });

  return { engine, renderer, audio };
}

describe("GameEngine", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("reset initializes board, HUD, and ready message", () => {
    const { engine, renderer } = createEngine();

    engine.reset();

    expect(engine.state.running).toBe(false);
    expect(engine.state.gameOver).toBe(false);
    expect(engine.state.activeTargets.size).toBeGreaterThan(0);

    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.ready);
    expect(renderer.updateStatus).toHaveBeenCalled();
    expect(renderer.renderBoard).toHaveBeenCalled();

    const lastHud = renderer.updateStatus.mock.calls.at(-1)[0];
    expect(lastHud.targetChar.length).toBeGreaterThan(0);
    expect(lastHud.targetChar).toContain("{");
  });

  test("reset uses renderer-measured board size when available", () => {
    const { engine } = createEngine({ measuredBoardSize: { width: 40, height: 18 } });

    engine.reset();

    expect(engine.boardSize).toEqual({ width: 40, height: 18 });
    expect(engine.codeGrid.length).toBe(18);
    expect(engine.codeGrid[0].length).toBe(40);
  });

  test("uses custom source provider when supplied", () => {
    const sourceProvider = { nextSource: jest.fn(() => "{ provider-source }") };
    const { engine } = createEngine({ sourceProvider });

    engine.reset();

    expect(sourceProvider.nextSource).toHaveBeenCalled();
    expect(engine.currentSourceText).toContain("provider-source");
  });

  test("start begins loop and triggers start SFX", () => {
    const { engine, audio, renderer } = createEngine();
    engine.reset();

    engine.start();

    expect(engine.state.running).toBe(true);
    expect(audio.setPlaybackActive).toHaveBeenCalledWith(true);
    expect(audio.setGameSpeed).toHaveBeenCalledWith(engine.state.speed);
    expect(audio.playStartSfx).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    expect(renderer.setMessage.mock.calls.at(-1)[0]).toMatch(/^Corrupt/);
  });

  test("stopLoop clears the active loop interval", () => {
    const { engine } = createEngine();
    engine.reset();
    engine.start();
    expect(engine.interval).not.toBeNull();

    engine.stopLoop();
    expect(engine.interval).toBeNull();
  });

  test("start asks audio engine to enable when currently disabled", () => {
    const { engine, audio } = createEngine({ audioEnabled: false });
    engine.reset();

    engine.start();

    expect(audio.ensureEnabledForGameplay).toHaveBeenCalledTimes(1);
  });

  test("setDirection queues rapid turns and blocks reversals", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.setDirection(-1, 0);
    expect(engine.state.directionQueue).toEqual([]);

    engine.setDirection(0, -1);
    engine.setDirection(-1, 0);
    expect(engine.state.directionQueue).toEqual([{ x: 0, y: -1 }, { x: -1, y: 0 }]);

    engine.setDirection(1, 0);
    expect(engine.state.directionQueue).toEqual([{ x: 0, y: -1 }, { x: -1, y: 0 }]);
  });

  test("tick ends the game on wall collision", () => {
    const { engine, audio, renderer } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: -1, y: 0 };
    engine.state.queuedDirection = { x: -1, y: 0 };
    engine.state.snake = [{ x: 0, y: 0 }];

    engine.tick();

    expect(engine.state.gameOver).toBe(true);
    expect(audio.setPlaybackActive).toHaveBeenCalledWith(false);
    expect(audio.playCrashSfx).toHaveBeenCalledTimes(1);
    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.crash);
  });

  test("tick ends the game on self-collision", () => {
    const { engine, audio } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.queuedDirection = { x: 1, y: 0 };
    engine.state.snake = [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 }
    ];

    engine.tick();

    expect(engine.state.gameOver).toBe(true);
    expect(audio.setPlaybackActive).toHaveBeenCalledWith(false);
    expect(audio.playCrashSfx).toHaveBeenCalledTimes(1);
  });

  test("tick consumes target cells and updates progression state", () => {
    const { engine, audio, renderer } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.queuedDirection = { x: 1, y: 0 };
    engine.state.snake = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
    engine.state.activeTargets = new Set([cellKey(2, 1)]);

    const oldScore = engine.state.score;
    const oldLength = engine.state.snake.length;

    engine.tick();

    expect(engine.state.eaten.has(cellKey(2, 1))).toBe(true);
    expect(engine.state.corruptedChars.has(cellKey(2, 1))).toBe(true);
    expect(engine.state.eatenCount).toBe(1);
    expect(engine.state.eatenThisTarget).toBeGreaterThanOrEqual(0);
    expect(engine.state.score).toBeGreaterThan(oldScore);
    expect(engine.state.speed).toBeGreaterThan(1);
    expect(engine.state.snake.length).toBe(oldLength + 1);

    expect(audio.setGameSpeed).toHaveBeenCalledWith(engine.state.speed);
    expect(renderer.triggerGlitch).toHaveBeenCalledTimes(1);
    expect(audio.playEatSfx).toHaveBeenCalledTimes(1);
  });

  test("tick decrements growth on empty movement and keeps tail length", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.directionQueue = [];
    engine.state.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    engine.state.activeTargets = new Set();
    engine.state.growth = 1;

    const beforeLength = engine.state.snake.length;
    engine.tick();

    expect(engine.state.growth).toBe(0);
    expect(engine.state.snake.length).toBe(beforeLength + 1);
  });

  test("tick pops tail on empty movement when no growth remains", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.directionQueue = [];
    engine.state.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    engine.state.activeTargets = new Set();
    engine.state.growth = 0;

    const beforeLength = engine.state.snake.length;
    engine.tick();

    expect(engine.state.snake.length).toBe(beforeLength);
  });

  test("consuming the final quota target rotates to the next target set", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.directionQueue = [];
    engine.state.snake = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
    engine.state.activeTargets = new Set([cellKey(2, 1)]);
    engine.state.targetQuota = 1;
    engine.state.eatenThisTarget = 0;
    const previousTarget = engine.state.currentTargetIndex;

    engine.tick();

    expect(engine.state.currentTargetIndex).not.toBe(previousTarget);
    expect(engine.state.eatenThisTarget).toBe(0);
  });

  test("pickNextTargets reports full corruption when no targets remain", () => {
    const { engine, renderer } = createEngine({ sourceText: "{" });
    engine.reset();

    engine.state.eaten.add("0,0");
    engine.state.activeTargets.clear();

    const found = engine.pickNextTargets();

    expect(found).toBe(false);
    expect(engine.state.gameOver).toBe(true);
    expect(engine.state.won).toBe(true);
    expect(engine.audio.setPlaybackActive).toHaveBeenCalledWith(false);
    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.fullCorruptionReset);
  });

  test("hazard collision ends game with hazard-specific message", () => {
    const { engine, renderer } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.directionQueue = [];
    engine.state.snake = [{ x: 2, y: 2 }];
    engine.state.hazardCells = new Set([cellKey(3, 2)]);

    engine.tick();

    expect(engine.state.gameOver).toBe(true);
    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.hazardCrash);
  });

  test("collision with corrupted code ends game with corruption-specific message", () => {
    const { engine, renderer } = createEngine();
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: 1, y: 0 };
    engine.state.directionQueue = [];
    engine.state.snake = [{ x: 4, y: 4 }];
    engine.state.eaten = new Set([cellKey(5, 4)]);
    engine.state.corruptedChars.set(cellKey(5, 4), "#");

    engine.tick();

    expect(engine.state.gameOver).toBe(true);
    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.corruptionCrash);
  });

  test("refreshHazards creates avoid cells as progression increases", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.eatenCount = HAZARDS.unlockAtEaten + HAZARDS.growthStep * 2;
    engine.state.activeTargets = new Set();
    engine.state.hazardCells = new Set(["0,0"]);
    engine.state.snake = [{ x: 10, y: 10 }];

    engine.refreshHazards(true);

    expect(engine.state.activeHazardChars.length).toBeGreaterThan(0);
    expect(engine.state.hazardCells.size).toBeGreaterThan(0);
  });

  test("refreshHazards clears existing hazards when below unlock threshold", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.eatenCount = 0;
    engine.state.hazardCells = new Set(["1,1", "2,2"]);
    engine.state.activeHazardChars = [":", "."];

    engine.refreshHazards();

    expect(engine.state.hazardCells.size).toBe(0);
    expect(engine.state.activeHazardChars).toEqual([]);
  });

  test("label helpers handle empty and populated states", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.state.activeTargetChars = [];
    engine.state.currentTargetIndex = 0;
    expect(engine.currentTargetLabel()).toBe("{");

    engine.state.activeHazardChars = [];
    expect(engine.currentAvoidLabel()).toBe("-");

    engine.state.activeTargetChars = ["{", "}", ";"];
    engine.state.activeHazardChars = [":", "."];
    expect(engine.currentTargetLabel()).toBe("{ } ;");
    expect(engine.currentAvoidLabel()).toBe(": .");
  });

  test("tick keeps full-corruption message when terminal state happens mid-tick", () => {
    const { engine, renderer } = createEngine({ sourceText: "{" });
    engine.reset();

    engine.state.running = true;
    engine.state.direction = { x: -1, y: 0 };
    engine.state.queuedDirection = { x: -1, y: 0 };
    engine.state.snake = [{ x: 1, y: 0 }];
    engine.state.activeTargets = new Set(["0,0"]);

    engine.tick();

    expect(engine.state.gameOver).toBe(true);
    expect(renderer.setMessage.mock.calls.at(-1)[0]).toBe(UI_TEXT.fullCorruptionReset);
  });

  test("toggleAudio and dispose delegate to audio engine", () => {
    const { engine, audio } = createEngine();

    engine.toggleAudio();
    engine.dispose();

    expect(audio.toggle).toHaveBeenCalledTimes(1);
    expect(audio.dispose).toHaveBeenCalledTimes(1);
  });
});
