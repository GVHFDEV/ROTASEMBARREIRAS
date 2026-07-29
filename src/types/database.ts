/** Mirrors Supabase schema. Keep in sync w/ migrations.sql */

/** Row shape of public.pontos, as returned by PostgREST. */
export interface PontoRow {
  id: string;
  nome: string;
  categoria: string;
  latitude: number;
  longitude: number;
  endereco: string | null;
  descricao_curta: string | null;
  descricao_longa: string | null;
  imagem_capa: string | null;
  galeria_imagens: string[];
  acessibilidade_rampa: boolean;
  acessibilidade_audio: boolean;
  acessibilidade_braille: boolean;
  acessibilidade_libras: boolean;
  acessibilidade_detalhes: string[];
  audio_url: string | null;
  audiodescricao_url: string | null;
  video_libras_url: string | null;
  qr_code_value: string | null;
  cidade: string;
  xp_value: number;
  criado_em: string;
  atualizado_em: string;
}

export interface UserSearchRow {
  id: string;
  user_id: string;
  point_id: string;
  searched_at: string;
}

export interface TrilhaRow {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_capa: string | null;
  selo_titulo: string | null;
  cidade: string;
  criado_em: string;
}

export interface TrilhaPontoRow {
  trilha_id: string;
  ponto_id: string;
  ordem: number;
}

/** Confirmed QR scan — source of truth for trail progress + XP. Distinct
 * from user_searches (which also logs plain map/search clicks, not just
 * physical QR confirmations). unique(user_id, ponto_id) means this row's
 * mere existence = "first confirmed scan", so XP is never double-counted. */
export interface UserScanRow {
  id: string;
  user_id: string;
  ponto_id: string;
  scanned_at: string;
}

export interface UserTrailBadgeRow {
  id: string;
  user_id: string;
  trilha_id: string;
  earned_at: string;
}

export interface UserFavoriteRow {
  id: string;
  user_id: string;
  point_id: string;
  created_at: string;
}

export interface AccessibilityPreferencesRow {
  user_id: string;
  audio_enabled: boolean; // reused for "Leitura em voz alta" toggle
  libras_enabled: boolean; // reused for VLibras widget toggle
  high_contrast_enabled: boolean;
  font_scale: "normal" | "lg" | "xl";
  reduce_motion_enabled?: boolean;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
