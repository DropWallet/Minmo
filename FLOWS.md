# Flows

Record Loop
- Record tab opens → tap Record → recording screen (timer + fake waveform)
- Stop → Review (playback, duration, optionally add photo via camera or library; photo not required to save)
- Save → write SQLite + file path; return to Record tab
- Delete during review → discard file + DB draft

Timeline
- Timeline tab → list reverse chronological
- Search bar (FTS on prompt/transcript); filter by favourites
- Tap item → Entry Detail

Entry Detail
- Playback audio (expo-av)
- Show prompt, transcript (editable text), favourite toggle, photo
- Actions: Save edits (updates SQLite + FTS), Delete (confirm, remove file + row)

Settings
- Transcription toggle default ON; copy explains audio uploads to backend for Whisper; user can disable anytime
- Account section placeholder (auth upgrade deferred)
- Data/export placeholder for later