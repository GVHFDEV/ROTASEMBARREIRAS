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
  criado_em: string;
  atualizado_em: string;
}

export interface UserSearchRow {
  id: string;
  user_id: string;
  point_id: string;
  searched_at: string;
}

export interface UserFavoriteRow {
  id: string;
  user_id: string;
  point_id: string;
  created_at: string;
}

export interface AccessibilityPreferencesRow {
  user_id: string;
  audio_enabled: boolean;
  libras_enabled: boolean;
  high_contrast_enabled: boolean;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
