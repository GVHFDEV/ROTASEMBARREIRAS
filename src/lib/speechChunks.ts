/**
 * Splits text into short chunks for SpeechSynthesis. Chrome has a known
 * bug where utterances longer than ~15s of speech get silently cut off
 * mid-sentence. Splitting by sentence, then hard-capping any sentence
 * that's still too long, keeps every individual utterance well under
 * that limit — cuts always land at a sentence or phrase boundary, not
 * mid-word.
 *
 * ~180 chars ≈ 10-12s at rate 1 for pt-BR average speech pace — safe
 * margin under the 15s cutoff even at slower rates.
 */
const MAX_CHUNK_LENGTH = 180;

export function splitIntoSpeechChunks(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Split on sentence-ending punctuation, keeping the punctuation attached.
  const sentenceMatches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];

  const chunks: string[] = [];
  for (const raw of sentenceMatches) {
    const sentence = raw.trim();
    if (!sentence) continue;

    if (sentence.length <= MAX_CHUNK_LENGTH) {
      chunks.push(sentence);
      continue;
    }

    // Sentence itself too long (common in "História" free text) — split
    // by words, packing as many as fit under the limit per chunk.
    const words = sentence.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > MAX_CHUNK_LENGTH && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}
