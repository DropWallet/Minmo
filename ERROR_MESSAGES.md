# Error Messages Documentation

This file documents all user-facing error messages in MinMo. Update the copy here when rewriting error messages.

## Recording Errors

### Start Recording Failed
**Location:** `src/screens/RecordScreen.tsx` (line ~114)
**Context:** When user tries to start recording but microphone permissions are denied or recording fails
**Current Copy:**
```
Title: "Recording Error"
Message: "Unable to start recording. Please check that your device has microphone permissions enabled and try again."
Action: OK button
```

### Stop Recording Failed
**Location:** `src/screens/RecordScreen.tsx` (line ~139)
**Context:** When stopping recording fails (audio may not be saved)
**Current Copy:**
```
Title: "Recording Error"
Message: "Unable to stop recording. Your audio may not have been saved. Please try recording again."
Action: OK button
```

### Already Recorded Today
**Location:** `src/screens/RecordScreen.tsx` (line ~93)
**Context:** When user tries to record but already has an entry for today
**Current Copy:**
```
Title: "Already recorded"
Message: "You've already recorded your moment for today. You can edit or delete it to record again."
Action: OK button
```

### Delete Entry Confirmation
**Location:** `src/screens/RecordScreen.tsx` (line ~183)
**Context:** Confirmation dialog before deleting today's entry
**Current Copy:**
```
Title: "Delete Entry"
Message: "Are you sure you want to delete today's moment? This cannot be undone."
Actions: Cancel, Delete (destructive)
```

### Delete Entry Failed
**Location:** `src/screens/RecordScreen.tsx` (line ~221)
**Context:** When deletion fails
**Current Copy:**
```
Title: "Error"
Message: "Failed to delete entry. Please try again."
Action: OK button
```

## Review Screen Errors

### Playback Error
**Location:** `src/screens/ReviewScreen.tsx` (line ~69)
**Context:** When audio playback fails
**Current Copy:**
```
Title: "Playback Error"
Message: "Unable to play audio. The file may be missing or corrupted."
Action: OK button
```

### Photo Library Error
**Location:** `src/screens/ReviewScreen.tsx` (line ~97)
**Context:** When accessing photo library fails (permissions or other issues)
**Current Copy:**
```
Title: "Photo Error"
Message: "Unable to access your photo library. Please check app permissions and try again."
Action: OK button
```

### Camera Permission Denied
**Location:** `src/screens/ReviewScreen.tsx` (line ~115)
**Context:** When camera permission is denied
**Current Copy:**
```
Title: "Camera Permission Required"
Message: "MinMo needs camera access to take photos. Please enable it in your device settings."
Action: OK button
```

### Camera Error
**Location:** `src/screens/ReviewScreen.tsx` (line ~130)
**Context:** When accessing camera fails (after permission granted)
**Current Copy:**
```
Title: "Camera Error"
Message: "Unable to access camera. Please check app permissions and try again."
Action: OK button
```

### Save Entry Failed
**Location:** `src/screens/ReviewScreen.tsx` (line ~187)
**Context:** When saving a new or updated entry fails
**Current Copy:**
```
Title: "Save Error"
Message: "Unable to save your moment. Please check your device storage and try again."
Actions: Cancel, Retry
```

## Entry Detail Screen Errors

### Entry Not Found
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~68)
**Context:** When trying to load an entry that doesn't exist
**Current Copy:**
```
Title: "Error"
Message: "Entry not found"
Action: Closes modal automatically
```

### Load Entry Failed
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~84)
**Context:** When loading entry details fails (with retry option)
**Current Copy:**
```
Title: "Error"
Message: "Failed to load entry. Please try again."
Actions: Close, Retry
```

### Playback Error (Entry Detail)
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~124)
**Context:** When audio playback fails in entry detail
**Current Copy:**
```
Title: "Error"
Message: "Failed to play audio"
Action: OK button
```

