/**
 * AudioWorklet processor — captures raw mic frames for the Gemini Live
 * API. Runs on the audio render thread (not main thread), so it can't
 * block on network/UI work. Buffers samples into fixed-size chunks and
 * posts them to the main thread, which handles PCM16 conversion,
 * base64 encoding, and the WebSocket send.
 *
 * 512 samples @ 16kHz ≈ 32ms per chunk — within Gemini's recommended
 * 20-40ms realtime audio chunk window.
 */
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 512;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channel = input[0];
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.bufferIndex++] = channel[i];
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
