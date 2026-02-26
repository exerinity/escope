import { MIN_TTL_MINUTES, MAX_TTL_MINUTES } from '../constants';
import { Env } from '../types';
import { getClientIp, normalizeUrl, normalizeSlugMode, parseJsonBody, SlugMode } from '../utils';
import { jsonError, jsonResponse } from '../responses';
import { deleteRedirect, generateUniqueSlug, getRedirect, listActiveRedirects, saveRedirect } from '../storage';

interface CreatePayload {
  url: string;
  ttlMinutes: number;
  slugMode?: string;
}

export async function handleCreateLink(request: Request, env: Env, baseUrl: URL, ctx: ExecutionContext): Promise<Response> {
  const payload = await parseJsonBody<CreatePayload>(request);
  if (!payload) {
    return jsonError('Invalid JSON body', 400);
  }

  const rawUrl = typeof payload.url === 'string' ? payload.url.trim() : '';
  const ttlMinutes = Number(payload.ttlMinutes);

  if (!rawUrl) {
    return jsonError('Destination URL is required', 400);
  }

  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    return jsonError('Destination URL must include http:// or https://', 400);
  }

  const lowerUrl = normalizedUrl.toLowerCase();
  const blockedTargets = [
    'escp.lol',
    'escope.exerinity.com',
    'escope.exerinity.workers.dev',
  ];
  if (blockedTargets.some((b) => lowerUrl.includes(b))) {
    return jsonError('Appreciate the enthusiasm, but you cannot create a scope leading to escope or another scope', 400);
  }

  if (!Number.isFinite(ttlMinutes)) {
    return jsonError('Expiration must be a number', 400);
  }

  if (ttlMinutes < MIN_TTL_MINUTES || ttlMinutes > MAX_TTL_MINUTES) {
    return jsonError(`Expiration must be between ${MIN_TTL_MINUTES} and ${MAX_TTL_MINUTES} minutes`, 400);
  }

  const modeRaw = normalizeSlugMode(payload.slugMode);
  const slugMode: SlugMode = modeRaw ?? 'alphanumeric';

  const ownerIp = getClientIp(request);
  const now = Date.now();
  const expiresAt = now + ttlMinutes * 60 * 1000;
  const slug = await generateUniqueSlug(env.REDIRECTS, slugMode);

  await saveRedirect(env, slug, {
    target: normalizedUrl,
    expiresAt,
    ownerIp,
    createdAt: now,
  });

  const webhookUrl = env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    const redirectUrl = `${baseUrl.origin}/${slug}`;
    const content = `New link created`;
    const embed = {
      color: 0x5865F2,
      fields: [
        { name: 'Destination', value: normalizedUrl, inline: false },
        { name: 'Result', value: redirectUrl, inline: false },
        { name: 'Creator IP', value: ownerIp || 'unknown', inline: false },
      ],
      timestamp: new Date(now).toISOString(),
    };
    ctx.waitUntil(
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, embeds: [embed] }),
      }).then(async (r) => {
        try { await r.arrayBuffer(); } catch {}
      }).catch(() => {})
    );
  }

  return jsonResponse({
    slug,
    redirectUrl: `${baseUrl.origin}/${slug}`,
    expiresAt,
    createdAt: now,
  });
}

export async function handleListLinks(request: Request, env: Env, baseUrl: URL): Promise<Response> {
  const ownerIp = getClientIp(request);
  const links = await listActiveRedirects(env, ownerIp);
  const payload = links.map((link) => ({
    ...link,
    redirectUrl: `${baseUrl.origin}/${link.slug}`,
  }));
  return jsonResponse({ links: payload });
}

export async function handleDeleteLink(request: Request, env: Env, slug: string): Promise<Response> {
  const ownerIp = getClientIp(request);
  const record = await getRedirect(env, slug);
  if (!record) {
    return jsonError('Link not found', 404);
  }

  if (record.ownerIp !== ownerIp) {
    return jsonError('You did not make this one, buddy.', 403);
  }

  await deleteRedirect(env, slug, record);
  return jsonResponse({ success: true });
}
