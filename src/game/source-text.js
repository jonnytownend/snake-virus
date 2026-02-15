export const SOURCE_TEXT = `/**
 * code-virus architecture sketch
 *
 * This game intentionally renders code as the map.
 * The player controls a virus moving through source lines.
 */

import { GameEngine } from "./game-engine";
import { Renderer } from "./renderer";
import { AudioEngine } from "./audio-engine";

const GRID = { width: 72, height: 30 };
const TARGET_SEQUENCE = ["{", "}", "(", ")", "[", "]", ";", "=", "<", ">"];

function bootstrap(documentRef) {
  const ui = {
    score: documentRef.getElementById("score"),
    target: documentRef.getElementById("targetChar"),
    corrupted: documentRef.getElementById("eaten"),
    speed: documentRef.getElementById("speed"),
    audio: documentRef.getElementById("audioStatus"),
    editor: documentRef.getElementById("editor")
  };

  const renderer = new Renderer(ui);
  const audio = new AudioEngine();
  const engine = new GameEngine({ renderer, audio, grid: GRID });

  engine.reset();
  engine.bindInput();

  return engine;
}

class VirusCell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function isInBounds(x, y, bounds) {
  return x >= 0 && y >= 0 && x < bounds.width && y < bounds.height;
}

function scoreDelta(length) {
  return 12 + length;
}

const palette = {
  keyword: "#6ed0ff",
  comment: "#637f99",
  string: "#f7a86e",
  number: "#79e6a4",
  target: "#ffd166"
};

export { bootstrap, isInBounds, scoreDelta, palette };`;
