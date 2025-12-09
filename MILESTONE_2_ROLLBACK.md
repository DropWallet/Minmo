# Milestone 2 Rollback Notes

## Overview
This document tracks all changes made for Milestone 2 (Transcription Backend) to enable easy rollback if needed.

## Files Created
- `src/utils/deviceId.ts` - Device ID generation and storage
- `src/config/api.ts` - API configuration and helpers
- `src/api/transcription.ts` - Transcription API client
- `supabase/functions/transcribe/index.ts` - Supabase Edge Function for transcription
- `supabase/functions/transcribe/README.md` - Edge Function documentation
- Environment variables documented in `ONBOARDING.md` (create `.env` manually)

## Files Modified
- `src/screens/ReviewScreen.tsx` - Added transcription upload trigger after save
- `src/screens/EntryDetailScreen.tsx` - Added processing state UI
- `src/store/useAppStore.ts` - Already has transcription job management (no changes needed)
- `App.tsx` - May need to initialize device ID on app start
- `package.json` - No new dependencies needed (expo-secure-store already installed)

## Database Changes
- No schema changes needed (transcript, transcript_segments, transcribed fields already exist)

## Environment Variables Added
- `EXPO_PUBLIC_API_URL` - Supabase Edge Functions URL
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL (optional for M2, needed for M4)

## Rollback Steps
1. Remove created files listed above
2. Revert changes to modified files
3. Remove environment variables from `.env`
4. Delete Supabase Edge Function if deployed

## Dependencies
- `expo-secure-store` - Already installed (no new dependency)
- No additional npm packages required

## Notes
- Device ID is stored in SecureStore with key `device_id`
- Transcription upload happens after entry save, not during recording
- Processing state is managed via Zustand store (already scaffolded)
- Backend uses Supabase Edge Functions (free tier friendly)

