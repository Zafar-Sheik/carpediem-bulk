export type AttachmentItem = {
  name: string;
  mime: string;
  dataUrl: string;
};

export function parseAttachmentsJson(raw: string | null | undefined): AttachmentItem[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is AttachmentItem =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as AttachmentItem).dataUrl === 'string' &&
        typeof (x as AttachmentItem).mime === 'string'
    );
  } catch {
    return [];
  }
}

export function firstImageForFcm(
  attachments: AttachmentItem[],
  legacyImage?: string
): string | undefined {
  for (const a of attachments) {
    if (a.mime.startsWith('image/') && a.dataUrl) return a.dataUrl;
  }
  if (legacyImage && legacyImage.trim()) return legacyImage.trim();
  return undefined;
}

export function stringifyAttachments(items: AttachmentItem[]): string {
  return JSON.stringify(items);
}

/** First visual for admin list: prefer first embedded image, else first PDF marker, else legacy image URL. */
export function rowAttachmentPreview(
  attachmentsRaw: string | null | undefined,
  legacyImage?: string
): { kind: 'image'; src: string } | { kind: 'pdf' } | { kind: 'none' } {
  const items = parseAttachmentsJson(attachmentsRaw);
  for (const a of items) {
    if (a.mime.startsWith('image/') && a.dataUrl) return { kind: 'image', src: a.dataUrl };
  }
  for (const a of items) {
    if (a.mime === 'application/pdf') return { kind: 'pdf' };
  }
  const leg = legacyImage?.trim();
  if (leg) return { kind: 'image', src: leg };
  return { kind: 'none' };
}

export function attachmentListCount(
  attachmentsRaw: string | null | undefined,
  legacyImage?: string
): number {
  const items = parseAttachmentsJson(attachmentsRaw);
  if (items.length > 0) return items.length;
  return legacyImage?.trim() ? 1 : 0;
}
