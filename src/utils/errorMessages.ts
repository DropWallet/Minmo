/**
 * User-facing error messages
 * These messages are displayed to users in Alert dialogs
 * See ERROR_MESSAGES.md for full documentation
 */

export const ERROR_MESSAGES = {
  // Recording
  RECORDING_START_FAILED: 'Unable to start recording. Please check that your device has microphone permissions enabled and try again.',
  RECORDING_STOP_FAILED: 'Unable to stop recording. Your audio may not have been saved. Please try recording again.',
  ALREADY_RECORDED_TODAY: 'You\'ve already recorded your moment for today. You can edit or delete it to record again.',
  
  // Playback
  PLAYBACK_ERROR: 'Unable to play audio. The file may be missing or corrupted.',
  
  // Photo/Camera
  PHOTO_LIBRARY_ERROR: 'Unable to access your photo library. Please check app permissions and try again.',
  CAMERA_PERMISSION_REQUIRED: 'MinMo needs camera access to take photos. Please enable it in your device settings.',
  CAMERA_ERROR: 'Unable to access camera. Please check app permissions and try again.',
  
  // Save/Load
  SAVE_ENTRY_FAILED: 'Unable to save your moment. Please check your device storage and try again.',
  AUTO_SAVE_FAILED: 'Unable to save your moment. Please try again.',
  LOAD_ENTRY_FAILED: 'Failed to load entry. Please try again.',
  ENTRY_NOT_FOUND: 'Entry not found',
  SAVE_CHANGES_FAILED: 'Failed to save changes. Please try again.',
  
  // Delete
  DELETE_ENTRY_FAILED: 'Failed to delete entry. Please try again.',
  DELETE_TODAY_FAILED: 'Failed to delete entry. Please try again.',
  
  // Transcription
  TRANSCRIPTION_ERROR: 'Failed to transcribe audio',
  TRANSCRIPTION_API_NOT_CONFIGURED: 'Transcription API is not configured. Please set EXPO_PUBLIC_API_URL in your environment variables.',
  TRANSCRIPTION_NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  TRANSCRIPTION_AUDIO_NOT_FOUND: 'Audio file not found',
  TRANSCRIPTION_DURATION_INVALID: 'Invalid audio duration',
  
  // Database
  DATABASE_INIT_FAILED: 'Failed to initialize database after multiple attempts',
  DATABASE_RESET_FAILED: 'Unable to reset database. Please restart the app and try again.',
  DATABASE_RECREATE_FAILED: 'Failed to recreate database. Please restart the app.',
  
  // Settings/Dev Tools
  SEED_DATA_FAILED: 'Unable to create test data. The database may be unavailable. Please try again later.',
  CLEAR_ENTRIES_FAILED: 'Unable to clear entries. The database may be unavailable. Please try again later.',
  NUCLEAR_RESET_FAILED: 'Failed to reset app. Please restart the app and try again.',
} as const;

export const SUCCESS_MESSAGES = {
  ENTRY_UPDATED: 'Entry updated',
  ALL_ENTRIES_DELETED: 'All entries deleted!',
  TEST_DATA_CREATED: 'Test data created! Check the Timeline tab.',
  DATABASE_RESET: 'Database reset successfully! The app will continue with a fresh database.',
  NUCLEAR_RESET: 'All data has been deleted. The app will continue with a fresh start.',
} as const;

export const CONFIRMATION_MESSAGES = {
  DELETE_ENTRY: 'Are you sure you want to delete this moment? This cannot be undone.',
  DELETE_TODAY: 'Are you sure you want to delete today\'s moment? This cannot be undone.',
  CLEAR_ALL_ENTRIES: 'This will delete ALL entries from the database. This cannot be undone. Are you sure?',
  RESET_DATABASE: 'This will delete the entire database and create a fresh one. ALL data will be lost. This cannot be undone. Are you sure?',
  NUCLEAR_RESET: 'This will DELETE EVERYTHING:\n\n• All recordings\n• All photos\n• All entries\n• Device ID\n\nThis cannot be undone. Are you absolutely sure?',
  SEED_TEST_DATA: 'This will create 60 days of test entries. This may take a moment. Continue?',
} as const;









