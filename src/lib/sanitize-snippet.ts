/**
 * Sanitize ts_headline HTML snippet to allow only <b> tags.
 *
 * PostgreSQL ts_headline() wraps matched terms in <b></b> by default.
 * This function strips all other HTML tags as a defense-in-depth measure
 * before rendering via dangerouslySetInnerHTML.
 *
 * @param html - Raw HTML string from ts_headline
 * @returns Sanitized HTML with only <b> and </b> tags preserved
 *
 * @module sanitize-snippet
 * @see WS-3.2
 */
export function sanitizeSnippet(html: string): string {
  return html.replace(/<\/?(?!b\b)[^>]*>/gi, '')
}
