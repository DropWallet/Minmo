# Architecture

## Stack
- Expo (managed), React Native, TypeScript.
- Navigation: react-navigation bottom tabs (Timeline | Record | Settings).
- Audio: expo-av; Photo: expo-image-picker or expo-camera.
- Storage: expo-file-system + SQLite (expo-sqlite) with FTS5.
- State: light React context or Zustand.
- Styling: Tailwind classes using tokens from `themeconfig.ts`.

## Local Data
- `entries` table (SQLite): id (uuid), created_at, recorded_at, prompt, duration_seconds, audio_local_uri, audio_remote_uri?, photo_local_uri?, photo_remote_uri?, transcript, transcript_segments (JSON), transcribed (bool), tags (JSON), favourite (bool), updated_at.
- FTS5 virtual table on prompt + transcript for search.
- Files: audio (.m4a) and photos (jpg/heic) stored in app sandbox.

## Identity & Auth
- On first launch: generate `device_id` (SecureStore).
- Auth upgrade deferred: later Supabase login (Apple/Google/email) to enable sync; backend endpoints will expect Supabase JWT when used.

## Transcription (default ON)
- Client uploads audio to backend `POST /api/transcriptions` (multipart, Bearer JWT when available).
- Backend stores audio (temp/permanent), calls Whisper, returns transcript (+jobId if async).
- Settings toggle controls upload; copy: “Audio uploads to MinMo for transcription; turn off anytime.”
- No client secrets.

## Sync (later milestone)
- Supabase Postgres + Storage + RLS; map `device_id` data to `user_id` on upgrade.
- Conflict resolution via `updated_at` (newer wins).

## Performance & Offline
- Always write local first; show immediate success.
- Keep clips short (<60s default) to cap size.
- Use FTS5 for search; minimal state stored in memory.

## Security & Privacy
- HTTPS only; signed URLs for uploads when cloud enabled.
- No client-side API keys; transcription opt-out respected.
- Clear privacy copy when uploading audio.

## Media & UI Notes
- Waveform: fake/animated for recording/playback in V1 to avoid native complexity.
- Photo capture is core: support camera and library flows in the Review step.
- Export deferred to post-M1; placeholder in Settings only. Rationale: cross-platform zipping of DB + audio/photo files is error-prone and memory-heavy on mobile. Plan later to export a zip containing JSON (entries + transcripts) plus media files.

## Future Auth Upgrade (Supabase)
- Keep `device_id` in SecureStore for anonymous local use.
- When adding Supabase, on first sign-in map local entries (device_id) to `user_id` from Supabase and resolve conflicts by `updated_at` (newer wins).


