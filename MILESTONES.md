# Milestones

## Progress Summary
- **Milestone 1 (Local MVP):** ✅ ~95% Complete
- **Milestone 2 (Transcription Backend):** ✅ ~80% Complete
- **Milestone 3 (UX/Search Polish):** 🟡 ~40% Complete
- **Milestone 4 (Cloud Sync/Auth):** ⏸️ Not Started

---

Milestone 1 — Local MVP ✅ **COMPLETE**
- ✅ Tabs: Timeline | Record | Settings running on Expo managed.
- ✅ Recording: record/stop/save with expo-av; files stored via expo-file-system.
- ✅ SQLite: entries table + FTS5; create/read/update/delete wired to UI.
- ✅ Record flow: save prompt+duration+audio URI; photo optional (camera or library via expo-image-picker/camera).
- ✅ Timeline list: reverse chronological; tap to open detail.
- ✅ Entry Detail: playback, prompt, transcript text input (manual), favourite toggle.
- ✅ Search: FTS5 on prompt/transcript (with fallback to LIKE queries).
- ✅ Settings: transcription toggle default ON with privacy note; placeholder account section.
- ✅ Tooling: ESLint+Prettier+TS strict, Jest smoke test, GitHub Actions (lint+test).
- ✅ **Grid View (Calendar):** Implemented with visual indicators on days with entries, tap to view entry detail.
- ✅ **Card View:** Implemented with TimelineEntryCard component for gallery-style display.
- ✅ **Saved Screen:** Favourites view with list and card view modes.
- ⏸️ Export: deferred; placeholder only.
**Acceptance:** ✅ Met - fresh install can record (with or without photo), save, view, search, and play entries offline without crashes; transcription toggle ON by default and controllable; lint/test/CI green.

Milestone 2 — Transcription Backend ✅ **MOSTLY COMPLETE**
- ✅ Backend POST /api/transcriptions (Supabase Edge Function) with auth.
- ✅ App upload flow + "Processing" state; store transcript + segments.
- ✅ Privacy toggle respected; no key in client.
- ✅ Transcription job tracking with status (uploading, processing, completed, failed).
- ⚠️ Error handling: implemented but needs thorough testing.
**Acceptance:** ✅ Mostly met - transcription returns text for short clips; failure handling implemented with user feedback.

Milestone 3 — UX/Search polish 🟡 **IN PROGRESS**
- ❌ Better FTS search UX (highlights) - **TODO**
- ✅ Favourites filter (implemented in Saved screen).
- ❌ Thumbnails for photos - **TODO** (currently using full images).
- ❌ Small fake waveform on playback - **TODO**.
- ⚠️ Background retry queue for pending uploads - **TODO** (transcription retry logic exists but needs background queue).
**Acceptance:** 🟡 Partial - search is fast and UI is stable; pending uploads retry needs background queue implementation.

Milestone 4 — Cloud Sync/Auth (optional)
- Supabase Auth upgrade path; device_id merge logic.
- Sync entries to Postgres + Storage with RLS.
- Conflict resolution by updated_at.
Acceptance: sign-in upgrades local data to cloud and backfills new device.

## Completed Features (Originally Deferred)

### Grid View ✅ **COMPLETE**
- **Status:** ✅ Implemented
- **Implementation:** Custom CalendarView component with:
  - Monthly calendar grid display
  - Visual indicator (underline) on days with entries
  - Current day highlighted with teal background
  - Tap day to navigate to EntryImageDetail screen
  - Shows all months from app install date to current date
  - Uses theme colors and dark mode conventions
- **Location:** `src/components/CalendarView.tsx`
- **Usage:** Available in Timeline screen via grid view mode button

### Card View ✅ **COMPLETE**
- **Status:** ✅ Implemented
- **Implementation:** TimelineEntryCard component with:
  - Vertical card layout with photo, prompt, transcript preview
  - Bookmark/favourite toggle
  - Audio playback controls
  - Navigation to EntryImageDetail screen
- **Location:** `src/components/TimelineEntryCard.tsx`
- **Usage:** Available in Timeline and Saved screens via card view mode button

## Deferred Functionality

The following features remain deferred:

### Pagination
- **Status:** Deferred
- **Reason:** Current 100-entry limit covers ~3 months of usage (one entry per day). FlatList virtualization handles current load efficiently.
- **When to add:** After 1+ years of usage, or if users request browsing older entries, or if performance degrades with 100+ entries.
- **Implementation notes:**
  - Add `offset` parameter to `getEntries()` and `getFavouriteEntries()`
  - Implement `onEndReached` in FlatList for infinite scroll
  - Or add "Load More" button when entries.length === limit
  - Consider increasing limit to 200-500 entries before implementing pagination