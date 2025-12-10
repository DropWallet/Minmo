/**
 * Application constants for delays, timeouts, and configuration values
 */

// Database operation delays (in milliseconds)
export const DB_DELAYS = {
  /** Delay after database initialization to ensure it's ready */
  INIT: 100,
  /** Delay between database retry attempts */
  RETRY: 300,
  /** Delay before recreating database after deletion */
  RECREATE: 500,
  /** Delay after closing database to ensure file handles are released */
  CLOSE: 1000,
} as const;

// iOS-specific delays
export const IOS_DELAYS = {
  /** Delay to allow iOS state updates to settle before rendering */
  STATE_SETTLE: 100,
} as const;

// Animation durations (in milliseconds)
export const ANIMATION = {
  /** Duration for pulse animation cycle */
  PULSE_DURATION: 600,
} as const;

// Transcription limits
export const TRANSCRIPTION = {
  /** Maximum audio duration in seconds for transcription */
  MAX_DURATION_SECONDS: 120,
} as const;





