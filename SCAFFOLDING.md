# MinMo Scaffolding Guide (designer-friendly)

Use these steps to create the runnable project skeleton. They are small, sequential, and safe to do in one sitting.

## 1) Create the Expo project (TypeScript, tabs)
- Install Expo CLI: `npm install -g expo-cli` (or use `npx expo`).
- Init: `npx create-expo-app minmo --template expo-template-tabs@latest --type ts`
- Move/merge our docs into that repo directory, or copy this `SCAFFOLDING.md` there.

## 2) Add Tailwind-style setup with theme tokens
- Install Tailwind RN (example): `npm install nativewind tailwindcss`
- Generate Tailwind config: `npx tailwindcss init`
- In your Tailwind config, map colors/spacing/radii to `themeconfig.ts` tokens (already authored in this repo).
- Wrap the app in the NativeWind provider (per NativeWind docs).
- Use semantic classes only (e.g., `bg-surface`, `text-primary`) via theme mapping.

## 3) SQLite + file system
- Install: `expo install expo-sqlite expo-file-system expo-av expo-image-picker`
- Create an `entries` table and (if available) an FTS5 virtual table for prompt/transcript. If FTS5 is unavailable on your SDK/device, fallback to simple `LIKE` search for Milestone 1.
- Store audio/photo files via `expo-file-system`; keep paths in SQLite.

## 4) Minimal state management
- Start with React context for auth/session + recording state.
- Add Zustand later only if prop drilling becomes noisy.

## 5) Transcription toggle (default ON)
- Implement a Setting toggle that gates network upload. For now, stub the call to `/api/transcriptions` (returns mocked transcript) until backend is ready.

## 6) Jest smoke test
- Add Jest deps: `npm install --save-dev jest @types/jest ts-jest` (or `babel-jest` if you prefer Babel).
- Configure `jest.config.js` (ts-jest preset).
- Keep a simple test (see `__tests__/smoke.test.js` in this repo) to ensure CI is wired.

## 7) GitHub Actions CI
- Copy `.github/workflows/ci.yml` from this repo into your app repo.
- It runs `npm run lint` and `npm test`. Update script names if you use pnpm/yarn.

## 8) Order of implementation (Milestone 1)
- Tabs (Timeline | Record | Settings) running on device/emulator.
- Record/stop/save (expo-av) to file + SQLite insert.
- Review screen with playback + optional photo add.
- Timeline list + Entry Detail (playback, transcript text, favourite).
- Search (FTS5 or LIKE).
- Settings: transcription toggle ON by default; export placeholder note.

## 9) Export deferred (note)
- Exporting a zip with DB + media is deferred to avoid cross-platform file and memory issues. Plan to ship later as: zip containing JSON (entries+transcripts) + media files.












