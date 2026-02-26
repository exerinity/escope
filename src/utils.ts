import { SLUG_LENGTH } from './constants';

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json<T>();
  } catch {
    return null;
  }
}

export function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizeSlug(pathname: string): string | null {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return null;
  }

  if (!/^[a-z0-9]+$/i.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function randomSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  const bytes = crypto.getRandomValues(new Uint8Array(SLUG_LENGTH));
  for (const byte of bytes) {
    slug += alphabet[byte % alphabet.length];
  }
  return slug;
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const cfIp = headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  const forwarded = headers.get('X-Forwarded-For');
  if (forwarded) {
    const [first] = forwarded.split(',').map((part) => part.trim());
    if (first) {
      return first;
    }
  }

  const realIp = headers.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}
