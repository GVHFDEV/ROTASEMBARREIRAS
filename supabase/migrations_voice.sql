-- ============================================================
-- Rota sem Barreiras — Voice Assistant rate limiting
-- ADDITIVE ONLY. Safe to re-run.
--
-- Reused as-is across both voice backend generations: originally rate-
-- limited per-utterance Groq/Whisper requests, now rate-limits Gemini
-- Live ephemeral token ISSUANCES (one row per token requested by
-- voice-token/index.ts). Same table, same one-row-per-attempt mechanism —
-- only the caller and the meaning of "one request" changed.
-- ============================================================

-- One row per request attempt. Rate limit = count rows in the last
-- window per user. No update/select policy for regular roles — only
-- the Edge Function (service_role, bypasses RLS) reads/writes this.
-- authenticated/anon get zero access, by design (nothing to expose here
-- anyway, just timestamps).
create table if not exists public.voice_assistant_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  requested_at timestamptz not null default now()
);

create index if not exists voice_assistant_requests_user_time_idx
  on public.voice_assistant_requests (user_id, requested_at desc);

alter table public.voice_assistant_requests enable row level security;
-- No policies created -> RLS enabled with zero grants = fully locked for
-- anon/authenticated. Edge Function uses service_role key, which bypasses
-- RLS entirely, so it can still read/write.

-- Housekeeping: old rows are cheap to keep (tiny table), but if this ever
-- grows large, periodically run:
-- delete from public.voice_assistant_requests where requested_at < now() - interval '1 day';
