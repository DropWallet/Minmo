# API Spec

POST /api/transcriptions
- Auth: Bearer Supabase JWT (anonymous allowed if desired; recommend authenticated when available).
- Body: multipart/form-data { file: audio/m4a, entryId: uuid, prompt?: string, duration_seconds?: number }
- Response 200: { entryId, transcript, segments?, audio_url?, jobId? }
- Response 202 (optional async): { jobId }
- Errors: 400 invalid, 401/403 auth, 429 rate-limit, 500 server.
- App behavior: transcription default ON; user can disable in Settings. When disabled, client does not upload.

GET /api/transcriptions/{jobId}
- Auth: Bearer required.
- Response 200: { jobId, status: queued|processing|done|error, transcript?, segments?, audio_url? }
- 404 if unknown jobId.

POST /api/sync/entries (optional later)
- Auth: Bearer required.
- Body: { entries: [...], deviceId }
- Behavior: upsert entries, return conflicts resolved by updated_at.
- Response: { merged: [...], errors: [...] }











