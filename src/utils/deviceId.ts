import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id';

/**
 * Get or create a device ID for this app installation.
 * Device ID is stored securely and persists across app restarts.
 * 
 * @returns Promise<string> - The device ID (UUID v4)
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    // If no device ID exists, generate and store a new one
    if (!deviceId) {
      deviceId = await Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback: generate a temporary ID (won't persist, but allows app to function)
    // In production, this should be handled more gracefully
    const fallbackId = await Crypto.randomUUID();
    console.warn('Using fallback device ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * Ensure device ID exists (useful for initialization).
 * This is idempotent - safe to call multiple times.
 */
export async function ensureDeviceId(): Promise<void> {
  await getDeviceId();
}

