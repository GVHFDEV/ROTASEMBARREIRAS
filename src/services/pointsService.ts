import { createClient } from "@/lib/supabase/client";
import type { PontoRow, RelatoRow, RelatoWithProfile, Profile } from "@/types/database";
import type { TouristPoint } from "@/types/point";

const CONDITION_WINDOW_DAYS = 14;

function rowToPoint(row: PontoRow): TouristPoint {
  return {
    id: row.id,
    name: row.nome,
    category: row.categoria,
    city: row.cidade ?? "",
    coords: { lat: row.latitude, lng: row.longitude },
    image: row.imagem_capa ?? "",
    gallery: row.galeria_imagens ?? [],
    imageFolder: row.pasta_imagens ?? row.qr_code_value ?? null,
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
    updatedAt: row.atualizado_em ?? null,
  };
}

const POINTS_CACHE_KEY = "rotas_points_cache";
const POINTS_CACHE_VERSION = 4; // v4: accessibility.details shape changed from string[] to {texto,estado}[]
const POINTS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function fetchTouristPoints(): Promise<TouristPoint[]> {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(POINTS_CACHE_KEY);
      if (cached) {
        const { version, timestamp, data } = JSON.parse(cached);
        if (
          version === POINTS_CACHE_VERSION &&
          Date.now() - timestamp < POINTS_CACHE_TTL_MS &&
          Array.isArray(data)
        ) {
          return data as TouristPoint[];
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("pontos").select("*").order("criado_em", { ascending: true });
  if (error) throw error;
  const points = (data as PontoRow[]).map(rowToPoint);

  // Attach real-time condition (relatos_pontos, last 14 days). The discrete
  // indicator only renders when condition.active (= problem > ok). A single
  // extra query, date-filtered server-side — no job, no manual moderation.
  await attachConditions(supabase, points);

  if (typeof window !== "undefined" && points.length > 0) {
    try {
      localStorage.setItem(
        POINTS_CACHE_KEY,
        JSON.stringify({ version: POINTS_CACHE_VERSION, timestamp: Date.now(), data: points })
      );
    } catch {
      // Ignore cache write errors
    }
  }

  return points;
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

/**
 * Records a confirmed QR scan — the ONLY source of truth for trail
 * progress + XP. Distinct from recordSearch (user_searches), which also
 * fires on plain map/search clicks and is not proof of a physical visit.
 * unique(user_id, ponto_id) on the table means repeat scans of the same
 * ponto insert-conflict harmlessly (onConflict below no-ops) — XP/progress
 * only ever counts the first confirmed scan.
 */
export async function recordScan(userId: string, pontoId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_scans")
    .upsert({ user_id: userId, ponto_id: pontoId }, { onConflict: "user_id,ponto_id", ignoreDuplicates: true });
  if (error) throw error;
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

// ---------------------------------------------------------------------------
// Cadastro interno de pontos (internal registration tool, /admin/pontos)
// ---------------------------------------------------------------------------

/** Fields the internal cadastro form can set on insert. Everything else
 * (id, criado_em, atualizado_em) is server-generated. */
export interface NewPontoInput {
  nome: string;
  categoria: string;
  cidade: string;
  latitude: number;
  longitude: number;
  endereco: string | null;
  descricao_curta: string | null;
  descricao_longa: string | null;
  imagem_capa: string | null;
  acessibilidade_rampa: boolean;
  acessibilidade_audio: boolean;
  acessibilidade_braille: boolean;
  acessibilidade_libras: boolean;
  qr_code_value: string | null;
  pasta_imagens: string | null;
}

/** Inserts a new ponto row. Requires the `pontos_insert_authenticated` RLS
 * policy (see migrations_pontos_insert.sql) — without it this throws a
 * row-level security error for every caller, by design (writes are
 * otherwise Table-Editor-only). */
export async function createPonto(input: NewPontoInput): Promise<TouristPoint> {
  const supabase = createClient();
  const { data, error } = await supabase.from("pontos").insert(input).select("*").single();
  if (error) throw error;
  return rowToPoint(data as PontoRow);
}

// ---------------------------------------------------------------------------
// Galeria de fotos (Storage bucket "pontos-imagens")
// ---------------------------------------------------------------------------

const PONTOS_IMAGENS_BUCKET = "pontos-imagens";

/** Public URL prefix for the pontos-imagens bucket, derived from the same
 * env var used to build the Supabase client (no separate config needed). */
function pontosImagensPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${PONTOS_IMAGENS_BUCKET}/${path}`;
}

/**
 * Lists every image file inside a point's Storage folder (bucket
 * "pontos-imagens", folder named after the point — see
 * docs/SUPABASE_PONTOS_SETUP.md for the folder convention). Returns public
 * URLs, newest first is NOT guaranteed by Storage; we sort by name so
 * uploads are stable across reloads. Non-fatal: returns [] on any error
 * (missing folder, no bucket yet, etc) instead of throwing, since the
 * gallery is a nice-to-have section on the point detail screen.
 */
export async function fetchPointGallery(folder: string): Promise<string[]> {
  if (!folder) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(PONTOS_IMAGENS_BUCKET).list(folder, {
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data) return [];
    const imageExtensions = /\.(jpe?g|png|webp|gif|avif)$/i;
    return data
      .filter((f) => f.name && imageExtensions.test(f.name) && !f.name.startsWith("."))
      .map((f) => pontosImagensPublicUrl(`${folder}/${f.name}`));
  } catch {
    return [];
  }
}

// Uploading photos is intentionally NOT exposed here — the gallery is
// view-only in the app. New photos are added directly to the Storage
// bucket via the Supabase Dashboard (bypasses RLS), same workflow already
// used for imagem_capa/galeria_imagens. See migrations_storage_pontos_imagens.sql.

// ---------------------------------------------------------------------------
// Relatos de condição (community condition reports)
// ---------------------------------------------------------------------------

/**
 * Aggregates relatos_pontos from the last CONDITION_WINDOW_DAYS onto each
 * point's `condition` field. One query, date-filtered server-side. Failures
 * here are non-fatal — the map must still render without the indicator.
 */
async function attachConditions(supabase: ReturnType<typeof createClient>, points: TouristPoint[]) {
  if (points.length === 0) return;
  try {
    const since = new Date(Date.now() - CONDITION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("relatos_pontos")
      .select("ponto_id, tipo, texto, criado_em")
      .gte("criado_em", since)
      .order("criado_em", { ascending: false });
    if (error || !data) return;

    type Agg = { ok: number; problema: number };
    const byPoint = new Map<string, Agg>();
    for (const r of data as Pick<RelatoRow, "ponto_id" | "tipo" | "texto" | "criado_em">[]) {
      const agg = byPoint.get(r.ponto_id) ?? { ok: 0, problema: 0 };
      if (r.tipo === "problema") agg.problema += 1;
      else agg.ok += 1;
      byPoint.set(r.ponto_id, agg);
    }

    for (const p of points) {
      const agg = byPoint.get(p.id);
      if (!agg) continue;
      p.condition = {
        active: agg.problema > agg.ok,
        problemCount: agg.problema,
        okCount: agg.ok,
      };
    }
  } catch {
    // Condition is a nice-to-have; never break the map because of it.
  }
}

/** All relatos for a point within the active window, newest first, enriched
 * with the reporter's public profile (name + avatar). Anonymous reports get
 * reporter_name "Visitante" and a null avatar. */
export async function fetchRelatosForPoint(pontoId: string): Promise<RelatoWithProfile[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - CONDITION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("relatos_pontos")
    .select("*")
    .eq("ponto_id", pontoId)
    .gte("criado_em", since)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  const rows = (data as RelatoRow[]) ?? [];

  // Fetch public profiles (name + avatar) for the logged-in reporters in one query.
  const userIds = [...new Set(rows.map((r) => r.user_id).filter((u): u is string => !!u))];
  const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    for (const p of (profiles as Pick<Profile, "id" | "full_name" | "avatar_url">[]) ?? []) {
      profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
    }
  }

  return rows.map((r) => {
    const prof = r.user_id ? profileMap.get(r.user_id) : undefined;
    return {
      ...r,
      reporter_name: prof?.full_name?.trim() || "Visitante",
      reporter_avatar: prof?.avatar_url ?? null,
    };
  });
}

/** Create a relato. Anonymous users are blocked at the RLS layer — only
 * authenticated users can insert (user_id is forced to auth.uid() by a
 * trigger). The 7-day rate limit is also enforced in the insert policy;
 * on violation PostgREST returns 42501 which we map to a friendly message. */
export async function createRelato(
  pontoId: string,
  tipo: "ok" | "problema",
  texto: string | null,
  userId: string | null
): Promise<void> {
  const supabase = createClient();
  // SECURITY: never send user_id from the client. The `ensure_relato_identity`
  // trigger (security definer) forces user_id := auth.uid() server-side, so
  // even a tampered request can't impersonate another user. Sending it here
  // would only be misleading.
  const payload: Record<string, unknown> = {
    ponto_id: pontoId,
    tipo,
    texto: texto && texto.trim() ? texto.trim() : null,
  };

  const { error } = await supabase.from("relatos_pontos").insert(payload);
  if (error) {
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      // Ambiguous: could be "not authenticated" or "rate limited". Distinguish
      // by checking for a recent own relato — if found it's the rate limit.
      if (userId) {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabase
          .from("relatos_pontos")
          .select("id")
          .eq("ponto_id", pontoId)
          .eq("user_id", userId)
          .gte("criado_em", since)
          .limit(1);
        if (recent && recent.length > 0) {
          throw new Error("Você já relatou este ponto recentemente. Tente novamente em alguns dias.");
        }
      }
      throw new Error("Entre na sua conta para relatar a condição deste local.");
    }
    throw error;
  }
}
