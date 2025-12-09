# Rollback: Record Screen Refactor

**Date:** 2024-12-19  
**Change:** Refactored RecordScreen initial state UI to match SandboxScreen design

## What Changed

### Files Modified
- `src/screens/RecordScreen.tsx`

### Changes Made
1. **Added imports:**
   - `Gradient` component from `@components/Gradient`
   - `shadows` from `useTheme()` hook

2. **Replaced initial recording state UI:**
   - Removed simple prompt card and `RecorderButton` component
   - Added full SandboxScreen-style layout with:
     - Gradient wrapper (`surface-metal`)
     - Container with rounded corners and inverted surface background
     - Prompt section with "Today's prompt" label and large prompt text (using `dailyPrompt` state)
     - Middle section (empty for now, reserved for waveform dots)
     - Neumorphic record button with gradient borders and orange accent dot

3. **Button functionality:**
   - Converted button markup to `TouchableOpacity` that calls `startRecording()`
   - Maintains all existing recording logic

## To Rollback

1. **Remove Gradient import:**
```typescript
// Remove this line:
import Gradient from '@components/Gradient';
```

2. **Remove shadows from useTheme:**
```typescript
// Change from:
const { colors, shadows } = useTheme();
// To:
const { colors } = useTheme();
```

3. **Restore original UI (lines 357-374):**
```typescript
) : (
  <View className="flex-1 items-center justify-center">
    {/* Prompt */}
    {dailyPrompt && (
      <View className="mb-8 px-4 py-4 bg-surface-strong dark:bg-surface-strong-dark rounded-lg border border-border-subtle dark:border-border-subtle-dark">
        <Text className="text-text-primary dark:text-text-primary-dark text-base text-center font-medium">
          {dailyPrompt}
        </Text>
      </View>
    )}
    {/* Start Recording Button */}
    <RecorderButton
      isRecording={false}
      onPress={startRecording}
    />
  </View>
)
```

## Notes
- The recording state UI (when `isRecording === true`) remains unchanged
- The `TodayEntryCard` display logic remains unchanged
- All recording functionality is preserved




