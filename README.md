# MinMo (Mini Moments)
A minimal, offline-first micro-diary for parents: one voice note per day, optional photo, quick playback and search.

## Principles
- Move slowly, ship small, clean up continuously.
- Keep complexity low; componentize and reuse.
- Tailwind-only styling via shared theme tokens (`themeconfig.ts`).
- Offline-first, privacy-first: local by default; optional cloud + transcription.
- Production-ready: tests, lint, CI.

## V1 Scope (Milestone 1: Local MVP) ✅ **COMPLETE**
- Bottom tabs: Timeline | Record | Settings.
- Record → Stop → Review → Save locally (audio + metadata) → optionally add photo (camera or library).
- Timeline with multiple view modes:
  - **List view:** Reverse chronological list with entry details
  - **Grid view (Calendar):** Monthly calendar with visual indicators on days with entries
  - **Card view:** Gallery-style cards with photos and previews
- Entry Detail: playback, prompt, transcript field (manual), favourite.
- Saved screen: Favourites view with list and card modes.
- Search: local SQLite FTS5 on prompt/transcript (with LIKE fallback).
- Transcription default ON with clear privacy note and a Settings toggle.
- Docs, lint, tests, CI.

## Stack
- App: Expo (managed) + React Native + TypeScript.
- Navigation: react-navigation (bottom tabs).
- Audio: expo-av. Photo: expo-image-picker (or expo-camera if preferred).
- Storage: expo-file-system + SQLite (expo-sqlite) with FTS5.
- State: light React context or Zustand.
- Backend (optional later): serverless edge (Vercel/Supabase) for transcription proxy and sync.
- Transcription: Whisper via backend only (no keys in client).
- Cloud sync (optional later): Supabase (Auth + Storage + Postgres + RLS).
- Tooling: ESLint, Prettier, TS strict, Jest; GitHub Actions CI.

## Data Model (SQLite)
- `entries`: id (uuid), created_at, recorded_at, prompt, duration_seconds, audio_local_uri, audio_remote_uri?, photo_local_uri?, photo_remote_uri?, transcript, transcript_segments (JSON), transcribed (bool), tags (JSON), favourite (bool), updated_at.
- FTS5 table on transcript + prompt for search.

## Architecture
- App saves locally first (files + SQLite).
- Optional backend endpoints for transcription and sync.
- Auth upgrade deferred: anonymous device identity via SecureStore for now; Supabase login later.
- Transcription default ON; Settings toggle with copy: “Audio uploads to MinMo for transcription; turn off anytime.”
- Privacy: no client secrets; uploads opt-in; HTTPS only.

## Development
- See `ONBOARDING.md` for setup.
- See `MILESTONES.md` for plan and acceptance.
- See `ARCHITECTURE.md` for stack/data/flows.
- See `API_SPEC.md` for endpoints.
- See `DESIGN_GUIDELINES.md` + `COMPONENT_LIBRARY.md` for UI system and tokens.

## Decision Notes (designer-friendly)
- Export deferred: a reliable cross-platform export (zipping DB + audio + photos) is tricky and can crash on low-memory devices. Keep a Settings placeholder for now; plan later to ship a zip containing JSON (entries + transcripts) and media files.
- Auth deferred: OK for M1. When adding Supabase later, map `device_id` (local) to `user_id` (Supabase) and merge by `updated_at` (newer wins) to avoid conflicts.
- Testing/CI: start small—add one Jest smoke test (e.g., a reducer or utility) and a GitHub Actions workflow that runs `npm run lint` and `npm test` on push/PR.
- State: begin with React context for small shared state; add Zustand only if context becomes noisy (too many prop drills or providers).

## Testing & CI
- Jest for unit; lint + typecheck in CI (GitHub Actions).
- Pre-push: `npm run lint && npm test`.

## License
TBD.

