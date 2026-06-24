import { NextRequest, NextResponse } from 'next/server';
import { query, execute, getInsertIdNumber } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { sendNotificationToAllDevices } from '@/lib/firebase/messaging';
import { validateNotificationPayload } from '@/lib/utils/helpers';
import type { SendNotificationBody, IDevice } from '@/types';
import {
  firstImageForFcm,
  parseAttachmentsJson,
  stringifyAttachments,
  type AttachmentItem,
} from '@/lib/notificationAttachments';

function normalizeAttachmentsInput(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (!Array.isArray(raw)) return '';
  const items: AttachmentItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    const dataUrl = typeof o.dataUrl === 'string' ? o.dataUrl : '';
    const mime = typeof o.mime === 'string' ? o.mime : 'application/octet-stream';
    const name = typeof o.name === 'string' ? o.name : 'file';
    if (dataUrl) items.push({ name, mime, dataUrl });
  }
  return items.length ? stringifyAttachments(items) : '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const sentBy = session.username ?? session.email ?? 'admin';

    const body: SendNotificationBody = await request.json();
    const { title, message, image, link, scheduledAt, targetProvince, attachments } = body;

    const validation = validateNotificationPayload({ title, message });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const attachmentsJson = normalizeAttachmentsInput(attachments);
    const parsed = parseAttachmentsJson(attachmentsJson || undefined);
    const primaryImage = firstImageForFcm(parsed, image);

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (isScheduled) {
      const result = await execute(
        `INSERT INTO notifications (title, message, image_url, attachments, link, scheduled_at, status, sent_count, delivered_count, opened_count, sent_by_admin, target_province)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 0, 0, 0, ?, ?)`,
        [
          title,
          message,
          primaryImage || image || '',
          attachmentsJson || null,
          link || '',
          new Date(scheduledAt),
          sentBy,
          targetProvince || 'All',
        ]
      );

      const schedId = getInsertIdNumber(result);
      return NextResponse.json({
        success: true,
        message: 'Notification scheduled successfully',
        notificationId: schedId > 0 ? schedId : undefined,
      });
    }

    let devices: IDevice[];
    if (targetProvince && targetProvince !== 'All') {
      devices = await query<IDevice[]>(
        'SELECT fcm_token FROM devices WHERE province = ?',
        [targetProvince]
      );
    } else {
      devices = await query<IDevice[]>('SELECT fcm_token FROM devices');
    }

    if (devices.length === 0) {
      return NextResponse.json({ error: 'No active devices registered' }, { status: 400 });
    }

    const tokens: string[] = [];
    devices.forEach((d) => {
      if (d.fcm_token && !tokens.includes(d.fcm_token)) {
        tokens.push(d.fcm_token);
      }
    });

    const insertResult = await execute(
      `INSERT INTO notifications (title, message, image_url, attachments, link, sent_at, status, sent_count, delivered_count, opened_count, sent_by_admin, target_province)
       VALUES (?, ?, ?, ?, ?, NOW(), 'pending', ?, 0, 0, ?, ?)`,
      [
        title,
        message,
        primaryImage || image || '',
        attachmentsJson || null,
        link || '',
        tokens.length,
        sentBy,
        targetProvince || 'All',
      ]
    );

    const idNum = getInsertIdNumber(insertResult);
    if (idNum <= 0) {
      throw new Error(
        'Database did not return a valid notification id after insert. Check DB compatibility (e.g. TiDB insertId).'
      );
    }

    const result = await sendNotificationToAllDevices(
      tokens,
      title!,
      message!,
      primaryImage || image,
      link,
      String(idNum)
    );

    const finalStatus = result.success > 0 ? 'sent' : 'failed';
    await execute(
      'UPDATE notifications SET status = ?, delivered_count = ? WHERE id = ?',
      [finalStatus, result.success, idNum]
    );

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${result.success} device${result.success !== 1 ? 's' : ''}${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      results: {
        success: result.success,
        failed: result.failed,
        total: tokens.length,
      },
      notificationId: idNum,
    });
  } catch (error) {
    console.error('Send notification error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message =
      error instanceof Error ? error.message : 'Failed to send notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
