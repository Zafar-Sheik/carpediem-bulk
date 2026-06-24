import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { RowDataPacket } from 'mysql2/promise';

interface SumRow extends RowDataPacket {
  messages_sent: number;
  total_recipients: number;
  total_delivered: number;
  total_opened: number;
}

export async function GET() {
  try {
    await requireAdmin();
    const [row] = await query<SumRow[]>(`
      SELECT
        COUNT(*) AS messages_sent,
        COALESCE(SUM(sent_count), 0) AS total_recipients,
        COALESCE(SUM(delivered_count), 0) AS total_delivered,
        COALESCE(SUM(opened_count), 0) AS total_opened
      FROM notifications
      WHERE status = 'sent'
    `);
    const messagesSent = Number(row.messages_sent) || 0;
    const totalRecipients = Number(row.total_recipients) || 0;
    const totalDelivered = Number(row.total_delivered) || 0;
    const totalOpened = Number(row.total_opened) || 0;
    const deliveryRate =
      totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 1000) / 10 : 0;
    const openRate =
      totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      messagesSent,
      totalRecipients,
      totalDelivered,
      totalOpened,
      deliveryRate,
      openRate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
