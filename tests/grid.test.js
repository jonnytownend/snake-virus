import {
  buildCodeGrid,
  cellKey,
  collectTargetCandidates,
  inBounds,
  shuffled
} from "../src/game/grid.js";

describe("grid utilities", () => {
  test("buildCodeGrid pads and truncates lines to requested dimensions", () => {
    const grid = buildCodeGrid("abc\nlonger-than-width\n", 5, 3);

    expect(grid).toEqual([
      ["a", "b", "c", " ", " "],
      ["l", "o", "n", "g", "e"],
      [" ", " ", " ", " ", " "]
    ]);
  });

  test("cellKey creates stable key strings", () => {
    expect(cellKey(10, 4)).toBe("10,4");
  });

  test("inBounds checks coordinates correctly", () => {
    expect(inBounds(0, 0, 3, 3)).toBe(true);
    expect(inBounds(2, 2, 3, 3)).toBe(true);
    expect(inBounds(-1, 0, 3, 3)).toBe(false);
    expect(inBounds(0, 3, 3, 3)).toBe(false);
    expect(inBounds(3, 0, 3, 3)).toBe(false);
  });

  test("shuffled returns a new array with same values", () => {
    const input = ["a", "b", "c", "d"];
    const result = shuffled(input);

    expect(result).not.toBe(input);
    expect(result.slice().sort()).toEqual(input.slice().sort());
  });

  test("collectTargetCandidates returns only non-eaten matches", () => {
    const grid = [
      ["{", "x", "{"],
      ["}", "{", "y"]
    ];
    const eaten = new Set(["2,0"]);

    expect(collectTargetCandidates(grid, "{", eaten).sort()).toEqual(["0,0", "1,1"]);
    expect(collectTargetCandidates(grid, "}", eaten)).toEqual(["0,1"]);
  });
});
