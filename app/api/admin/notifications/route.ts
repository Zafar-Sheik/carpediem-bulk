import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { RowDataPacket } from 'mysql2/promise';
import type { INotification } from '@/types';

interface CountRow extends RowDataPacket {
  count: number;
}

async function requireAuth() {
  return requireAdmin();
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totalRow] = await query<CountRow[]>(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
      values
    );
    const total = totalRow.count;

    const offset = (page - 1) * limit;
    const notifications = await query<INotification[]>(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const transformedNotifications = notifications.map((n) => {
      const sentAt = n.sent_at
        ? new Date(n.sent_at).toISOString()
        : n.scheduled_at
          ? new Date(n.scheduled_at).toISOString()
          : n.created_at
            ? new Date(n.created_at).toISOString()
            : undefined;

      return {
        _id: n.id.toString(),
        title: n.title,
        message: n.message,
        image: n.image_url || '',
        attachments: n.attachments || '',
        link: n.link || '',
        status: n.status,
        recipientCount: n.sent_count || 0,
        deliveredCount: Number(n.delivered_count) || 0,
        openedCount: Number(n.opened_count) || 0,
        sentAt,
        scheduledAt: n.scheduled_at ? new Date(n.scheduled_at).toISOString() : undefined,
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : undefined,
      };
    });

    const [sentRow] = await query<CountRow[]>("SELECT COUNT(*) as count FROM notifications WHERE status = 'sent'");
    const [failedRow] = await query<CountRow[]>("SELECT COUNT(*) as count FROM notifications WHERE status = 'failed'");
    const [scheduledRow] = await query<CountRow[]>("SELECT COUNT(*) as count FROM notifications WHERE status = 'scheduled'");
    const [pendingRow] = await query<CountRow[]>("SELECT COUNT(*) as count FROM notifications WHERE status = 'pending'");

    return NextResponse.json({
      notifications: transformedNotifications,
      stats: {
        total,
        sent: sentRow.count,
        failed: failedRow.count,
        scheduled: scheduledRow.count,
        pending: pendingRow.count,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { clearAll } = body;

    if (clearAll) {
      const result = await execute('DELETE FROM notifications');

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.affectedRows} notifications`,
        deletedCount: result.affectedRows,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Set clearAll to true to clear history.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Clear notifications error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
