import { jest } from "@jest/globals";
import { UI_TEXT } from "../src/game/constants.js";
import { GameEngine } from "../src/game/game-engine.js";
import { cellKey } from "../src/game/grid.js";

function buildSource(lines = 30) {
  const row = "{ } ( ) [ ] ; = < > function run() { return 42; } // comment";
  return Array.from({ length: lines }, () => row).join("\n");
}

function createRendererMock() {
  return {
    updateStatus: jest.fn(),
    updateAudioStatus: jest.fn(),
    setMessage: jest.fn(),
    renderBoard: jest.fn(),
    triggerGlitch: jest.fn()
  };
}

function createAudioMock({ enabled = true } = {}) {
  return {
    isEnabled: jest.fn(() => enabled),
    ensureEnabledForGameplay: jest.fn(() => Promise.resolve()),
    toggle: jest.fn(() => Promise.resolve()),
    dispose: jest.fn(),
    playStartSfx: jest.fn(),
    playEatSfx: jest.fn(),
    playCrashSfx: jest.fn()
  };
}

function createEngine(options = {}) {
  const renderer = createRendererMock();
  const audio = createAudioMock({ enabled: options.audioEnabled ?? true });
  const engine = new GameEngine({
    renderer,
    audio,
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
    expect(lastHud.targetChar).toBe("{");
  });

  test("start begins loop and triggers start SFX", () => {
    const { engine, audio, renderer } = createEngine();
    engine.reset();

    engine.start();

    expect(engine.state.running).toBe(true);
    expect(audio.playStartSfx).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    expect(renderer.setMessage.mock.calls.at(-1)[0]).toMatch(/^Corrupt/);
  });

  test("start asks audio engine to enable when currently disabled", () => {
    const { engine, audio } = createEngine({ audioEnabled: false });
    engine.reset();

    engine.start();

    expect(audio.ensureEnabledForGameplay).toHaveBeenCalledTimes(1);
  });

  test("setDirection prevents direct 180-degree reversal", () => {
    const { engine } = createEngine();
    engine.reset();

    engine.setDirection(-1, 0);
    expect(engine.state.queuedDirection).toEqual({ x: 1, y: 0 });

    engine.setDirection(0, 1);
    expect(engine.state.queuedDirection).toEqual({ x: 0, y: 1 });
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
    expect(engine.state.eatenCount).toBe(1);
    expect(engine.state.eatenThisTarget).toBeGreaterThanOrEqual(0);
    expect(engine.state.score).toBeGreaterThan(oldScore);
    expect(engine.state.speed).toBeGreaterThan(1);
    expect(engine.state.snake.length).toBe(oldLength + 1);

    expect(renderer.triggerGlitch).toHaveBeenCalledTimes(1);
    expect(audio.playEatSfx).toHaveBeenCalledTimes(1);
  });

  test("pickNextTarget reports full corruption when no targets remain", () => {
    const { engine, renderer } = createEngine({ sourceText: "{" });
    engine.reset();

    engine.state.eaten.add("0,0");
    engine.state.activeTargets.clear();

    const found = engine.pickNextTarget();

    expect(found).toBe(false);
    expect(engine.state.gameOver).toBe(true);
    expect(engine.state.won).toBe(true);
    expect(renderer.setMessage).toHaveBeenCalledWith(UI_TEXT.fullCorruptionReset);
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
