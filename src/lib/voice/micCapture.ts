import { float32ToPCM16Resampled, arrayBufferToBase64 } from "./pcmUtils";
import { voiceLog } from "./logger";

/**
 * Captures microphone audio and streams it as base64 PCM16 chunks via
 * onChunk, for continuous send over the Gemini Live API WebSocket.
 *
 * Unlike the old MediaRecorder+VAD pipeline, there's no local silence
 * detection here — Gemini's server-side automaticActivityDetection handles
 * turn-taking. This class only captures and forwards raw audio.
 */
export class MicCapture {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private running = false;

  async start(onChunk: (base64Pcm: string) => void): Promise<void> {
    if (this.running) return;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioCtx();
    if (this.audioContext.state === "suspended") await this.audioContext.resume();

    const sampleRate = this.audioContext.sampleRate;

    await this.audioContext.audioWorklet.addModule("/audio-worklets/capture-processor.js");
    this.workletNode = new AudioWorkletNode(this.audioContext, "capture-processor");
    this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.running) return;
      const pcm = float32ToPCM16Resampled(event.data, sampleRate);
      onChunk(arrayBufferToBase64(pcm));
    };

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.workletNode);

    this.running = true;
    voiceLog("mic capture started");
  }

  stop(): void {
    this.running = false;
    this.source?.disconnect();
    this.source = null;
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.audioContext?.close().catch(() => {});
    this.audioContext = null;
    voiceLog("mic capture stopped");
  }

  get isRunning(): boolean {
    return this.running;
  }
}
