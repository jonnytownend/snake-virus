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

  measureBoardSize() {
    const editor = this.elements.editor;
    if (!editor) return null;

    const computed = getComputedStyle(editor);
    const paddingX = Number.parseFloat(computed.paddingLeft) + Number.parseFloat(computed.paddingRight);
    const paddingY = Number.parseFloat(computed.paddingTop) + Number.parseFloat(computed.paddingBottom);

    const probe = document.createElement("span");
    probe.className = "cell";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.textContent = "M";
    editor.appendChild(probe);
    const charRect = probe.getBoundingClientRect();
    editor.removeChild(probe);

    const charWidth = Math.max(1, Math.ceil(charRect.width));
    const lineHeight = Math.max(
      1,
      Math.ceil(Number.parseFloat(computed.lineHeight) || charRect.height)
    );

    const gutterWidth = 42;
    const usableWidth = Math.max(0, editor.clientWidth - paddingX - gutterWidth);
    const usableHeight = Math.max(0, editor.clientHeight - paddingY);
    return {
      width: Math.max(24, Math.floor(usableWidth / charWidth)),
      height: Math.max(12, Math.floor(usableHeight / lineHeight))
    };
  }

  updateStatus({ score, stage, targetChar, avoidChars, eaten, speed, audioEnabled }) {
    this.elements.score.textContent = String(score);
    this.elements.stage.textContent = String(stage);
    this.elements.targetChar.textContent = targetChar;
    this.elements.avoidChars.textContent = avoidChars;
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

  updatePlayers(players, localPlayerId = null) {
    const list = this.elements.playersList;
    if (!list) return;

    if (!players || players.length === 0) {
      list.innerHTML = '<li class="players-empty">No players yet.</li>';
      return;
    }

    const sorted = players
      .slice()
      .sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        return (a.name || "").localeCompare(b.name || "");
      });

    list.innerHTML = sorted
      .map((player) => {
        const safeName = this.escapeHtml(player.name || "anonymous");
        const label = player.id === localPlayerId ? `${safeName} (you)` : safeName;
        const className = player.id === localPlayerId ? "local-player" : "";
        const score = Number(player.score) || 0;
        return `<li class="${className}"><span>${label}</span><span>${score}</span></li>`;
      })
      .join("");
  }

  triggerGlitch() {
    this.elements.app.classList.remove("glitch");
    void this.elements.app.offsetWidth;
    this.elements.app.classList.add("glitch");
    setTimeout(() => this.elements.app.classList.remove("glitch"), 130);
  }

  renderBoard({
    codeGrid,
    styleGrid,
    eaten,
    corruptedChars,
    activeTargets,
    hazardCells,
    remotePlayers = [],
    snake,
    gameOver,
    won
  }) {
    const snakeSet = new Set(snake.map((segment) => cellKey(segment.x, segment.y)));
    const remoteSnakeSet = new Set();
    const remoteHeadSet = new Set();

    for (const player of remotePlayers) {
      if (!player || !Array.isArray(player.snake)) continue;
      for (let i = 0; i < player.snake.length; i += 1) {
        const segment = player.snake[i];
        const key = cellKey(segment.x, segment.y);
        remoteSnakeSet.add(key);
        if (i === 0) remoteHeadSet.add(key);
      }
    }

    const headKey = snake[0] ? cellKey(snake[0].x, snake[0].y) : "";

    const html = [];
    for (let y = 0; y < codeGrid.length; y += 1) {
      html.push(`<span class="line"><span class="ln">${String(y + 1).padStart(2, "0")}</span>`);

      for (let x = 0; x < codeGrid[y].length; x += 1) {
        const key = cellKey(x, y);
        let char = codeGrid[y][x];
        let className = `cell ${styleGrid[y][x]}`;

        if (eaten.has(key)) {
          char = corruptedChars.get(key) || "#";
          className += " corrupted";
        } else if (hazardCells.has(key)) {
          className += " hazard";
        } else if (activeTargets.has(key)) {
          className += " target";
        }

        if (snakeSet.has(key)) className += " virus";
        if (!snakeSet.has(key) && remoteSnakeSet.has(key)) className += " other-virus";
        if (!snakeSet.has(key) && remoteHeadSet.has(key)) className += " other-head";
        if (key === headKey) className += " head";
        if (gameOver && !won && key === headKey) className += " dead";

        html.push(`<span class="${className}">${cellContent(char)}</span>`);
      }

      html.push("</span>");
    }

    this.elements.editor.innerHTML = html.join("");
  }

  escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
