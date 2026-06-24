import { getMessaging } from './admin';
import sharp from 'sharp';
import { execute } from '@/lib/db';
import type { FCMMessage } from '@/types';

const BATCH_SIZE = 500;

interface SendResult {
  success: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export async function sendPushNotification(
  tokens: string[],
  message: FCMMessage
): Promise<SendResult> {
  if (!tokens.length) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ index: number; error: string }> = [];

  const batchPromises: Promise<void>[] = [];

  console.log("Sending notification to:", tokens.length, "devices");

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batchTokens = tokens.slice(i, i + BATCH_SIZE);
    console.log("Sending batch:", batchTokens.length, "tokens, batch index:", i / BATCH_SIZE);

    batchPromises.push((async () => {
      try {
        const response = await getMessaging().sendEachForMulticast({
          data: message.data,
          webpush: message.webpush,
          tokens: batchTokens,
        });

        successCount += response.successCount;
        failedCount += response.failureCount;

        if (response.responses) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorMsg = resp.error?.message || 'Unknown error';
              errors.push({
                index: i + idx,
                error: errorMsg,
              });
            }
          });
        }
      } catch {
        failedCount += batchTokens.length;
      }
    })());
  }

  await Promise.all(batchPromises);

  return {
    success: successCount,
    failed: failedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function compressImageForFCM(imageDataUrl: string): Promise<string | null> {
  try {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const img = await sharp(imageBuffer)
      .resize(60, 60, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();

    if (img.length <= 4000) {
      return `data:image/webp;base64,${img.toString('base64')}`;
    }

    const img2 = await sharp(imageBuffer)
      .resize(40, 40, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 30 })
      .toBuffer();

    return `data:image/webp;base64,${img2.toString('base64')}`;
  } catch (error) {
    console.error('Failed to compress image for FCM:', error);
    return null;
  }
}

export async function sendNotificationToAllDevices(
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
  link?: string,
  notificationId?: string
): Promise<SendResult> {
  let fcmImageUrl = imageUrl;

  if (imageUrl && imageUrl.startsWith('data:')) {
    const compressedImage = await compressImageForFCM(imageUrl);
    if (compressedImage) {
      fcmImageUrl = compressedImage;
    }
  } else if (imageUrl && imageUrl.startsWith('http')) {
    fcmImageUrl = imageUrl;
  }

  const dataPayload: Record<string, string> = {
    title: title,
    body: body,
    image: fcmImageUrl || '',
    link: link || '/',
    notificationId: notificationId || '',
  };

  const message: FCMMessage = {
    notification: {
      title: title,
      body: body,
    },
    data: dataPayload,
    webpush: {
      headers: {
        Urgency: 'high',
      },
    },
    tokens,
  };

  return sendPushNotification(tokens, message);
}

export async function removeInvalidTokens(invalidTokens: string[]): Promise<number> {
  if (invalidTokens.length === 0) return 0;

  try {
    const placeholders = invalidTokens.map(() => '?').join(',');
    const result = await execute(
      `DELETE FROM devices WHERE fcm_token IN (${placeholders})`,
      invalidTokens
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error removing invalid tokens:', error);
    return 0;
  }
}
