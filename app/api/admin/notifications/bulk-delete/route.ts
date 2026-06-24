import { NextResponse } from 'next/server';
import { execute, connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No notification IDs provided' },
        { status: 400 }
      );
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = await execute(
      `DELETE FROM notifications WHERE id IN (${placeholders})`,
      ids.map((id: string) => parseInt(id))
    );

    return NextResponse.json({
      success: true,
      deleted: result.affectedRows,
    });
  } catch (error) {
    console.error('Error bulk deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
