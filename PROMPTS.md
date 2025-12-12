# Daily Prompts System

## Overview
MinMo uses a daily prompt system to give parents conversation starters for recording moments with their kids. Each day, a fresh prompt is selected deterministically based on the date.

## How It Works
- Prompts are stored in `src/data/prompts.json` as a simple array
- The `getDailyPrompt()` function selects one prompt per day using a date-based hash
- Same day = same prompt (consistent experience)
- Prompts cycle through the list automatically

## Adding/Editing Prompts
Simply edit `src/data/prompts.json` and add/remove prompt strings:

```json
[
  "What made you smile today?",
  "Tell me about your favorite part of the day",
  // Add more prompts here...
]
```

## Current Implementation
- **Record Screen**: Displays today's prompt in a card above the record button
- **Review Screen**: Uses the prompt when saving the entry
- **Entry Detail**: Shows the saved prompt with each entry

## Future Enhancements (Post-Milestone 1)
- Manual prompt selection
- Custom user prompts
- Prompt categories/themes
- Remote prompt updates










