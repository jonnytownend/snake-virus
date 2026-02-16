import { AudioEngine } from "./game/audio-engine.js";
import { GameEngine } from "./game/game-engine.js";
import { bindInput } from "./game/input-controller.js";
import { Renderer } from "./game/renderer.js";
import { SourceTextProvider } from "./game/source-text.js";
import { formatMultiplayerJoinError } from "./network/error-messages.js";
import { createFirebaseBackend } from "./network/firebase-backend.js";
import { MultiplayerSession } from "./network/multiplayer-session.js";

function requireElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: #${id}`);
  return element;
}

const elements = {
  app: requireElement("app"),
  editor: requireElement("editor"),
  score: requireElement("score"),
  stage: requireElement("stage"),
  targetChar: requireElement("targetChar"),
  avoidChars: requireElement("avoidChars"),
  eaten: requireElement("eaten"),
  speed: requireElement("speed"),
  audioStatus: requireElement("audioStatus"),
  message: requireElement("message"),
  playersList: requireElement("playersList")
};

const renderer = new Renderer(elements);
const audio = new AudioEngine((enabled) => renderer.updateAudioStatus(enabled));
const sourceProvider = new SourceTextProvider();
const game = new GameEngine({ renderer, audio, sourceProvider });
const introOverlay = requireElement("introOverlay");
const introStart = requireElement("introStart");
const playerNameInput = requireElement("playerName");
const introError = requireElement("introError");
const firebaseBackend = createFirebaseBackend();
const multiplayer = new MultiplayerSession({
  backend: firebaseBackend,
  onPlayersChanged: (players, localPlayerId) => {
    renderer.updatePlayers(players, localPlayerId);
    game.setRemotePlayers(multiplayer.getRemoteSnakePlayers());
  },
  onError: () => {
    renderer.setMessage("Multiplayer sync error. Try restarting the run.");
  }
});

let introVisible = true;
let joinInFlight = null;

function setIntroBusy(isBusy) {
  introStart.disabled = isBusy;
  introStart.textContent = isBusy
    ? "Connecting to Multiplayer..."
    : "Press Space or Click to Unleash";
}

function dismissIntro() {
  if (!introVisible) return;
  introVisible = false;
  introOverlay.classList.add("hidden");
}

function setIntroError(message) {
  introError.textContent = message || "";
}

async function ensureRoomJoin() {
  if (multiplayer.isJoined()) return true;
  if (joinInFlight) return joinInFlight;

  const name = playerNameInput.value.trim();
  if (!name) {
    setIntroError("Enter your operator name to begin.");
    playerNameInput.focus();
    return false;
  }

  setIntroBusy(true);
  setIntroError("Connecting to multiplayer...");

  joinInFlight = (async () => {
    try {
      await multiplayer.join(name);
      setIntroError("");
      return true;
    } catch (error) {
      console.error("Multiplayer join failed:", error);
      setIntroError(formatMultiplayerJoinError(error));
      playerNameInput.focus();
      return false;
    } finally {
      setIntroBusy(false);
      joinInFlight = null;
    }
  })();

  return joinInFlight;
}

async function startRun() {
  const joined = await ensureRoomJoin();
  if (!joined) return;
  dismissIntro();
  game.start();
  multiplayer.pushState(game.state);
}

const unbindInput = bindInput({
  onDirection: (x, y) => game.setDirection(x, y),
  onStart: () => void startRun(),
  onToggleAudio: () => game.toggleAudio()
});

introStart.addEventListener("click", () => void startRun());
playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void startRun();
  }
});

const syncTimer = setInterval(() => {
  multiplayer.pushState(game.state);
}, 120);

game.setOnGameOver((reason) => {
  multiplayer.pushState(game.state);
  if (reason === "player") {
    void multiplayer.leave("player-collision");
    game.setRemotePlayers([]);
  }
});

game.reset();
renderer.updatePlayers([], null);
setIntroBusy(false);
playerNameInput.focus();

window.addEventListener("beforeunload", () => {
  clearInterval(syncTimer);
  void multiplayer.leave("disconnect");
  unbindInput();
  game.dispose();
});
