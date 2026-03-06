/**
 * Build-time data mode resolution.
 *
 * NEXT_PUBLIC_DATA_MODE controls whether hooks fetch from the TarvaRI
 * backend API ('console') or from Supabase directly ('supabase').
 * Defaults to 'console' when unset.
 *
 * @module data-mode
 * @see AD-10
 */

export type DataMode = 'console' | 'supabase'

const raw = process.env.NEXT_PUBLIC_DATA_MODE

export const DATA_MODE: DataMode =
  raw === 'supabase' ? 'supabase' : 'console'

export const isSupabaseMode = DATA_MODE === 'supabase'
export const isConsoleMode = DATA_MODE === 'console'
