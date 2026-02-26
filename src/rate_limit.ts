import { Env } from './types';

const KEY_CD = (ip: string) => `rl:cd:${ip}`; // cooldown marker
const KEY_DAY = (ip: string) => `rl:day:${ip}`; // daily count
const KEY_STOPS = (ip: string) => `rl:st:${ip}`; // rate-limit stops in last minute
const KEY_TEMP = (ip: string) => `bl:temp:${ip}`; // temp block json {kind:'temp',expiresAt:number}
const KEY_TEMP_REQ = (ip: string) => `bl:temp:req:${ip}`; // requests during temp block
const KEY_PERM = (ip: string) => `bl:perm:${ip}`; // permanent block marker
const KEY_HIST = (ip: string) => `bl:hist:${ip}`; // has ever been temp-blocked

export type BlockStatus = { status: 'none' } | { status: 'temp'; expiresAt: number } | { status: 'perm' };

export async function getBlockStatus(env: Env, ip: string): Promise<BlockStatus> {
  if (!ip || ip === 'unknown') return { status: 'none' };
  const perm = await env.REDIRECTS.get(KEY_PERM(ip));
  if (perm) return { status: 'perm' };
  const tempRaw = await env.REDIRECTS.get(KEY_TEMP(ip));
  if (tempRaw) {
    try {
      const obj = JSON.parse(tempRaw) as { expiresAt: number };
      return { status: 'temp', expiresAt: obj.expiresAt };
    } catch {
      return { status: 'temp', expiresAt: Date.now() + 18 * 60 * 60 * 1000 };
    }
  }
  return { status: 'none' };
}

export async function markBlockedHistory(env: Env, ip: string): Promise<void> {
  await env.REDIRECTS.put(KEY_HIST(ip), '1');
}

export async function hadTempBlockBefore(env: Env, ip: string): Promise<boolean> {
  const v = await env.REDIRECTS.get(KEY_HIST(ip));
  return !!v;
}

export async function tempBlock(env: Env, ip: string, durationMs = 18 * 60 * 60 * 1000): Promise<void> {
  const expiresAt = Date.now() + durationMs;
  await env.REDIRECTS.put(KEY_TEMP(ip), JSON.stringify({ kind: 'temp', expiresAt }), { expiration: Math.floor(expiresAt / 1000) });
  await markBlockedHistory(env, ip);
}

export async function permBlock(env: Env, ip: string): Promise<void> {
  await env.REDIRECTS.put(KEY_PERM(ip), '1');
  await env.REDIRECTS.delete(KEY_TEMP(ip));
  await env.REDIRECTS.delete(KEY_TEMP_REQ(ip));
}

export async function duringTempBlockRequest(env: Env, ip: string): Promise<'none' | 'perm_blocked'> {
  const status = await getBlockStatus(env, ip);
  if (status.status !== 'temp') return 'none';
  const ttlSec = Math.max(1, Math.floor((status.expiresAt - Date.now()) / 1000));
  const currentRaw = await env.REDIRECTS.get(KEY_TEMP_REQ(ip));
  const current = currentRaw ? Number(currentRaw) || 0 : 0;
  const next = current + 1;
  await env.REDIRECTS.put(KEY_TEMP_REQ(ip), String(next), { expiration: Math.floor(Date.now() / 1000) + ttlSec });
  if (next >= 40) {
    await permBlock(env, ip);
    return 'perm_blocked';
  }
  return 'none';
}

export async function onRateLimited(env: Env, ip: string): Promise<'none' | 'temp_blocked' | 'perm_blocked'> {
  const status = await getBlockStatus(env, ip);
  if (status.status === 'perm') return 'perm_blocked';
  if (status.status === 'temp') return 'temp_blocked';

  if (await hadTempBlockBefore(env, ip)) {
    await permBlock(env, ip);
    return 'perm_blocked';
  }

  const raw = await env.REDIRECTS.get(KEY_STOPS(ip));
  const count = raw ? Number(raw) || 0 : 0;
  const next = count + 1;
  await env.REDIRECTS.put(KEY_STOPS(ip), String(next), { expiration: Math.floor(Date.now() / 1000) + 60 });
  if (next > 3) {
    await tempBlock(env, ip);
    return 'temp_blocked';
  }
  return 'none';
}

export async function hasCooldown(env: Env, ip: string): Promise<boolean> {
  const raw = await env.REDIRECTS.get(KEY_CD(ip));
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw) as { t: number };
    if (Date.now() < obj.t) return true;
    await env.REDIRECTS.delete(KEY_CD(ip));
    return false;
  } catch {
    return true;
  }
}

export async function setCooldown(env: Env, ip: string, seconds = 5): Promise<void> {
  const expireAt = Date.now() + seconds * 1000;
  await env.REDIRECTS.put(KEY_CD(ip), JSON.stringify({ t: expireAt }), { expirationTtl: 60 });
}

export async function getDailyCount(env: Env, ip: string): Promise<number> {
  const v = await env.REDIRECTS.get(KEY_DAY(ip));
  return v ? Number(v) || 0 : 0;
}

export async function incrementDailyCount(env: Env, ip: string): Promise<number> {
  const key = KEY_DAY(ip);
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const ttlSec = Math.max(1, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const current = await getDailyCount(env, ip);
  const next = current + 1;
  await env.REDIRECTS.put(key, String(next), { expiration: Math.floor(Date.now() / 1000) + ttlSec });
  return next;
}
