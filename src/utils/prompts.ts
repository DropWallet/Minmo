import promptsData from '../data/prompts.json';

/**
 * Gets the daily prompt for today.
 * Uses a deterministic algorithm based on the date so the same day always returns the same prompt.
 * 
 * @returns A prompt string
 */
export function getDailyPrompt(): string {
  // Get today's date as a consistent number (days since epoch)
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  
  // Simple hash function to convert date to a number
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % promptsData.length;
  
  return promptsData[index];
}

/**
 * Gets all available prompts (for future use, e.g., admin/manual selection)
 */
export function getAllPrompts(): string[] {
  return [...promptsData];
}








