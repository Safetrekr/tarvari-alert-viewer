/**
 * Snapshot API Route Handler.
 *
 * GET /api/snapshots -- Query snapshots by receipt ID or time range.
 * POST /api/snapshots -- Record a system snapshot.
 *
 * References:
 * - AD-6 (Receipt System -- metric comparison)
 * - WS-1.7 SystemSnapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'
import { uuidv7 } from '@/lib/receipt-store/uuid-v7'

// ============================================================================
// GET /api/snapshots
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()
  const { searchParams } = request.nextUrl

  const receiptId = searchParams.get('receiptId')
  if (receiptId) {
    // Get snapshot linked to a specific receipt.
    const { data, error } = await client
      .from('launch_snapshots')
      .select('*')
      .eq('receipt_id', receiptId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'No snapshot found for this receipt' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ snapshot: data })
  }

  // Otherwise, query by time range.
  let query = client.from('launch_snapshots').select('*').order('timestamp', { ascending: false })

  const trigger = searchParams.get('trigger')
  if (trigger) {
    query = query.eq('trigger', trigger)
  }

  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (start) query = query.gte('timestamp', start)
  if (end) query = query.lte('timestamp', end)

  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ snapshots: data ?? [] })
}

// ============================================================================
// POST /api/snapshots
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()

  let body: { data: Record<string, unknown>; trigger: string; receiptId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.data || !body.trigger) {
    return NextResponse.json({ error: 'Missing required fields: data, trigger' }, { status: 400 })
  }

  const snapshotId = uuidv7()

  const { data, error } = await client
    .from('launch_snapshots')
    .insert({
      id: snapshotId,
      trigger: body.trigger,
      data: body.data,
      receipt_id: body.receiptId ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ snapshot: data }, { status: 201 })
}
