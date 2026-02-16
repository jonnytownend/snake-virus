import {
  MAX_PLAYERS_PER_ROOM,
  getRemoteSnakePlayers,
  normalizePlayerName,
  normalizeRoomPlayers
} from "./room-logic.js";

function stateSignature(payload) {
  return JSON.stringify(payload);
}

export class MultiplayerSession {
  constructor({
    backend,
    maxPlayers = MAX_PLAYERS_PER_ROOM,
    onPlayersChanged = () => {},
    onRoomChanged = () => {},
    onError = () => {}
  }) {
    this.backend = backend;
    this.maxPlayers = maxPlayers;
    this.onPlayersChanged = onPlayersChanged;
    this.onRoomChanged = onRoomChanged;
    this.onError = onError;

    this.roomId = null;
    this.playerId = null;
    this.playerName = "";
    this.players = [];
    this.unsubscribePlayers = null;
    this.lastStateSig = "";
  }

  isJoined() {
    return Boolean(this.roomId && this.playerId);
  }

  getRoomId() {
    return this.roomId;
  }

  getPlayerId() {
    return this.playerId;
  }

  getPlayers() {
    return this.players.slice();
  }

  getRemoteSnakePlayers() {
    return getRemoteSnakePlayers(this.players, this.playerId);
  }

  async join(rawName) {
    const name = normalizePlayerName(rawName);
    if (!name) throw new Error("Player name is required.");
    if (!this.backend) throw new Error("Multiplayer backend is not configured.");
    if (this.isJoined()) return { roomId: this.roomId, playerId: this.playerId };

    const joined = await this.backend.joinRoom({
      name,
      maxPlayers: this.maxPlayers
    });

    this.roomId = joined.roomId;
    this.playerId = joined.playerId;
    this.playerName = name;
    this.lastStateSig = "";

    this.unsubscribePlayers = this.backend.subscribeToRoomPlayers(this.roomId, (players) => {
      this.players = normalizeRoomPlayers(players);
      this.onPlayersChanged(this.players, this.playerId, this.roomId);
    });

    this.onRoomChanged(this.roomId);
    return { roomId: this.roomId, playerId: this.playerId };
  }

  async leave(reason = "left") {
    if (!this.isJoined()) return;

    const roomId = this.roomId;
    const playerId = this.playerId;

    if (typeof this.unsubscribePlayers === "function") {
      this.unsubscribePlayers();
      this.unsubscribePlayers = null;
    }

    this.roomId = null;
    this.playerId = null;
    this.players = [];
    this.lastStateSig = "";
    this.onPlayersChanged([], null, null);
    this.onRoomChanged(null);

    try {
      await this.backend.leaveRoom({ roomId, playerId, reason });
    } catch (error) {
      this.onError(error);
    }
  }

  pushState(state) {
    if (!this.isJoined()) return;

    const running = Boolean(state.running) && !state.gameOver;
    const payload = {
      name: this.playerName,
      score: Number(state.score) || 0,
      stage: Number(state.stage) || 1,
      gameOver: Boolean(state.gameOver),
      gameOverReason: state.gameOverReason || null,
      running,
      snake: running && Array.isArray(state.snake) ? state.snake : []
    };

    const sig = stateSignature(payload);
    if (sig === this.lastStateSig) return;
    this.lastStateSig = sig;

    this.backend
      .updatePlayerState({
        roomId: this.roomId,
        playerId: this.playerId,
        payload
      })
      .catch((error) => this.onError(error));
  }
}
