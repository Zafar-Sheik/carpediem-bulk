import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }
    await execute(
      'UPDATE notifications SET opened_count = opened_count + 1 WHERE id = ? AND status = ?',
      [numericId, 'sent']
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
