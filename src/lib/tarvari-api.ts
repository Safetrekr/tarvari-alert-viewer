/**
 * TarvaRI Backend API client.
 *
 * Simple fetch wrapper for the TarvaRI console API endpoints.
 * Replaces direct Supabase PostgREST queries since the tables
 * aren't exposed via PostgREST on the active Supabase instance.
 *
 * @module tarvari-api
 */

const BASE_URL =
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_TARVARI_API_URL
    : process.env.NEXT_PUBLIC_TARVARI_API_URL) ?? 'http://localhost:8000'

/**
 * Typed GET request to the TarvaRI API.
 * Appends query params if provided and throws on non-2xx responses.
 */
export async function tarvariGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(endpoint, BASE_URL)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`TarvaRI API ${response.status}: ${text}`)
  }

  return response.json()
}
