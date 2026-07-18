import { createClient } from "@/lib/supabase/client";
import type { PontoRow } from "@/types/database";
import type { TouristPoint } from "@/types/point";

function rowToPoint(row: PontoRow): TouristPoint {
  return {
    id: row.id,
    name: row.nome,
    category: row.categoria,
    coords: { lat: row.latitude, lng: row.longitude },
    image: row.imagem_capa ?? "",
    gallery: row.galeria_imagens ?? [],
    description: row.descricao_curta ?? "",
    history: row.descricao_longa ?? "",
    accessibility: {
      wheelchair: row.acessibilidade_rampa,
      audio: row.acessibilidade_audio,
      braille: row.acessibilidade_braille,
      libras: row.acessibilidade_libras,
      details: row.acessibilidade_detalhes ?? [],
    },
    address: row.endereco ?? "",
    qrCodeValue: row.qr_code_value,
    audioUrl: row.audio_url,
    audioDescriptionUrl: row.audiodescricao_url,
    librasVideoUrl: row.video_libras_url,
  };
}

export async function fetchTouristPoints(): Promise<TouristPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("pontos").select("*").order("criado_em", { ascending: true });
  if (error) throw error;
  return (data as PontoRow[]).map(rowToPoint);
}

/** Looks up a single ponto by its physical QR code value. Returns null if not found (no throw — caller shows friendly error, not a crash). */
export async function fetchPointByQrCode(qrValue: string): Promise<TouristPoint | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pontos")
    .select("*")
    .eq("qr_code_value", qrValue)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToPoint(data as PontoRow);
}

export async function recordSearch(userId: string, pointId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("user_searches").insert({ user_id: userId, point_id: pointId });
  if (error) throw error;
}

export async function fetchSearchHistory(userId: string, limit = 20): Promise<TouristPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_searches")
    .select("point_id, searched_at, pontos(*)")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const seen = new Set<string>();
  const points: TouristPoint[] = [];
  for (const row of data as unknown as { point_id: string; pontos: PontoRow | null }[]) {
    if (seen.has(row.point_id) || !row.pontos) continue;
    seen.add(row.point_id);
    points.push(rowToPoint(row.pontos));
  }
  return points;
}

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("user_favorites").select("point_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.point_id));
}

export async function toggleFavorite(userId: string, pointId: string, isFavorite: boolean) {
  const supabase = createClient();
  if (isFavorite) {
    const { error } = await supabase.from("user_favorites").delete().eq("user_id", userId).eq("point_id", pointId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user_favorites").insert({ user_id: userId, point_id: pointId });
    if (error) throw error;
  }
}
