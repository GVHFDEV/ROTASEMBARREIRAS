/**
 * Toggleable voice-pipeline logger. Off by default in production — enable
 * by setting NEXT_PUBLIC_VOICE_DEBUG=true in .env.local. Keeps debug noise
 * out of prod consoles without deleting the instrumentation.
 */
const VOICE_DEBUG = process.env.NEXT_PUBLIC_VOICE_DEBUG === "true";

export function voiceLog(label: string, data?: unknown) {
  if (!VOICE_DEBUG) return;
  if (data !== undefined) {
    console.log(`[voice] ${label}`, data);
  } else {
    console.log(`[voice] ${label}`);
  }
}

export function voiceTimer(label: string): () => void {
  if (!VOICE_DEBUG) return () => {};
  const start = performance.now();
  return () => console.log(`[voice] ${label}: ${Math.round(performance.now() - start)}ms`);
}
