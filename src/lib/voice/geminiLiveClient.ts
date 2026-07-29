import { voiceLog } from "./logger";

/** A function call the model wants executed, mirrors the Live API's
 * BidiGenerateContentToolCall.functionCalls[] shape (camelCase JSON). */
export interface LiveFunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LiveFunctionResponse {
  id: string;
  name: string;
  response: Record<string, unknown>;
}

export interface GeminiLiveCallbacks {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (message: string) => void;
  /** base64 PCM16 24kHz audio chunk from the model. */
  onAudioChunk?: (base64Pcm: string) => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  /** User started talking over the model — caller should stop playback
   * immediately (barge-in). */
  onInterrupted?: () => void;
  /** Model finished its turn (a natural point to resume listening state
   * in the UI, distinct from audio playback actually finishing). */
  onTurnComplete?: () => void;
  /** Model wants one or more app actions executed. Caller MUST eventually
   * call sendToolResponse with matching ids for every call here. */
  onToolCall?: (calls: LiveFunctionCall[]) => void;
  /** Server signaling imminent disconnect (token/session expiring). */
  onGoAway?: (timeLeftSeconds: number | null) => void;
}

const LIVE_API_HOST = "generativelanguage.googleapis.com";

/**
 * Thin client-to-server wrapper around the Gemini Live API WebSocket.
 * Connects directly from the browser using a short-lived ephemeral token
 * (never the real API key — see voiceTokenService.ts / voice-token Edge
 * Function). The token's bidiGenerateContentSetup is locked server-side,
 * so the `setup` message sent here is effectively just the handshake —
 * the model, system instruction, and tool declarations actually in effect
 * are whatever was baked into the token.
 */
export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks;
  private model: string;

  connected = false;

  constructor(model: string, callbacks: GeminiLiveCallbacks) {
    this.model = model;
    this.callbacks = callbacks;
  }

  connect(token: string): void {
    const url = `wss://${LIVE_API_HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;
    voiceLog("connecting to Live API");
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected = true;
      // Required handshake message. Its contents are ignored by the API
      // because the ephemeral token's bidiGenerateContentSetup is locked
      // (fieldMask empty + bidiGenerateContentSetup present on the token
      // -> the connection's own setup is discarded server-side), but the
      // protocol still requires a well-formed first message.
      this.sendRaw({ setup: { model: `models/${this.model}` } });
      voiceLog("Live API connected, setup sent");
      this.callbacks.onOpen?.();
    };

    this.ws.onclose = (event) => {
      this.connected = false;
      voiceLog("Live API closed", { code: event.code, reason: event.reason });
      this.callbacks.onClose?.(event);
    };

    this.ws.onerror = () => {
      this.callbacks.onError?.("Erro de conexão com o assistente de voz.");
    };

    this.ws.onmessage = (event: MessageEvent) => this.handleMessage(event);
  }

  disconnect(): void {
    this.connected = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      try {
        this.ws.close();
      } catch {
        // ignore — already closing/closed
      }
      this.ws = null;
    }
  }

  private sendRaw(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /** Streams one base64 PCM16 16kHz chunk of mic audio to the model. */
  sendAudioChunk(base64Pcm: string): void {
    this.sendRaw({
      realtimeInput: { audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" } },
    });
  }

  /** Sends a text message as a realtime input (used for the initial
   * greeting-less kickoff or manual text fallback, if ever needed). */
  sendText(text: string): void {
    this.sendRaw({ realtimeInput: { text } });
  }

  /** Responds to one or more pending tool calls. Every call from
   * onToolCall must eventually be answered here, matched by id. */
  sendToolResponse(responses: LiveFunctionResponse[]): void {
    this.sendRaw({ toolResponse: { functionResponses: responses } });
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    let raw: string;
    if (event.data instanceof Blob) {
      raw = await event.data.text();
    } else if (event.data instanceof ArrayBuffer) {
      raw = new TextDecoder().decode(event.data);
    } else {
      raw = event.data;
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("Live API: failed to parse message", err, raw);
      return;
    }

    if (data.setupComplete) {
      voiceLog("setupComplete received");
      return;
    }

    if (data.toolCall) {
      const toolCall = data.toolCall as { functionCalls?: Array<{ id: string; name: string; args?: Record<string, unknown> }> };
      const calls: LiveFunctionCall[] = (toolCall.functionCalls ?? []).map((fc) => ({
        id: fc.id,
        name: fc.name,
        args: fc.args ?? {},
      }));
      voiceLog("toolCall received", calls);
      this.callbacks.onToolCall?.(calls);
      return;
    }

    if (data.goAway) {
      const timeLeft = (data.goAway as { timeLeft?: string }).timeLeft;
      const seconds = timeLeft ? parseFloat(timeLeft) : null;
      voiceLog("goAway received", { timeLeft });
      this.callbacks.onGoAway?.(seconds);
      return;
    }

    const serverContent = data.serverContent as
      | {
          modelTurn?: { parts?: Array<{ inlineData?: { data: string }; text?: string }> };
          inputTranscription?: { text?: string };
          outputTranscription?: { text?: string };
          interrupted?: boolean;
          turnComplete?: boolean;
        }
      | undefined;
    if (!serverContent) return;

    const parts = serverContent.modelTurn?.parts;
    if (parts?.length) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          this.callbacks.onAudioChunk?.(part.inlineData.data);
        }
      }
    }

    if (serverContent.inputTranscription?.text) {
      this.callbacks.onInputTranscript?.(serverContent.inputTranscription.text);
    }
    if (serverContent.outputTranscription?.text) {
      this.callbacks.onOutputTranscript?.(serverContent.outputTranscription.text);
    }
    if (serverContent.interrupted) {
      voiceLog("interrupted (barge-in)");
      this.callbacks.onInterrupted?.();
    }
    if (serverContent.turnComplete) {
      this.callbacks.onTurnComplete?.();
    }
  }
}
