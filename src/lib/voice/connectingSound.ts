"use client";

class ConnectingSound {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;

  start() {
    this.stop();
    try {
      const AudioCtx =
        typeof window !== "undefined"
          ? window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          : null;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }

      const playChime = () => {
        if (!this.ctx || this.ctx.state === "closed") return;
        try {
          const now = this.ctx.currentTime;

          // Soft ambient duo tone (A4 440Hz + E5 659.25Hz) - modern assistant chime
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";

          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(659.25, now + 0.07);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc1.stop(now + 0.45);
          osc2.start(now + 0.07);
          osc2.stop(now + 0.45);
        } catch {
          // ignore node errors
        }
      };

      playChime();
      this.intervalId = window.setInterval(playChime, 900);
    } catch {
      // AudioContext policy restrictions ignored
    }
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export const connectingSound = new ConnectingSound();
