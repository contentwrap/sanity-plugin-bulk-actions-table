/**
 * Input sanitization utilities for search queries and other user inputs
 */

/**
 * Sanitizes user input for use in GROQ queries to prevent injection attacks
 * @param input - The user input to sanitize
 * @returns Sanitized string safe for use in GROQ queries
 */
export function sanitizeGroqInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove or escape potentially dangerous characters
  return (
    input
      // Remove quotes that could break the query
      .replace(/['"]/g, '')
      // Remove backslashes that could be used for escaping
      .replace(/\\/g, '')
      // Remove backticks that could be used for template injection
      .replace(/`/g, '')
      // Remove semicolons that could be used for query injection
      .replace(/;/g, '')
      // Remove curly braces that could be used for object injection
      .replace(/[{}]/g, '')
      // Remove square brackets that could be used for array injection
      .replace(/[\[\]]/g, '')
      // Remove pipe characters that could be used for function injection
      .replace(/\|/g, '')
      // Remove dollar signs that could be used for variable injection
      .replace(/\$/g, '')
      // Trim whitespace
      .trim()
      // Limit length to prevent excessively long queries
      .slice(0, 100)
  );
}

/**
 * Validates that a search query contains only safe characters
 * @param query - The search query to validate
 * @returns True if the query is safe, false otherwise
 */
export function isValidSearchQuery(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }

  // Check for minimum and maximum length
  if (query.length < 1 || query.length > 100) {
    return false;
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /['"]/, // Quotes
    /\\/, // Backslashes
    /`/, // Backticks
    /;/, // Semicolons
    /[{}]/, // Curly braces
    /[\[\]]/, // Square brackets
    /\|/, // Pipe characters
    /\$/, // Dollar signs
    /@/, // At symbols (used in GROQ)
    /->/, // Arrow operators
    /\.\./, // Double dots (path traversal)
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(query));
}
