import { createClient } from "@/lib/supabase/client";

export interface VoiceTokenResult {
  /** Ephemeral Gemini token — used as the access_token query param on the
   * Live API WebSocket. Short-lived and single-use (see voice-token Edge
   * Function for exact lifetimes). Never the real GEMINI_API_KEY. */
  token: string;
  /** Live API model this token is locked to. */
  model: string;
  /** ISO timestamp — after this, messages on the session are rejected. */
  expiresAt: string;
}

export class VoiceTokenError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const FUNCTION_NAME = "voice-token";

/**
 * Fetches a fresh ephemeral token from the Supabase Edge Function. Call
 * this right before opening a new Live API WebSocket session — the token's
 * newSessionExpireTime window is short (see server comment), so don't
 * fetch it far ahead of connecting.
 */
export async function fetchVoiceToken(userName?: string, signal?: AbortSignal): Promise<VoiceTokenResult> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new VoiceTokenError("Sessão inválida. Faça login novamente.", 401);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName }),
    signal,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new VoiceTokenError(body.error || "Erro ao iniciar sessão de voz.", response.status);
  }

  return body as VoiceTokenResult;
}
