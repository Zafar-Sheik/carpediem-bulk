const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  NOTIFICATION_SEND: { windowMs: 60000, maxRequests: 10 },
  ADMIN_LOGIN: { windowMs: 300000, maxRequests: 5 },
  DEVICE_REGISTER: { windowMs: 60000, maxRequests: 5 },
  UPLOAD: { windowMs: 60000, maxRequests: 10 },
} as const;

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimits, 5 * 60 * 1000);

export interface NotificationValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNotificationInput(data: {
  title?: unknown;
  message?: unknown;
  imageUrl?: unknown;
  link?: unknown;
}): NotificationValidationResult {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required');
  } else if (data.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (data.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }
  
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required');
  } else if (data.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (data.message.length > 500) {
    errors.push('Message must be 500 characters or less');
  }
  
  if (data.imageUrl) {
    if (typeof data.imageUrl !== 'string') {
      errors.push('Image URL must be a string');
    } else if (data.imageUrl.trim().length > 0) {
      if (data.imageUrl.trim().startsWith('data:')) {
        const dataUrlPattern = /^data:image\/\w+;base64,/;
        if (!dataUrlPattern.test(data.imageUrl.trim())) {
          errors.push('Invalid base64 image data URL format');
        }
      } else {
        const urlValidation = validateUrl(data.imageUrl);
        if (!urlValidation.valid) {
          errors.push('Invalid image URL format');
        }
      }
    }
  }
  
  if (data.link) {
    if (typeof data.link !== 'string') {
      errors.push('Link must be a string');
    } else if (data.link.trim().length > 0) {
      const urlValidation = validateUrl(data.link);
      if (!urlValidation.valid) {
        errors.push('Invalid link URL format');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    if (['javascript:', 'data:', 'blob:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Invalid URL protocol' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateAdminLogin(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }
  
  const body = data as Record<string, unknown>;
  
  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(body.email)) {
    errors.push('Invalid email format');
  }
  
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required');
  } else if (body.password.length < 1) {
    errors.push('Password is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/^.*[/\\]/, '');
  return sanitized.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

export function validateFileType(
  filename: string,
  allowedTypes: readonly string[]
): { valid: boolean; error?: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeType = getMimeType(ext);
  
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function validateDeviceRegistration(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }
  
  const body = data as Record<string, unknown>;
  
  if (!body.fcmToken || typeof body.fcmToken !== 'string') {
    errors.push('FCM token is required');
  } else if (body.fcmToken.length < 10) {
    errors.push('Invalid FCM token');
  }
  
  const validPlatforms = ['android', 'ios', 'windows', 'mac', 'linux', 'unknown'];
  if (body.platform && typeof body.platform === 'string') {
    if (!validPlatforms.includes(body.platform.toLowerCase())) {
      errors.push('Invalid platform');
    }
  }
  
  if (body.browser && typeof body.browser !== 'string') {
    errors.push('Browser must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return 'An error occurred. Please try again.';
  }
  return 'An unexpected error occurred';
}
