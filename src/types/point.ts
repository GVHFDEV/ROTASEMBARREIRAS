/**
 * App-facing domain type (camelCase), decoupled from Supabase row shape.
 * Mapping choice: descricao_curta -> description (preview/search),
 * descricao_longa -> history (detail-screen body text). Keeps existing
 * component field names (BottomSheet.description, PointDetails.history)
 * untouched — no component rewrite needed for this rename.
 */
export interface TouristPoint {
  id: string;
  name: string;
  category: string;
  coords: { lat: number; lng: number };
  image: string;
  gallery: string[];
  description: string;
  history: string;
  accessibility: {
    wheelchair: boolean;
    audio: boolean;
    braille: boolean;
    libras: boolean;
    details: string[];
  };
  address: string;
  qrCodeValue: string | null;
  audioUrl: string | null;
  audioDescriptionUrl: string | null;
  librasVideoUrl: string | null;
}
