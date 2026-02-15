import { cellKey } from "./grid.js";

function cellContent(char) {
  if (char === " ") return "&nbsp;";
  if (char === "<") return "&lt;";
  if (char === ">") return "&gt;";
  if (char === "&") return "&amp;";
  return char;
}

export class Renderer {
  constructor(elements) {
    this.elements = elements;
  }

  updateStatus({ score, targetChar, eaten, speed, audioEnabled }) {
    this.elements.score.textContent = String(score);
    this.elements.targetChar.textContent = targetChar;
    this.elements.eaten.textContent = String(eaten);
    this.elements.speed.textContent = `${speed.toFixed(1)}x`;
    this.updateAudioStatus(audioEnabled);
  }

  updateAudioStatus(enabled) {
    this.elements.audioStatus.textContent = enabled ? "ON" : "OFF";
  }

  setMessage(message) {
    this.elements.message.textContent = message;
  }

  triggerGlitch() {
    this.elements.app.classList.remove("glitch");
    void this.elements.app.offsetWidth;
    this.elements.app.classList.add("glitch");
    setTimeout(() => this.elements.app.classList.remove("glitch"), 130);
  }

  renderBoard({ codeGrid, styleGrid, eaten, activeTargets, snake, gameOver, won }) {
    const snakeSet = new Set(snake.map((segment) => cellKey(segment.x, segment.y)));
    const headKey = snake[0] ? cellKey(snake[0].x, snake[0].y) : "";

    const html = [];
    for (let y = 0; y < codeGrid.length; y += 1) {
      html.push(`<span class="line"><span class="ln">${String(y + 1).padStart(2, "0")}</span>`);

      for (let x = 0; x < codeGrid[y].length; x += 1) {
        const key = cellKey(x, y);
        let char = codeGrid[y][x];
        let className = `cell ${styleGrid[y][x]}`;

        if (eaten.has(key)) {
          char = " ";
          className += " hole";
        } else if (activeTargets.has(key)) {
          className += " target";
        }

        if (snakeSet.has(key)) className += " virus";
        if (key === headKey) className += " head";
        if (gameOver && !won && key === headKey) className += " dead";

        html.push(`<span class="${className}">${cellContent(char)}</span>`);
      }

      html.push("</span>");
    }

    this.elements.editor.innerHTML = html.join("");
  }
}
