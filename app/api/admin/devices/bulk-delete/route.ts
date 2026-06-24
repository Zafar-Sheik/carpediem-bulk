import { NextRequest, NextResponse } from 'next/server';
import { execute, connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No device IDs provided' },
        { status: 400 }
      );
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = await execute(
      `DELETE FROM devices WHERE id IN (${placeholders})`,
      ids.map((id: string) => parseInt(id))
    );

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.affectedRows} device(s)`,
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete devices' },
      { status: 500 }
    );
  }
}
