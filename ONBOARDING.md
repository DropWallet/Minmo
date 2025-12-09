# Onboarding

Prereqs: Node LTS, pnpm or npm, Expo CLI, Xcode (iOS), Android Studio (Android).

Setup
- git clone … && cd MinMo
- npm install (or pnpm i)
- npm run lint && npm test (confirm tools)
- npm run start (Expo) — test on iOS Simulator or Android emulator.

Env
- Create `.env` file in the project root for backend URLs (required for Milestone 2).
- Copy `.env.example` to `.env` and fill in your Supabase project details:
  ```
  EXPO_PUBLIC_API_URL=https://your-project-id.supabase.co/functions/v1
  EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  ```
- No secrets in client. For transcription, set backend URL only.
- OpenAI API key is stored in Supabase Edge Function secrets (not in `.env`).

Dev workflow
- Branch from main; small PRs.
- Run lint/test before push.
- Keep docs in sync (README, flows, architecture).
- Transcription default ON; backend can be stubbed during local dev.
- Auth optional; no setup needed until later milestone.

