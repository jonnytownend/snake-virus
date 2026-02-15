import { AudioEngine } from "./game/audio-engine.js";
import { GameEngine } from "./game/game-engine.js";
import { bindInput } from "./game/input-controller.js";
import { Renderer } from "./game/renderer.js";
import { SourceTextProvider } from "./game/source-text.js";

function requireElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: #${id}`);
  return element;
}

const elements = {
  app: requireElement("app"),
  editor: requireElement("editor"),
  score: requireElement("score"),
  targetChar: requireElement("targetChar"),
  avoidChars: requireElement("avoidChars"),
  eaten: requireElement("eaten"),
  speed: requireElement("speed"),
  audioStatus: requireElement("audioStatus"),
  message: requireElement("message")
};

const renderer = new Renderer(elements);
const audio = new AudioEngine((enabled) => renderer.updateAudioStatus(enabled));
const sourceProvider = new SourceTextProvider();
const game = new GameEngine({ renderer, audio, sourceProvider });

const unbindInput = bindInput({
  onDirection: (x, y) => game.setDirection(x, y),
  onStart: () => game.start(),
  onToggleAudio: () => game.toggleAudio()
});

game.reset();

window.addEventListener("beforeunload", () => {
  unbindInput();
  game.dispose();
});
