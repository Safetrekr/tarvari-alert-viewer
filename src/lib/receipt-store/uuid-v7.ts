/**
 * UUID v7 generator -- time-sortable unique identifiers.
 *
 * UUID v7 layout (RFC 9562):
 * - Bits 0-47:  Unix timestamp in milliseconds (48 bits)
 * - Bits 48-51: Version (0111 = 7)
 * - Bits 52-63: Random (12 bits)
 * - Bits 64-65: Variant (10)
 * - Bits 66-127: Random (62 bits)
 *
 * This produces UUIDs that sort chronologically, which is critical
 * for the launch_receipts table's timestamp-ordered queries.
 *
 * Zero external dependencies. Uses crypto.getRandomValues() for randomness.
 *
 * References:
 * - WS-1.7 InMemoryReceiptStore limitation note:
 *   "No UUID v7 (uses crypto.randomUUID() which is v4)"
 * - IA Assessment Section 5: "id: UUID v7 (time-sortable)"
 */

/**
 * Generate a UUID v7 string.
 *
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * where x is a hex digit and y is 8, 9, a, or b (variant bits).
 *
 * @returns A UUID v7 string (lowercase, hyphenated).
 */
export function uuidv7(): string {
  const now = Date.now()

  // 16 bytes = 128 bits
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Timestamp: 48 bits (6 bytes) in big-endian.
  // Bits 0-47 of the UUID.
  bytes[0] = (now / 2 ** 40) & 0xff
  bytes[1] = (now / 2 ** 32) & 0xff
  bytes[2] = (now / 2 ** 24) & 0xff
  bytes[3] = (now / 2 ** 16) & 0xff
  bytes[4] = (now / 2 ** 8) & 0xff
  bytes[5] = now & 0xff

  // Version: bits 48-51 = 0111 (7).
  // Clear top 4 bits of byte 6, set to 0111.
  bytes[6] = (bytes[6] & 0x0f) | 0x70

  // Variant: bits 64-65 = 10.
  // Clear top 2 bits of byte 8, set to 10.
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Format as UUID string.
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/**
 * Extract the timestamp from a UUID v7.
 *
 * Useful for debugging and verifying time-sort order.
 *
 * @param uuid - A UUID v7 string.
 * @returns The embedded timestamp as a Date, or null if invalid.
 */
export function extractTimestamp(uuid: string): Date | null {
  const hex = uuid.replace(/-/g, '')
  if (hex.length !== 32) return null

  // First 12 hex chars = 48 bits of timestamp.
  const timestampHex = hex.slice(0, 12)
  const timestampMs = parseInt(timestampHex, 16)

  if (isNaN(timestampMs) || timestampMs <= 0) return null

  return new Date(timestampMs)
}
