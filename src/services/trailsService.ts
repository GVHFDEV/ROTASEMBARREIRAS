import { createClient } from "@/lib/supabase/client";
import type { PontoRow, TrilhaRow } from "@/types/database";

export interface TrailPointNode {
  id: string;
  name: string;
  category: string;
  image: string;
  coords: { lat: number; lng: number };
  description: string;
  qrCodeValue: string | null;
  isScanned: boolean;
  scannedAt: string | null;
}

export interface Trail {
  id: string;
  cityName: string;
  trailTitle: string;
  description: string;
  coverImage: string;
  badgeTitle: string;
  points: TrailPointNode[];
  hasBadge: boolean;
}

/**
 * Fetches every trilha with its pontos, data-driven: a trilha only shows
 * up here if it has at least one row in trilha_pontos (no manual
 * activation flag anywhere). Progress (isScanned per point) is computed
 * live against the user's confirmed QR scans — never stored/synced.
 */
export async function fetchTrails(userId: string): Promise<Trail[]> {
  const supabase = createClient();

  const [{ data: trilhas, error: trilhasError }, { data: junctions, error: junctionsError }, { data: scans, error: scansError }, { data: badges, error: badgesError }] =
    await Promise.all([
      supabase.from("trilhas").select("*").order("criado_em", { ascending: true }),
      supabase
        .from("trilha_pontos")
        .select("trilha_id, ordem, pontos(*)")
        .order("ordem", { ascending: true }),
      supabase.from("user_scans").select("ponto_id, scanned_at").eq("user_id", userId),
      supabase.from("user_trail_badges").select("trilha_id").eq("user_id", userId),
    ]);

  if (trilhasError) throw trilhasError;
  if (junctionsError) throw junctionsError;
  if (scansError) throw scansError;
  if (badgesError) throw badgesError;

  const scannedMap = new Map((scans ?? []).map((s) => [s.ponto_id, s.scanned_at]));
  const badgeSet = new Set((badges ?? []).map((b) => b.trilha_id));

  type JunctionRow = { trilha_id: string; ordem: number; pontos: PontoRow | null };
  const byTrilha = new Map<string, JunctionRow[]>();
  for (const row of (junctions ?? []) as unknown as JunctionRow[]) {
    if (!row.pontos) continue; // ponto deleted but junction row lingering — skip
    const list = byTrilha.get(row.trilha_id) ?? [];
    list.push(row);
    byTrilha.set(row.trilha_id, list);
  }

  const trails: Trail[] = [];
  for (const trilha of (trilhas ?? []) as TrilhaRow[]) {
    const junctionRows = byTrilha.get(trilha.id);
    if (!junctionRows || junctionRows.length === 0) continue; // data-driven: no pontos = trilha doesn't appear

    const points: TrailPointNode[] = junctionRows.map((row) => {
      const p = row.pontos as PontoRow;
      const scannedAt = scannedMap.get(p.id) ?? null;
      return {
        id: p.id,
        name: p.nome,
        category: p.categoria,
        image: p.imagem_capa ?? "",
        coords: { lat: p.latitude, lng: p.longitude },
        description: p.descricao_curta ?? "",
        qrCodeValue: p.qr_code_value,
        isScanned: scannedAt !== null,
        scannedAt,
      };
    });

    trails.push({
      id: trilha.id,
      cityName: trilha.cidade,
      trailTitle: trilha.titulo,
      description: trilha.descricao ?? "",
      coverImage: trilha.imagem_capa ?? "",
      badgeTitle: trilha.selo_titulo ?? "",
      points,
      hasBadge: badgeSet.has(trilha.id),
    });
  }

  return trails;
}

export function calculateTrailProgress(trail: Trail) {
  const total = trail.points.length;
  const scanned = trail.points.filter((p) => p.isScanned).length;
  const percent = total > 0 ? Math.round((scanned / total) * 100) : 0;
  return { scanned, total, percent };
}

/**
 * Grants the trail badge if 100% of its pontos are scanned and the badge
 * hasn't been awarded yet. unique(user_id, trilha_id) on the table makes
 * this safe to call repeatedly — a duplicate insert attempt just conflicts
 * harmlessly (ignoreDuplicates below). Returns true if a NEW badge was
 * just granted (caller uses this to decide whether to show the modal).
 */
export async function grantBadgeIfComplete(userId: string, trail: Trail): Promise<boolean> {
  const { percent } = calculateTrailProgress(trail);
  if (percent !== 100 || trail.hasBadge) return false;

  const supabase = createClient();
  const { error, data } = await supabase
    .from("user_trail_badges")
    .upsert({ user_id: userId, trilha_id: trail.id }, { onConflict: "user_id,trilha_id", ignoreDuplicates: true })
    .select();
  if (error) throw error;

  // ignoreDuplicates returns empty data on conflict (already existed) —
  // non-empty means this call actually inserted a brand-new row.
  return (data?.length ?? 0) > 0;
}

/** Total XP = sum of xp_value across every distinct ponto the user has
 * ever confirmed via QR scan. First-scan-only by construction — user_scans
 * has unique(user_id, ponto_id), so a ponto can only contribute XP once,
 * no matter how many times it's physically re-scanned. */
export async function fetchTotalXp(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_scans")
    .select("pontos(xp_value)")
    .eq("user_id", userId);
  if (error) throw error;

  type Row = { pontos: { xp_value: number } | null };
  return (data as unknown as Row[]).reduce((sum, row) => sum + (row.pontos?.xp_value ?? 0), 0);
}
