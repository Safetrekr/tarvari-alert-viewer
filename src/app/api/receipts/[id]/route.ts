/**
 * Single Receipt API Route Handler.
 *
 * GET /api/receipts/:id -- Get a single receipt by ID.
 *
 * References:
 * - WS-1.7 ReceiptStore.getById()
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const client = createSupabaseServerClient()

  const { data, error } = await client.from('launch_receipts').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipt: data })
}
