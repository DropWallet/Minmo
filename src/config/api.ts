/**
 * API Configuration
 * 
 * Environment variables:
 * - EXPO_PUBLIC_API_URL: Base URL for Supabase Edge Functions
 *   Example: https://your-project.supabase.co/functions/v1
 * - EXPO_PUBLIC_SUPABASE_URL: Supabase project URL (optional for M2, needed for M4)
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Supabase anon/public key (required for Edge Functions)
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

/**
 * Check if API is configured
 */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/**
 * Get the base API URL
 */
export function getApiBaseUrl(): string {
  if (!isApiConfigured()) {
    throw new Error('API URL not configured. Set EXPO_PUBLIC_API_URL environment variable.');
  }
  return API_BASE_URL;
}

/**
 * Get Supabase URL (for future use with auth)
 */
export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}

/**
 * Get Supabase anon key (for Edge Function authentication)
 */
export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return __DEV__;
}

/**
 * Transcription API endpoint
 */
export function getTranscriptionEndpoint(): string {
  return `${getApiBaseUrl()}/transcribe`;
}

/**
 * Transcription status endpoint (for async jobs, if needed)
 */
export function getTranscriptionStatusEndpoint(jobId: string): string {
  return `${getApiBaseUrl()}/transcribe/${jobId}`;
}

