import { handleCreateLink, handleDeleteLink, handleListLinks } from './handlers/api';
import { handleRedirect } from './handlers/redirect';
import { corsHeaders, jsonError } from './responses';
import { getClientIp, normalizeSlug } from './utils';
import { Env } from './types';
import { getBlockStatus, duringTempBlockRequest, hasCooldown, onRateLimited, setCooldown, getDailyCount, incrementDailyCount } from './rate_limit';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = getClientIp(request);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/i/')) {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname.startsWith('/i/')) {
      const bl = await getBlockStatus(env, clientIp);
      if (bl.status === 'perm') {
        return jsonError('Forbidden', 403);
      }
      if (bl.status === 'temp') {
        const escalated = await duringTempBlockRequest(env, clientIp);
        if (escalated === 'perm_blocked') {
          return jsonError('Forbidden', 403);
        }
        return jsonError('Temporarily blocked', 403);
      }
    }

    if (request.method === 'GET') {
      if (url.pathname === '/') {
        const rewritten = new URL(url.toString());
        rewritten.pathname = '/home.html';
        return env.ASSETS.fetch(new Request(rewritten.toString(), request));
      }
      if (url.pathname === '/home') {
        const rewritten = new URL(url.toString());
        rewritten.pathname = '/home.html';
        return env.ASSETS.fetch(new Request(rewritten.toString(), request));
      }
      if (url.pathname === '/privacy') {
        const rewritten = new URL(url.toString());
        rewritten.pathname = '/privacy.html';
        return env.ASSETS.fetch(new Request(rewritten.toString(), request));
      }
      if (url.pathname === '/rules') {
        const rewritten = new URL(url.toString());
        rewritten.pathname = '/rules.html';
        return env.ASSETS.fetch(new Request(rewritten.toString(), request));
      }
      if (url.pathname === '/release_notes') {
        const rewritten = new URL(url.toString());
        rewritten.pathname = '/release_notes.html';
        return env.ASSETS.fetch(new Request(rewritten.toString(), request));
      }

      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    }

    if (url.pathname === '/i/rules' && request.method === 'POST') {
      if (await hasCooldown(env, clientIp)) {
        await onRateLimited(env, clientIp);
        return jsonError('Too many requests, wait 5s', 429);
      }
      const daily = await getDailyCount(env, clientIp);
      if (daily >= 20) {
        await onRateLimited(env, clientIp);
        return jsonError('Daily limit reached (20)', 429);
      }

      const resp = await handleCreateLink(request, env, url, ctx);
      if (resp.ok) {
        await setCooldown(env, clientIp, 5);
        await incrementDailyCount(env, clientIp);
      }
      return resp;
    }

    if (url.pathname === '/i/mine' && request.method === 'GET') {
      return handleListLinks(request, env, url);
    }

    if (url.pathname.startsWith('/i/rules/') && request.method === 'DELETE') {
      const slugPart = url.pathname.replace('/i/rules/', '');
      const slug = normalizeSlug(slugPart);
      if (!slug) {
        return jsonError('Invalid slug', 400);
      }
      return handleDeleteLink(request, env, slug);
    }

    const slug = normalizeSlug(url.pathname);
    if (request.method === 'GET' && slug) {
      return handleRedirect(slug, env, request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
