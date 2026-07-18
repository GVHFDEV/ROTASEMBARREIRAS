import { createClient } from "@/lib/supabase/client";
import type { TouristPointRow } from "@/types/database";
import type { TouristPoint } from "@/data/mockData";

function rowToPoint(row: TouristPointRow): TouristPoint {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    coords: { lat: row.lat, lng: row.lng },
    image: row.image,
    description: row.description,
    accessibility: row.accessibility,
    history: row.history,
    address: row.address,
    qrCodeValue: row.qr_code_value,
  };
}

export async function fetchTouristPoints(): Promise<TouristPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tourist_points").select("*");
  if (error) throw error;
  return (data as TouristPointRow[]).map(rowToPoint);
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
    .select("point_id, searched_at, tourist_points(*)")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const seen = new Set<string>();
  const points: TouristPoint[] = [];
  for (const row of data as unknown as { point_id: string; tourist_points: TouristPointRow }[]) {
    if (seen.has(row.point_id) || !row.tourist_points) continue;
    seen.add(row.point_id);
    points.push(rowToPoint(row.tourist_points));
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
