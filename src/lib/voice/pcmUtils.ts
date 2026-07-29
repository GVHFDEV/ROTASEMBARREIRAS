/**
 * Raw PCM16 <-> base64 <-> Float32 conversion helpers shared by the mic
 * capture and audio playback paths. Gemini Live API requires:
 *   - input: raw 16-bit PCM, 16kHz, little-endian, base64-encoded
 *   - output: raw 16-bit PCM, 24kHz, little-endian, base64-encoded
 * AudioWorklets/Web Audio work in Float32 internally, so every chunk
 * crosses this boundary once per direction.
 */

/** Float32 [-1, 1] samples -> Int16 PCM little-endian ArrayBuffer. */
export function float32ToPCM16(float32: Float32Array): ArrayBuffer {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return int16.buffer;
}

/** Converts Float32Array at inputSampleRate -> Int16 PCM at 16000Hz (universal iOS/Android resampler). */
export function float32ToPCM16Resampled(
  float32: Float32Array,
  inputSampleRate: number
): ArrayBuffer {
  if (inputSampleRate === 16000) {
    return float32ToPCM16(float32);
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.floor(float32.length / ratio);
  const int16 = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const index1 = Math.floor(origIndex);
    const index2 = Math.min(index1 + 1, float32.length - 1);
    const weight = origIndex - index1;
    const sample = float32[index1] * (1 - weight) + float32[index2] * weight;
    const clamped = Math.max(-1, Math.min(1, sample));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return int16.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** base64 PCM16LE -> Float32 [-1, 1] samples, for Web Audio playback. */
export function base64PCM16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
  return float32;
}
