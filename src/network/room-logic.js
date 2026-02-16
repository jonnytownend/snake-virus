export const MAX_PLAYERS_PER_ROOM = 5;

export function normalizePlayerName(input) {
  const cleaned = String(input || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";
  return cleaned.slice(0, 20);
}

function normalizeTimestamp(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

export function chooseRoomForJoin(rooms, maxPlayers = MAX_PLAYERS_PER_ROOM) {
  const eligible = rooms
    .filter((room) => Number(room.activeCount) < maxPlayers)
    .sort((a, b) => {
      const countDelta = Number(a.activeCount) - Number(b.activeCount);
      if (countDelta !== 0) return countDelta;
      return normalizeTimestamp(a.updatedAt) - normalizeTimestamp(b.updatedAt);
    });

  return eligible[0] || null;
}

export function normalizeRoomPlayers(players) {
  return players
    .filter((player) => player && player.status !== "left")
    .map((player) => ({
      id: player.id,
      name: normalizePlayerName(player.name) || "anonymous",
      score: Number(player.score) || 0,
      stage: Number(player.stage) || 1,
      gameOver: Boolean(player.gameOver),
      snake: Array.isArray(player.snake) ? player.snake : []
    }));
}

export function getRemoteSnakePlayers(players, localPlayerId) {
  return normalizeRoomPlayers(players)
    .filter((player) => player.id !== localPlayerId)
    .filter((player) => !player.gameOver)
    .filter((player) => player.snake.length > 0);
}
