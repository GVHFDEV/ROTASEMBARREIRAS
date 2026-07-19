"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { splitIntoSpeechChunks } from "@/lib/speechChunks";

export interface SpeechSegment {
  id: string;
  text: string;
}

export type SpeechStatus = "idle" | "playing" | "paused";

interface QueueItem {
  segmentId: string;
  text: string;
}

const RATE_STEPS = [0.75, 1, 1.25, 1.5] as const;

/**
 * Manual play/pause/stop reader over the browser's native SpeechSynthesis,
 * queuing many short utterances instead of one long one — Chrome has a
 * known bug that silently cuts speech after ~15s on a single utterance.
 * Splitting by sentence (splitIntoSpeechChunks) keeps every individual
 * utterance short, so the queue plays through long text without cutoff.
 *
 * Never auto-starts — caller must call play() from a user-initiated click.
 * All utterances force lang="pt-BR" explicitly.
 */
export function useSpeechReader() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [currentSegmentId, setCurrentSegmentId] = useState<string | null>(null);
  const [rate, setRateState] = useState<number>(1);

  const queueRef = useRef<QueueItem[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef(1);

  const speakFromIndex = useCallback((startIndex: number) => {
    const queue = queueRef.current;
    if (startIndex >= queue.length) {
      setStatus("idle");
      setCurrentSegmentId(null);
      indexRef.current = 0;
      return;
    }

    indexRef.current = startIndex;
    const item = queue[startIndex];
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = "pt-BR"; // forced explicitly on every utterance, per requirement
    utterance.rate = rateRef.current;

    utterance.onstart = () => {
      setCurrentSegmentId(item.segmentId);
    };
    utterance.onend = () => {
      speakFromIndex(startIndex + 1);
    };
    utterance.onerror = () => {
      // Skip a failed chunk rather than freezing the whole queue.
      speakFromIndex(startIndex + 1);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback(
    (segments: SpeechSegment[]) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      const queue: QueueItem[] = [];
      for (const segment of segments) {
        for (const chunk of splitIntoSpeechChunks(segment.text)) {
          queue.push({ segmentId: segment.id, text: chunk });
        }
      }
      queueRef.current = queue;
      setStatus("playing");
      speakFromIndex(0);
    },
    [speakFromIndex]
  );

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    queueRef.current = [];
    indexRef.current = 0;
    setStatus("idle");
    setCurrentSegmentId(null);
  }, []);

  // Changing rate mid-speech can't retroactively affect an in-flight
  // utterance — restart from the current chunk with the new rate applied.
  const setRate = useCallback(
    (newRate: number) => {
      rateRef.current = newRate;
      setRateState(newRate);
      if (status === "playing" || status === "paused") {
        const resumeIndex = indexRef.current;
        window.speechSynthesis.cancel();
        speakFromIndex(resumeIndex);
        setStatus("playing");
      }
    },
    [status, speakFromIndex]
  );

  const cycleRate = useCallback(
    (direction: "up" | "down") => {
      const currentIndex = RATE_STEPS.indexOf(rateRef.current as (typeof RATE_STEPS)[number]);
      const safeIndex = currentIndex === -1 ? 1 : currentIndex;
      const nextIndex =
        direction === "up" ? Math.min(safeIndex + 1, RATE_STEPS.length - 1) : Math.max(safeIndex - 1, 0);
      setRate(RATE_STEPS[nextIndex]);
    },
    [setRate]
  );

  // Never leave a stray utterance running after the component unmounts
  // (e.g. user navigates away from PointDetails mid-speech).
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    status,
    currentSegmentId,
    rate,
    rateSteps: RATE_STEPS,
    play,
    pause,
    resume,
    stop,
    cycleRate,
  };
}
