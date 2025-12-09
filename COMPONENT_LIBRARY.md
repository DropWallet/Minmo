# Component Library

## Atoms
- Button: variants (primary, secondary, ghost); props {title, onPress, icon?, disabled?}
- IconButton: {icon, onPress, size?, variant}
- Text: {variant: heading|body|label|caption, tone: primary|secondary|muted|inverse}
- Input: {value, onChange, placeholder, multiline?, leadingIcon?, trailingIcon?}
- Toggle: {value, onChange, label}
- Badge/Tag: {label, variant: default|accent|muted}

## Molecules
- Card: {children, onPress?, tone?}
- ListItem: {title, subtitle?, rightContent?, onPress}
- TimelineItem: {prompt, date, duration, favourite, photoThumb?, onPress}
- AudioPlayerMini: {uri, duration, onPlayToggle, isPlaying}
- RecorderButton: {state: idle|recording|saving, onPress} with fake waveform indicator.
- PhotoPicker: {uri?, onPickCamera, onPickLibrary, onRemove?} (camera required).
- SearchBar: {value, onChange, placeholder}
- EmptyState: {title, body, actionLabel?, onAction?}

## Organisms/Screens (composition only)
- RecordScreen
- ReviewScreen
- TimelineScreen
- EntryDetailScreen
- SettingsScreen

## Usage notes
- No inline styles; use Tailwind classes referencing `themeconfig.ts` tokens.
- Keep props small; favor composition over config explosion.
- Ensure recorder/review flow requires a photo before save (camera or library).
- Transcription default ON; show privacy copy when uploading.

