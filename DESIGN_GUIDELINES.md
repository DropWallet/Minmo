# Design Guidelines (Tailwind-first)

Use only Tailwind classes backed by tokens in `themeconfig.ts`. Prefer semantic tokens (e.g., `bg-surface`, `text-primary`, `border-subtle`) instead of raw hex values.

## Color tokens (semantic)
- bg: surface, surface-strong, overlay
- text: primary, secondary, muted, inverse
- accent: accent, accent-strong
- status: success, warning, danger, info
- border: subtle, default

Example light palette
- surface: #0f172a
- surface-strong: #0b1224
- overlay: rgba(15,23,42,0.7)
- text-primary: #e2e8f0
- text-secondary: #cbd5e1
- text-muted: #94a3b8
- text-inverse: #0f172a
- accent: #38bdf8
- accent-strong: #0ea5e9
- border-subtle: #1e293b
- border-default: #334155
- success: #22c55e, warning: #f59e0b, danger: #ef4444, info: #38bdf8

## Type scale
- xs 12, sm 14, base 16, md 18, lg 20, xl 24, 2xl 28
- weights: regular 400, medium 500, semibold 600

## Spacing scale
- 0, 1, 2, 3, 4, 6, 8, 10, 12, 16 (Tailwind units)

## Radii & shadows
- radius: sm 6, md 10, lg 14, full 9999
- shadow: soft (0 6 24 -8 rgba(0,0,0,0.35)), hard (0 8 30 -10 rgba(0,0,0,0.45))

## Component styling notes
- Recording UI: use fake waveform animation classes; avoid native waveform dependencies in V1.
- Photo components: include camera & library affordances; photo capture is required in the review flow.
- Keep layouts simple; favor stacks with consistent spacing tokens.






