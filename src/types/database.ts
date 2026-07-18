/** Mirrors Supabase schema. Keep in sync w/ migrations.sql */

export interface AccessibilityInfo {
  wheelchair: boolean;
  audio: boolean;
  braille: boolean;
  libras: boolean;
  details: string[];
}

export interface TouristPointRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  image: string;
  description: string;
  accessibility: AccessibilityInfo;
  history: string;
  address: string;
  qr_code_value: string;
  created_at: string;
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
