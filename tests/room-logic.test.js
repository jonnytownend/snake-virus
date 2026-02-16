import {
  chooseRoomForJoin,
  getRemoteSnakePlayers,
  normalizePlayerName,
  normalizeRoomPlayers
} from "../src/network/room-logic.js";

describe("room-logic", () => {
  test("normalizePlayerName trims, condenses whitespace, and truncates", () => {
    expect(normalizePlayerName("   ")).toBe("");
    expect(normalizePlayerName("  Alice   Bob  ")).toBe("Alice Bob");
    expect(normalizePlayerName("abcdefghijklmnopqrstuvwxyz")).toHaveLength(20);
  });

  test("chooseRoomForJoin picks least-populated eligible room", () => {
    const chosen = chooseRoomForJoin([
      { id: "room-1", activeCount: 4, updatedAt: 10 },
      { id: "room-2", activeCount: 1, updatedAt: 20 },
      { id: "room-3", activeCount: 3, updatedAt: 15 }
    ], 5);

    expect(chosen.id).toBe("room-2");
  });

  test("chooseRoomForJoin returns null when no room has capacity", () => {
    const chosen = chooseRoomForJoin([
      { id: "room-1", activeCount: 5 },
      { id: "room-2", activeCount: 8 }
    ], 5);

    expect(chosen).toBeNull();
  });

  test("normalizeRoomPlayers removes left players and coerces fields", () => {
    const players = normalizeRoomPlayers([
      { id: "1", name: " Alice ", score: "12", stage: "3", status: "active", snake: [{ x: 1, y: 1 }] },
      { id: "2", name: "Bob", score: 9, status: "left", snake: [{ x: 2, y: 2 }] },
      { id: "3", name: "", score: null, stage: null, status: "active", snake: "bad" }
    ]);

    expect(players).toEqual([
      {
        id: "1",
        name: "Alice",
        score: 12,
        stage: 3,
        gameOver: false,
        snake: [{ x: 1, y: 1 }]
      },
      {
        id: "3",
        name: "anonymous",
        score: 0,
        stage: 1,
        gameOver: false,
        snake: []
      }
    ]);
  });

  test("getRemoteSnakePlayers returns only non-local active snakes", () => {
    const remotes = getRemoteSnakePlayers([
      { id: "self", name: "Me", score: 5, gameOver: false, status: "active", snake: [{ x: 1, y: 1 }] },
      { id: "r1", name: "R1", score: 2, gameOver: false, status: "active", snake: [{ x: 2, y: 2 }] },
      { id: "r2", name: "R2", score: 2, gameOver: true, status: "active", snake: [{ x: 3, y: 3 }] },
      { id: "r3", name: "R3", score: 2, gameOver: false, status: "active", snake: [] }
    ], "self");

    expect(remotes).toEqual([
      {
        id: "r1",
        name: "R1",
        score: 2,
        stage: 1,
        gameOver: false,
        snake: [{ x: 2, y: 2 }]
      }
    ]);
  });
});
