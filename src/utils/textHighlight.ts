/**
 * Text segment with highlight metadata
 */
export interface TextSegment {
  text: string;
  isHighlight: boolean;
}

/**
 * Highlights search terms in text by splitting into segments
 * Case-insensitive matching, handles multiple search terms
 * 
 * @param text - The text to highlight
 * @param query - The search query (can contain multiple words)
 * @returns Array of text segments with highlight metadata
 */
export function highlightSearchTerms(text: string, query: string): TextSegment[] {
  if (!text || !query || query.trim().length === 0) {
    return [{ text, isHighlight: false }];
  }

  const trimmedQuery = query.trim();
  const queryWords = trimmedQuery
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.toLowerCase());

  if (queryWords.length === 0) {
    return [{ text, isHighlight: false }];
  }

  // Escape special regex characters in each word
  const escapedWords = queryWords.map(word => 
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // Create a regex pattern that matches any of the search words (case-insensitive)
  // Use word boundaries for whole word matching, but also allow partial matches
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex to ensure we start from the beginning
  pattern.lastIndex = 0;

  // Safety counter to prevent infinite loops
  let iterations = 0;
  const maxIterations = text.length; // Should never need more than text length

  while ((match = pattern.exec(text)) !== null && iterations < maxIterations) {
    iterations++;
    
    // Prevent infinite loop if match is empty or at same position
    if (match[0].length === 0 || match.index === lastIndex) {
      break;
    }

    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        isHighlight: false,
      });
    }

    // Add the matched text as highlighted
    segments.push({
      text: match[0],
      isHighlight: true,
    });

    lastIndex = match.index + match[0].length;
    
    // Prevent infinite loop if we're not advancing
    if (lastIndex === match.index) {
      break;
    }
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isHighlight: false,
    });
  }

  // If no matches found, return the whole text as non-highlighted
  if (segments.length === 0) {
    return [{ text, isHighlight: false }];
  }

  return segments;
}

