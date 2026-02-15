export class AudioEngine {
  constructor(onStatusChange = () => {}) {
    this.onStatusChange = onStatusChange;
    this.enabled = false;
    this.playbackActive = false;
    this.speedMultiplier = 1;
    this.audioCtx = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.notifyStatus();
  }

  isEnabled() {
    return this.enabled;
  }

  async toggle() {
    if (this.enabled) {
      this.disable();
      return;
    }

    await this.enable(true);
  }

  async ensureEnabledForGameplay() {
    if (this.enabled) return;
    await this.enable(false);
  }

  setPlaybackActive(active) {
    this.playbackActive = active;
    if (this.playbackActive) {
      this.startMusic();
      return;
    }
    this.stopMusic();
  }

  setGameSpeed(multiplier) {
    this.speedMultiplier = Math.max(1, Number(multiplier) || 1);
    if (this.musicTimer) this.restartMusic();
  }

  playStartSfx() {
    this.playTone({ freq: this.noteToHz(64), duration: 0.06, type: "square", gain: 0.02 });
    this.playTone({
      freq: this.noteToHz(71),
      duration: 0.08,
      type: "square",
      gain: 0.02,
      when: 0.06
    });
  }

  playEatSfx() {
    this.playTone({ freq: this.noteToHz(76), duration: 0.07, type: "triangle", gain: 0.025 });
    this.playTone({
      freq: this.noteToHz(83),
      duration: 0.09,
      type: "triangle",
      gain: 0.018,
      when: 0.03
    });
  }

  playCrashSfx() {
    this.playTone({ freq: this.noteToHz(42), duration: 0.24, type: "sawtooth", gain: 0.03 });
  }

  dispose() {
    this.disable();
  }

  async enable(withToggleChime) {
    this.ensureContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.enabled = true;
    if (this.playbackActive) this.startMusic();

    if (withToggleChime) this.playStartSfx();
    this.notifyStatus();
  }

  disable() {
    this.enabled = false;
    this.stopMusic();
    this.notifyStatus();
  }

  notifyStatus() {
    this.onStatusChange(this.enabled);
  }

  ensureContext() {
    if (this.audioCtx) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    this.audioCtx = new AudioContextCtor();
  }

  noteToHz(midi) {
    return 440 * 2 ** ((midi - 69) / 12);
  }

  playTone({ freq, duration = 0.1, type = "square", gain = 0.04, when = 0 }) {
    if (!this.enabled || !this.audioCtx) return;

    const startTime = this.audioCtx.currentTime + when;
    const oscillator = this.audioCtx.createOscillator();
    const envelope = this.audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(gain, startTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(envelope);
    envelope.connect(this.audioCtx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  startMusic() {
    if (!this.enabled || !this.audioCtx || !this.playbackActive || this.musicTimer) return;

    const bass = [40, 40, 43, 45, 40, 40, 47, 45];
    const lead = [64, 67, 71, 69, 67, 64, 62, 59];
    const beatMs = Math.max(100, Math.round(260 / this.speedMultiplier));

    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      const index = this.musicStep % bass.length;
      this.playTone({
        freq: this.noteToHz(bass[index]),
        duration: 0.22,
        type: "triangle",
        gain: 0.015
      });
      this.playTone({
        freq: this.noteToHz(lead[index]),
        duration: 0.11,
        type: "square",
        gain: 0.011,
        when: 0.03
      });
      this.musicStep += 1;
    }, beatMs);
  }

  stopMusic() {
    if (!this.musicTimer) return;

    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  restartMusic() {
    if (!this.enabled || !this.playbackActive) return;
    this.stopMusic();
    this.startMusic();
  }
}
