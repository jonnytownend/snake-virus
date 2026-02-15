export function bindInput({ onDirection, onStart, onToggleAudio }) {
  const handler = (event) => {
    const key = event.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
      event.preventDefault();
      onDirection(0, -1);
    }

    if (key === "arrowdown" || key === "s") {
      event.preventDefault();
      onDirection(0, 1);
    }

    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      onDirection(-1, 0);
    }

    if (key === "arrowright" || key === "d") {
      event.preventDefault();
      onDirection(1, 0);
    }

    if (key === " " || key === "enter") {
      event.preventDefault();
      onStart();
    }

    if (key === "m") {
      event.preventDefault();
      onToggleAudio();
    }
  };

  document.addEventListener("keydown", handler);

  return () => {
    document.removeEventListener("keydown", handler);
  };
}
