import { BLACKLIST_KEY_PREFIX } from './constants';
import { Env } from './types';

const blKey = (ip: string) => `${BLACKLIST_KEY_PREFIX}${ip}`;

export async function isBlacklisted(env: Env, ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  const val = await env.REDIRECTS.get(blKey(ip));
  return !!val;
}

