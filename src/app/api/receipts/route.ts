/**
 * Receipt API Route Handler.
 *
 * GET /api/receipts -- Query receipts with filters.
 * POST /api/receipts -- Record a new receipt.
 *
 * Server-side alternative to direct Supabase client usage.
 * Primary consumers: server components, external scripts, debugging.
 *
 * References:
 * - AD-6 (Receipt System)
 * - WS-1.7 ReceiptStore interface
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'
import { uuidv7 } from '@/lib/receipt-store/uuid-v7'
import type { ReceiptInput } from '@/lib/interfaces/receipt-store'

// ============================================================================
// GET /api/receipts
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()
  const { searchParams } = request.nextUrl

  let query = client.from('launch_receipts').select('*').order('timestamp', { ascending: false })

  // Parse filter parameters.
  const sources = searchParams.get('sources')
  if (sources) {
    query = query.in('source', sources.split(','))
  }

  const eventTypes = searchParams.get('eventTypes')
  if (eventTypes) {
    query = query.in('event_type', eventTypes.split(','))
  }

  const severities = searchParams.get('severities')
  if (severities) {
    query = query.in('severity', severities.split(','))
  }

  const actor = searchParams.get('actor')
  if (actor) {
    query = query.eq('actor', actor)
  }

  const district = searchParams.get('district')
  if (district) {
    query = query.eq('location->>district', district)
  }

  const correlationId = searchParams.get('correlationId')
  if (correlationId) {
    query = query.eq('correlation_id', correlationId)
  }

  const startTime = searchParams.get('start')
  const endTime = searchParams.get('end')
  if (startTime) query = query.gte('timestamp', startTime)
  if (endTime) query = query.lte('timestamp', endTime)

  const search = searchParams.get('search')
  if (search) {
    query = query.textSearch('summary', search, {
      type: 'websearch',
      config: 'english',
    })
  }

  const limit = parseInt(searchParams.get('limit') ?? '100', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipts: data ?? [], count: data?.length ?? 0 })
}

// ============================================================================
// POST /api/receipts
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()

  let body: ReceiptInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate required fields.
  if (
    !body.source ||
    !body.eventType ||
    !body.severity ||
    !body.summary ||
    !body.actor ||
    !body.location
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: source, eventType, severity, summary, actor, location' },
      { status: 400 }
    )
  }

  const receiptId = uuidv7()
  const timestamp = new Date().toISOString()

  const { data, error } = await client
    .from('launch_receipts')
    .insert({
      id: receiptId,
      correlation_id: body.correlationId ?? null,
      source: body.source,
      event_type: body.eventType,
      severity: body.severity,
      summary: body.summary.slice(0, 120),
      detail: body.detail ?? null,
      location: body.location as unknown as Record<string, unknown>,
      timestamp,
      duration_ms: body.durationMs ?? null,
      actor: body.actor,
      ai_metadata: body.aiMetadata ? (body.aiMetadata as unknown as Record<string, unknown>) : null,
      target: body.target ? (body.target as unknown as Record<string, unknown>) : null,
      tags: body.tags ? [...body.tags] : null,
      snapshot_id: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipt: data }, { status: 201 })
}
