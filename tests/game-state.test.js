import { START_DIRECTION } from "../src/game/constants.js";
import { createInitialState } from "../src/game/game-state.js";

describe("createInitialState", () => {
  test("creates expected defaults and centered snake", () => {
    const state = createInitialState(20, 10);

    expect(state.score).toBe(0);
    expect(state.eatenCount).toBe(0);
    expect(state.speed).toBe(1);
    expect(state.running).toBe(false);
    expect(state.gameOver).toBe(false);
    expect(state.won).toBe(false);

    expect(state.direction).toEqual(START_DIRECTION);
    expect(state.queuedDirection).toEqual(START_DIRECTION);
    expect(state.directionQueue).toEqual([]);
    expect(state.snake).toEqual([
      { x: 9, y: 5 },
      { x: 8, y: 5 },
      { x: 7, y: 5 }
    ]);
  });

  test("returns fresh mutable collections per call", () => {
    const a = createInitialState(20, 10);
    const b = createInitialState(20, 10);

    a.eaten.add("1,1");
    a.activeTargets.add("2,2");
    a.direction.x = 999;

    expect(b.eaten.size).toBe(0);
    expect(b.activeTargets.size).toBe(0);
    expect(b.direction).toEqual(START_DIRECTION);
  });
});
