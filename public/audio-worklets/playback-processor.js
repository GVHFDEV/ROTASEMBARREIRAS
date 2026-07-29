/**
 * AudioWorklet processor — plays back Gemini's streamed PCM audio output.
 * Queues Float32Array buffers pushed from the main thread and drains them
 * sample-by-sample into the render quotum. Uses an offset tracker instead
 * of slice() to avoid allocations on the real-time audio thread.
 *
 * Supports an "interrupt" message to instantly clear the queue — this is
 * what makes barge-in (user starts talking while the model is still
 * speaking) feel immediate instead of waiting for the current buffer to
 * finish draining.
 */
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;
    // Tracks whether the queue has had data since the last drain
    // notification, so we only ever post "drain" on a real empty-after-
    // having-content transition (not on startup silence).
    this.hadData = false;

    this.port.onmessage = (event) => {
      if (event.data === "interrupt") {
        this.queue = [];
        this.offset = 0;
        this.hadData = false;
      } else if (event.data instanceof Float32Array) {
        this.queue.push(event.data);
        this.hadData = true;
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    const channel = output[0];
    let i = 0;

    while (i < channel.length && this.queue.length > 0) {
      const current = this.queue[0];
      if (!current || current.length === 0) {
        this.queue.shift();
        this.offset = 0;
        continue;
      }
      const remainingOut = channel.length - i;
      const remainingBuf = current.length - this.offset;
      const n = Math.min(remainingOut, remainingBuf);
      for (let j = 0; j < n; j++) {
        channel[i++] = current[this.offset++];
      }
      if (this.offset >= current.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }

    while (i < channel.length) channel[i++] = 0;

    if (this.hadData && this.queue.length === 0) {
      this.hadData = false;
      this.port.postMessage({ type: "drain" });
    }

    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
