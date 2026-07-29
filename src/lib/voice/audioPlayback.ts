import { base64PCM16ToFloat32 } from "./pcmUtils";
import { voiceLog } from "./logger";

/**
 * Plays Gemini's streamed 24kHz PCM16 audio output through an AudioWorklet
 * queue. Exposes interrupt() for barge-in — clears whatever's queued the
 * instant the user starts talking again, instead of waiting for the
 * current chunk to finish.
 */
export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private initPromise: Promise<void> | null = null;
  /** Fired when the playback queue drains to empty after having content —
   * i.e. the model has genuinely finished speaking out loud. Distinct from
   * the Live API's turnComplete event, which fires as soon as generation
   * stops, well before the buffered audio has actually finished playing. */
  onDrain: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.workletNode) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      if (this.audioContext.state === "suspended") await this.audioContext.resume();

      await this.audioContext.audioWorklet.addModule("/audio-worklets/playback-processor.js");
      this.workletNode = new AudioWorkletNode(this.audioContext, "playback-processor");
      this.workletNode.connect(this.audioContext.destination);
      this.workletNode.port.onmessage = (event: MessageEvent<{ type: string }>) => {
        if (event.data?.type === "drain") this.onDrain?.();
      };
      voiceLog("audio playback initialized");
    })();

    return this.initPromise;
  }

  /** Queues a base64 PCM16 chunk for playback. Call init() first. */
  play(base64Pcm: string): void {
    if (!this.workletNode) return;
    const float32 = base64PCM16ToFloat32(base64Pcm);
    this.workletNode.port.postMessage(float32);
  }

  /** Clears the playback queue instantly — used on barge-in / interrupt. */
  interrupt(): void {
    this.workletNode?.port.postMessage("interrupt");
  }

  destroy(): void {
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.audioContext?.close().catch(() => {});
    this.audioContext = null;
    this.initPromise = null;
  }
}
