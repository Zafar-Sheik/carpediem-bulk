import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  RATE_LIMITS,
  validateFileType,
  sanitizeFilename,
  sanitizeError,
} from '@/lib/utils/security';

type SharpCallable = (input: Buffer) => import('sharp').Sharp;

let sharp: SharpCallable | null = null;

async function getSharp(): Promise<SharpCallable> {
  if (!sharp) {
    const m = await import('sharp');
    sharp = ((m as { default?: SharpCallable }).default ?? (m as unknown as SharpCallable)) as SharpCallable;
  }
  return sharp;
}

const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const PDF_TYPE = 'application/pdf';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

const ALLOWED_EXT_MIMES = [...IMAGE_TYPES, PDF_TYPE] as const;

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `upload:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.UPLOAD);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      );
    }

    const formData = await request.formData();
    const rawFiles = formData.getAll('file') as File[];
    let files = rawFiles.filter((f) => f && f.size > 0);

    if (files.length === 0) {
      const single = formData.get('file') as File | null;
      if (single && single.size > 0) {
        files = [single];
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files per request` },
        { status: 400 }
      );
    }

    let totalSize = 0;
    const results: Array<{ name: string; mime: string; dataUrl: string }> = [];

    for (const file of files) {
      const safeName = sanitizeFilename(file.name);
      const typeValidation = validateFileType(safeName, ALLOWED_EXT_MIMES);
      if (!typeValidation.valid) {
        return NextResponse.json({ error: typeValidation.error }, { status: 400 });
      }

      const isPdf = file.type === PDF_TYPE || safeName.toLowerCase().endsWith('.pdf');
      const isImage = IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number]);

      if (!isPdf && !isImage) {
        return NextResponse.json(
          { error: 'Invalid file type. Use JPEG, PNG, GIF, WebP, or PDF' },
          { status: 400 }
        );
      }

      const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: isPdf ? 'PDF too large (max 10MB)' : 'Image too large (max 5MB)' },
          { status: 400 }
        );
      }

      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: 'Total upload size too large (max 25MB combined)' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const inputBuffer = Buffer.from(bytes);

      if (isPdf) {
        const base64 = inputBuffer.toString('base64');
        results.push({
          name: safeName,
          mime: PDF_TYPE,
          dataUrl: `data:${PDF_TYPE};base64,${base64}`,
        });
        continue;
      }

      let imageBuffer: Buffer = inputBuffer;
      let mimeType = file.type;

      try {
        const sharpModule = await getSharp();
        if (sharpModule) {
          if (file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp') {
            imageBuffer = await sharpModule(inputBuffer).toBuffer();
          } else {
            imageBuffer = await sharpModule(inputBuffer).jpeg({ quality: 100 }).toBuffer();
            mimeType = 'image/jpeg';
          }
        }
      } catch {
        imageBuffer = inputBuffer;
        mimeType = file.type;
      }

      const base64 = imageBuffer.toString('base64');
      results.push({
        name: safeName,
        mime: mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
    }

    if (files.length === 1 && results.length === 1) {
      return NextResponse.json({
        success: true,
        imageData: results[0].dataUrl,
        files: results,
      });
    }

    return NextResponse.json({
      success: true,
      files: results,
      imageData: results.find((r) => r.mime.startsWith('image/'))?.dataUrl || '',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    maxFiles: 10,
    maxImageSize: MAX_IMAGE_SIZE,
    maxPdfSize: MAX_PDF_SIZE,
    allowedTypes: [...IMAGE_TYPES, PDF_TYPE],
  });
}
