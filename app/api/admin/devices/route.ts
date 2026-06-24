import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { RowDataPacket } from 'mysql2/promise';

interface CountRow extends RowDataPacket {
  count: number;
}

interface GroupRow extends RowDataPacket {
  _id: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const platform = searchParams.get('platform');
    const browser = searchParams.get('browser');

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (platform) {
      conditions.push('platform = ?');
      values.push(platform);
    }
    if (browser) {
      conditions.push('browser = ?');
      values.push(browser);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totalRow] = await query<CountRow[]>(
      `SELECT COUNT(*) as count FROM devices ${whereClause}`,
      values
    );
    const total = totalRow.count;

    const offset = (page - 1) * limit;
    const devices = await query<RowDataPacket[]>(
      `SELECT id, province, platform, browser, user_agent, created_at, updated_at
       FROM devices ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const byPlatform = await query<GroupRow[]>(
      `SELECT platform as _id, COUNT(*) as count FROM devices GROUP BY platform`
    );

    const byBrowser = await query<GroupRow[]>(
      `SELECT browser as _id, COUNT(*) as count FROM devices GROUP BY browser`
    );

    return NextResponse.json({
      devices,
      stats: {
        total,
        active: total,
        inactive: 0,
        byPlatform,
        byBrowser,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get devices error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('id');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const result = await execute(
      'DELETE FROM devices WHERE id = ?',
      [parseInt(deviceId)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Device deleted' });
  } catch (error) {
    console.error('Delete device error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