### Save Changes Failed
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~147)
**Context:** When saving edits to an entry fails
**Current Copy:**
```
Title: "Error"
Message: "Failed to save changes. Please try again."
Actions: Cancel, Retry
```

### Save Changes Success
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~140)
**Context:** When edits are saved successfully
**Current Copy:**
```
Title: "Success"
Message: "Entry updated"
Action: Closes modal automatically
```

### Delete Entry Confirmation (Entry Detail)
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~163)
**Context:** Confirmation dialog before deleting an entry
**Current Copy:**
```
Title: "Delete Entry"
Message: "Are you sure you want to delete this moment? This cannot be undone."
Actions: Cancel, Delete (destructive)
```

### Delete Entry Failed (Entry Detail)
**Location:** `src/screens/EntryDetailScreen.tsx` (line ~187)
**Context:** When deletion fails in entry detail
**Current Copy:**
```
Title: "Error"
Message: "Failed to delete entry"
Action: OK button
```

## Today Entry Card Errors

### Playback Error (Today Card)
**Location:** `src/components/TodayEntryCard.tsx` (line ~49)
**Context:** When audio playback fails in today's entry card
**Current Copy:**
```
Title: "Playback Error"
Message: "Unable to play audio. The file may be missing or corrupted."
Action: OK button
```

## Settings Screen Errors

### Seed Test Data Success
**Location:** `src/screens/SettingsScreen.tsx` (line ~48)
**Context:** When test data is successfully created
**Current Copy:**
```
Title: "Success"
Message: "Test data created! Check the Timeline tab."
Action: OK button
```

### Seed Test Data Failed
**Location:** `src/screens/SettingsScreen.tsx` (line ~50)
**Context:** When creating test data fails
**Current Copy:**
```
Title: "Error"
Message: "Unable to create test data. The database may be unavailable. Please try again later."
Action: OK button
```

### Clear All Entries Success
**Location:** `src/screens/SettingsScreen.tsx` (line ~73)
**Context:** When all entries are successfully deleted
**Current Copy:**
```
Title: "Success"
Message: "All entries deleted!"
Action: OK button
```

### Clear All Entries Failed
**Location:** `src/screens/SettingsScreen.tsx` (line ~75)
**Context:** When clearing all entries fails
**Current Copy:**
```
Title: "Error"
Message: "Unable to clear entries. The database may be unavailable. Please try again later."
Action: OK button
```

### Clear All Entries Confirmation
**Location:** `src/screens/SettingsScreen.tsx` (line ~62)
**Context:** Confirmation dialog before clearing all entries
**Current Copy:**
```
Title: "Clear All Entries"
Message: "This will delete ALL entries from the database. This cannot be undone. Are you sure?"
Actions: Cancel, Delete All (destructive)
```

### Seed Test Data Confirmation
**Location:** `src/screens/SettingsScreen.tsx` (line ~37)
**Context:** Confirmation dialog before seeding test data
**Current Copy:**
```
Title: "Seed Test Data"
Message: "This will create 60 days of test entries. This may take a moment. Continue?"
Actions: Cancel, Seed
```

## Timeline Screen Errors

### Load Entries Failed
**Location:** `src/screens/TimelineScreen.tsx` (line ~34)
**Context:** When loading timeline entries fails (silent failure - no user alert)
**Current Copy:**
- No user-facing error message (silent failure to avoid interrupting user experience)
- User can retry by navigating away and back, or pulling to refresh (if implemented later)

## Notes

- All error messages should be user-friendly and actionable
- Avoid technical jargon (e.g., "database error", "NullPointerException")
- Provide clear next steps when possible
- Use consistent tone: helpful, not alarming
- Consider adding retry options for transient errors
- Success messages should be brief and positive

## Future Improvements

- Add error codes for tracking common issues
- Implement error analytics to identify patterns
- Add contextual help links for common errors
- Consider in-app error reporting for critical failures

