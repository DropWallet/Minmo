# Milestones

Milestone 1 — Local MVP
- Tabs: Timeline | Record | Settings running on Expo managed.
- Recording: record/stop/save with expo-av; files stored via expo-file-system.
- SQLite: entries table + FTS5; create/read/update/delete wired to UI.
- Record flow: save prompt+duration+audio URI; photo optional (camera or library via expo-image-picker/camera).
- Timeline list: reverse chronological; tap to open detail.
- Entry Detail: playback, prompt, transcript text input (manual), favourite toggle.
- Search: FTS5 on prompt/transcript.
- Settings: transcription toggle default ON with privacy note; placeholder account section.
- Tooling: ESLint+Prettier+TS strict, Jest smoke test, GitHub Actions (lint+test).
- Export: deferred; placeholder only.
Acceptance: fresh install can record (with or without photo), save, view, search, and play entries offline without crashes; transcription toggle ON by default and controllable; lint/test/CI green.

Milestone 2 — Transcription Backend (optional)
- Backend POST /api/transcriptions (proxy to Whisper) with auth.
- App upload flow + “Processing” state; store transcript + segments.
- Privacy toggle respected; no key in client.
Acceptance: transcription returns text for short clips; failure handled gracefully.

Milestone 3 — UX/Search polish
- Better FTS search UX (highlights), favourites filter.
- Thumbnails for photos; small fake waveform on playback.
- Background retry queue for pending uploads (if backend used).
Acceptance: search fast, UI stable; pending uploads retry on reconnect.

Milestone 4 — Cloud Sync/Auth (optional)
- Supabase Auth upgrade path; device_id merge logic.
- Sync entries to Postgres + Storage with RLS.
- Conflict resolution by updated_at.
Acceptance: sign-in upgrades local data to cloud and backfills new device.

## Deferred Functionality

The following features are intentionally deferred from Milestone 1 but may be added in future milestones:

### Pagination
- **Status:** Deferred
- **Reason:** Current 100-entry limit covers ~3 months of usage (one entry per day). FlatList virtualization handles current load efficiently.
- **When to add:** After 1+ years of usage, or if users request browsing older entries, or if performance degrades with 100+ entries.
- **Implementation notes:**
  - Add `offset` parameter to `getEntries()` and `getFavouriteEntries()`
  - Implement `onEndReached` in FlatList for infinite scroll
  - Or add "Load More" button when entries.length === limit
  - Consider increasing limit to 200-500 entries before implementing pagination

### Grid View
- **Status:** UI placeholder only (shows "Grid view coming soon")
- **Planned functionality:** Calendar view with indicators on days that have moments
- **Implementation notes:**
  - Display monthly calendar grid
  - Show visual indicator (dot/badge) on days with entries
  - Tap day to view entry or navigate to timeline filtered by date
  - Consider using a calendar library (e.g., `react-native-calendars`) or custom implementation

### Card View
- **Status:** UI placeholder only (shows "Card view coming soon")
- **Planned functionality:** Horizontal scrolling carousel gallery
- **Implementation notes:**
  - Implement horizontal FlatList or ScrollView
  - Each card shows entry preview (photo if available, prompt, date)
  - Smooth scrolling with snap-to-card behavior
  - Reference: https://medium.com/timeless/building-a-carousel-gallery-in-react-native-using-reanimated-ii-724ec3d94921
  - Consider using `react-native-reanimated` for smooth animations