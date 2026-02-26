import { IP_KEY_PREFIX, SLUG_ATTEMPTS, SLUG_KEY_PREFIX } from './constants';
import { RedirectSummary, Env, StoredRedirect } from './types';
import { randomSlug } from './utils';

interface IpEntry {
  slugs: string[];
}

const slugKey = (slug: string) => `${SLUG_KEY_PREFIX}${slug}`;
const ipKey = (ip: string) => `${IP_KEY_PREFIX}${ip}`;

export async function generateUniqueSlug(store: KVNamespace): Promise<string> {
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = randomSlug();
    const existing = await store.get(slugKey(slug));
    if (!existing) {
      return slug;
    }
  }

  throw new Error('Unable to allocate a unique slug');
}

export async function getRedirect(env: Env, slug: string): Promise<StoredRedirect | null> {
  const raw = await env.REDIRECTS.get(slugKey(slug));
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as StoredRedirect;
}

export async function saveRedirect(env: Env, slug: string, record: StoredRedirect): Promise<void> {
  await env.REDIRECTS.put(slugKey(slug), JSON.stringify(record), {
    expiration: Math.floor(record.expiresAt / 1000),
  });
  await addSlugToIp(env, record.ownerIp, slug);
}

export async function deleteRedirect(env: Env, slug: string, existing?: StoredRedirect | null): Promise<StoredRedirect | null> {
  const record = existing ?? (await getRedirect(env, slug));
  if (!record) {
    return null;
  }

  await env.REDIRECTS.delete(slugKey(slug));
  await removeSlugFromIp(env, record.ownerIp, slug);
  return record;
}

export async function listActiveRedirects(env: Env, ip: string): Promise<RedirectSummary[]> {
  const entry = await readIpEntry(env, ip);
  if (!entry?.slugs?.length) {
    return [];
  }

  const now = Date.now();
  const stillValid: string[] = [];
  const active: RedirectSummary[] = [];

  for (const slug of entry.slugs) {
    const record = await getRedirect(env, slug);
    if (!record) {
      continue;
    }

    if (record.expiresAt <= now) {
      await deleteRedirect(env, slug, record);
      continue;
    }

    stillValid.push(slug);
    active.push({
      slug,
      target: record.target,
      expiresAt: record.expiresAt,
    });
  }

  await writeIpEntry(env, ip, stillValid);
  return active;
}

async function addSlugToIp(env: Env, ip: string, slug: string): Promise<void> {
  const entry = await readIpEntry(env, ip);
  const slugs = entry?.slugs ?? [];
  if (!slugs.includes(slug)) {
    slugs.push(slug);
    await writeIpEntry(env, ip, slugs);
  }
}

async function removeSlugFromIp(env: Env, ip: string, slug: string): Promise<void> {
  const entry = await readIpEntry(env, ip);
  if (!entry) {
    return;
  }

  const slugs = entry.slugs.filter((value) => value !== slug);
  await writeIpEntry(env, ip, slugs);
}

async function readIpEntry(env: Env, ip: string): Promise<IpEntry | null> {
  const raw = await env.REDIRECTS.get<IpEntry>(ipKey(ip), { type: 'json' });
  if (!raw) {
    return null;
  }
  return raw;
}

async function writeIpEntry(env: Env, ip: string, slugs: string[]): Promise<void> {
  const key = ipKey(ip);
  if (!slugs.length) {
    await env.REDIRECTS.delete(key);
    return;
  }
  await env.REDIRECTS.put(key, JSON.stringify({ slugs }));
}
