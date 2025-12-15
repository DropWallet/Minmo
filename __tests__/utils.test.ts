/**
 * Utility functions tests
 * Tests date formatting, prompt selection, etc.
 */

import { formatDateWithOrdinal } from '../src/utils/dateFormat';
import { getDailyPrompt, getAllPrompts } from '../src/utils/prompts';

describe('Date Formatting', () => {
  it('should format date with ordinal suffix', () => {
    const date = new Date(2024, 11, 1); // Dec 1, 2024
    const formatted = formatDateWithOrdinal(date);
    expect(formatted).toBe('1st Dec 2024');
  });

  it('should handle different ordinal suffixes', () => {
    expect(formatDateWithOrdinal(new Date(2024, 0, 2))).toBe('2nd Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 3))).toBe('3rd Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 4))).toBe('4th Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 11))).toBe('11th Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 21))).toBe('21st Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 22))).toBe('22nd Jan 2024');
    expect(formatDateWithOrdinal(new Date(2024, 0, 23))).toBe('23rd Jan 2024');
  });

  it('should format current date correctly', () => {
    const now = new Date();
    const formatted = formatDateWithOrdinal(now);
    // Should match pattern: "DDth Mon YYYY"
    expect(formatted).toMatch(/^\d{1,2}(st|nd|rd|th) [A-Z][a-z]{2} \d{4}$/);
  });
});

describe('Daily Prompts', () => {
  it('should return a prompt string', () => {
    const prompt = getDailyPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should return the same prompt for the same day', () => {
    const prompt1 = getDailyPrompt();
    const prompt2 = getDailyPrompt();
    expect(prompt1).toBe(prompt2);
  });

  it('should return all prompts', () => {
    const prompts = getAllPrompts();
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.every(p => typeof p === 'string')).toBe(true);
  });

  it('should return prompts from the data file', () => {
    const prompts = getAllPrompts();
    const dailyPrompt = getDailyPrompt();
    expect(prompts).toContain(dailyPrompt);
  });
});











