"use client";

type WakeWordCallback = () => void;

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class WakeWordListener {
  private recognition: any = null;
  private listening = false;
  private onWakeWordCallback: WakeWordCallback | null = null;
  private restartTimeout: any = null;

  start(onWakeWord: WakeWordCallback) {
    this.onWakeWordCallback = onWakeWord;
    if (this.listening) return;

    if (typeof window === "undefined") return;
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "pt-BR";

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const raw = (event.results[i][0]?.transcript || "").toLowerCase();
          const transcript = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Match flexible variations: "assistente", "ei assistente", "oi assistente", "ok assistente", "ei rota"
          if (
            /\b(ei|hey|ok|oi|e ai|ola)?\s*(assistente|rota)\b/i.test(transcript) ||
            transcript.includes("assistente") ||
            transcript.includes("rota")
          ) {
            this.stop();
            this.onWakeWordCallback?.();
            break;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          // Permission denied or browser policy blocked background speech recognition
          this.listening = false;
          return;
        }
        if (this.listening) {
          this.scheduleRestart();
        }
      };

      this.recognition.onend = () => {
        if (this.listening) {
          this.scheduleRestart();
        }
      };

      this.listening = true;
      this.recognition.start();
    } catch {
      this.listening = false;
    }
  }

  private scheduleRestart() {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.listening && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // ignore invalid state
        }
      }
    }, 400);
  }

  stop() {
    this.listening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }
}

export const wakeWordListener = new WakeWordListener();
