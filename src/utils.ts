import { SLUG_LENGTH } from './constants';
import { WORDS } from './words';
import { ICONS } from './icons';

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
  const raw = pathname.replace(/^\/+|\/+$/g, '');
  if (!raw) {
    return null;
  }

  let trimmed = raw;
  try {
    trimmed = decodeURIComponent(raw);
  } catch {
  }

  if (/^[a-z0-9]+$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const ICON_SET = new Set(ICONS);
  for (const ch of trimmed) {
    if (!ICON_SET.has(ch)) {
      return null;
    }
  }
  return trimmed;
}

export type SlugMode = 'letters' | 'numbers' | 'alphanumeric' | 'words' | 'icons';

function randomFromAlphabet(length: number, alphabet: string): string {
  let out = '';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const b of bytes) {
    out += alphabet[b % alphabet.length];
  }
  return out;
}

function randomWordsSlug(): string {
  let out = '';
  if (!WORDS.length) {
    return randomFromAlphabet(SLUG_LENGTH, 'abcdefghijklmnopqrstuvwxyz');
  }
  while (out.length < SLUG_LENGTH) {
    const idx = crypto.getRandomValues(new Uint16Array(1))[0] % WORDS.length;
    const w = WORDS[idx];
    const cleaned = w.replace(/[^a-z]/g, '');
    if (!cleaned) continue;
    out += cleaned;
  }
  return out.slice(0, SLUG_LENGTH);
}

export function randomSlug(mode: SlugMode = 'alphanumeric'): string {
  switch (mode) {
    case 'letters':
      return randomFromAlphabet(SLUG_LENGTH, 'abcdefghijklmnopqrstuvwxyz');
    case 'numbers':
      return randomFromAlphabet(SLUG_LENGTH, '0123456789');
    case 'words':
      return randomWordsSlug();
    case 'icons': {
      let out = '';
      const picks = Math.max(1, SLUG_LENGTH);
      for (let i = 0; i < picks; i++) {
        const idx = crypto.getRandomValues(new Uint16Array(1))[0] % ICONS.length;
        out += ICONS[idx];
      }
      return out;
    }
    case 'alphanumeric':
    default:
      return randomFromAlphabet(SLUG_LENGTH, 'abcdefghijklmnopqrstuvwxyz0123456789');
  }
}

export function normalizeSlugMode(value: unknown): SlugMode | null {
  if (typeof value !== 'string') return null;
  const v = value.toLowerCase();
  if (v === 'letters' || v === 'numbers' || v === 'alphanumeric' || v === 'words' || v === 'icons') {
    return v;
  }
  return null;
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
