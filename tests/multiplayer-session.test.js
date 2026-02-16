import { jest } from "@jest/globals";
import { MultiplayerSession } from "../src/network/multiplayer-session.js";

function createBackendMock() {
  let callback = () => {};
  return {
    joinRoom: jest.fn(async () => ({ roomId: "room-a", playerId: "player-a" })),
    leaveRoom: jest.fn(async () => {}),
    updatePlayerState: jest.fn(async () => {}),
    subscribeToRoomPlayers: jest.fn((roomId, onPlayers) => {
      callback = onPlayers;
      return () => {
        callback = () => {};
      };
    }),
    emit(players) {
      callback(players);
    }
  };
}

describe("MultiplayerSession", () => {
  test("requires non-empty player name on join", async () => {
    const backend = createBackendMock();
    const session = new MultiplayerSession({ backend });

    await expect(session.join("   ")).rejects.toThrow("Player name is required.");
  });

  test("join subscribes to players and exposes remote snakes", async () => {
    const backend = createBackendMock();
    const onPlayersChanged = jest.fn();
    const session = new MultiplayerSession({ backend, onPlayersChanged });

    await session.join("Alice");
    backend.emit([
      { id: "player-a", name: "Alice", score: 11, status: "active", snake: [{ x: 1, y: 1 }] },
      { id: "player-b", name: "Bob", score: 7, status: "active", snake: [{ x: 2, y: 2 }] }
    ]);

    expect(session.isJoined()).toBe(true);
    expect(onPlayersChanged).toHaveBeenCalled();
    expect(session.getRemoteSnakePlayers()).toEqual([
      {
        id: "player-b",
        name: "Bob",
        score: 7,
        stage: 1,
        gameOver: false,
        snake: [{ x: 2, y: 2 }]
      }
    ]);
  });

  test("pushState deduplicates unchanged payloads", async () => {
    const backend = createBackendMock();
    const session = new MultiplayerSession({ backend });

    await session.join("Alice");
    const state = {
      score: 12,
      stage: 2,
      running: true,
      gameOver: false,
      gameOverReason: null,
      snake: [{ x: 1, y: 1 }]
    };

    session.pushState(state);
    session.pushState(state);
    expect(backend.updatePlayerState).toHaveBeenCalledTimes(1);
  });

  test("leave clears local state and calls backend", async () => {
    const backend = createBackendMock();
    const onRoomChanged = jest.fn();
    const session = new MultiplayerSession({ backend, onRoomChanged });

    await session.join("Alice");
    await session.leave("disconnect");

    expect(session.isJoined()).toBe(false);
    expect(backend.leaveRoom).toHaveBeenCalledWith({
      roomId: "room-a",
      playerId: "player-a",
      reason: "disconnect"
    });
    expect(onRoomChanged).toHaveBeenLastCalledWith(null);
  });
});
