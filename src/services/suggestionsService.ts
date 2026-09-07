import { createClient } from "@/lib/supabase/client";

export interface SuggestLocalPayload {
  nome: string;
  endereco: string | null;
  latitude: number;
  longitude: number;
}

export interface SuggestLocalResult {
  /** "criado" = new suggestion inserted; "apoiado" = matched an existing
   * nearby suggestion and its support counter was incremented instead. */
  action: "criado" | "apoiado";
  apoios: number;
}

/**
 * Sends a new location suggestion (or bumps the support counter of an
 * existing nearby one) via the `suggest_local` RPC. This table has no
 * SELECT/INSERT policy for anon/authenticated — the RPC (SECURITY DEFINER)
 * is the only write path, and requires a real authenticated session
 * (auth.uid() must resolve; guest/anonymous sessions are rejected
 * server-side with "not_authenticated").
 */
export async function suggestLocal(payload: SuggestLocalPayload): Promise<SuggestLocalResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("suggest_local", {
    p_nome: payload.nome.trim(),
    p_endereco: payload.endereco && payload.endereco.trim() ? payload.endereco.trim() : null,
    p_latitude: payload.latitude,
    p_longitude: payload.longitude,
  });
  if (error) {
    if (/not_authenticated/i.test(error.message)) {
      throw new Error("Entre na sua conta para sugerir um local.");
    }
    if (/invalid_nome/i.test(error.message)) {
      throw new Error("Informe um nome para o local.");
    }
    if (/invalid_coords/i.test(error.message)) {
      throw new Error("Selecione um endereço válido na busca antes de enviar.");
    }
    throw error;
  }
  return data as SuggestLocalResult;
}
