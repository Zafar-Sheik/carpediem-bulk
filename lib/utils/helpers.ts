export function parseUserAgent(userAgent: string): {
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';
  browser: string;
} {
  const ua = userAgent.toLowerCase();
  
  let platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown' = 'unknown';
  let browser = 'unknown';
  
  if (ua.includes('android')) {
    platform = 'android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    platform = 'ios';
  } else if (ua.includes('win')) {
    platform = 'windows';
  } else if (ua.includes('mac')) {
    platform = 'mac';
  } else if (ua.includes('linux')) {
    platform = 'linux';
  }
  
  if (ua.includes('chrome')) {
    browser = 'chrome';
  } else if (ua.includes('firefox')) {
    browser = 'firefox';
  } else if (ua.includes('safari')) {
    browser = 'safari';
  } else if (ua.includes('edge')) {
    browser = 'edge';
  } else if (ua.includes('opera')) {
    browser = 'opera';
  }
  
  return { platform, browser };
}

export function validateNotificationPayload(data: {
  title?: string;
  message?: string;
}): { valid: boolean; error?: string } {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (data.title.length > 100) {
    return { valid: false, error: 'Title must be less than 100 characters' };
  }
  
  if (!data.message || data.message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }
  
  if (data.message.length > 500) {
    return { valid: false, error: 'Message must be less than 500 characters' };
  }
  
  return { valid: true };
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
