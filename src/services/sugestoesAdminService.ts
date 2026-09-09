import { createClient } from "@/lib/supabase/client";
import type { SugestaoLocalRow } from "@/types/database";

/**
 * Admin-only access to the "Sugerir um local" triage queue
 * (public.sugestoes_locais). Reads/writes here rely entirely on the
 * `sugestoes_locais_*_admin` RLS policies (see
 * supabase/migrations_admin.sql) — a non-admin caller gets an empty
 * result on select and a row-level security error on update/delete.
 */

/** Pending suggestions, most-supported first (apoios desc), then oldest
 * first — surfaces the most-requested/oldest-waiting items at the top of
 * the queue. */
export async function fetchPendingSugestoes(): Promise<SugestaoLocalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sugestoes_locais")
    .select("*")
    .eq("status", "pendente")
    .order("apoios", { ascending: false })
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data as SugestaoLocalRow[]) ?? [];
}

/** Marks a suggestion as approved. Does NOT auto-create the corresponding
 * `pontos` row — an admin still cadastra o ponto normalmente em
 * /admin/pontos (endereço + geocoding Photon), usando os dados da sugestão
 * como referência. This just removes it from the pending queue. */
export async function approveSugestao(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sugestoes_locais").update({ status: "aprovado" }).eq("id", id);
  if (error) throw error;
}

/** Marks a suggestion as rejected — removed from the pending queue,
 * kept in the table for audit/history instead of being deleted. */
export async function rejectSugestao(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("sugestoes_locais").update({ status: "rejeitado" }).eq("id", id);
  if (error) throw error;
}
