import { handleCreateLink, handleDeleteLink, handleListLinks, handleResolveLink } from './handlers/api';
import { handleRedirect } from './handlers/redirect';
import { getBlockStatus, duringTempBlockRequest, hasCooldown, onRateLimited, setCooldown, getDailyCount, incrementDailyCount } from './rate_limit';
import { corsHeaders, jsonError } from './responses';
import { Env } from './types';
import { getClientIp, normalizeSlug } from './utils';

function createAssetRequest(request: Request, pathname: string): Request {
  const rewritten = new URL(request.url);
  rewritten.pathname = pathname;
  return new Request(rewritten.toString(), {
    method: 'GET',
    headers: new Headers({ 'accept-encoding': 'identity' }),
  });
}

async function serveAssetPage(env: Env, request: Request, pathname: string, status = 200): Promise<Response> {
  const assetRequest = createAssetRequest(request, pathname);
  const asset = await env.ASSETS.fetch(assetRequest);
  return new Response(asset.body, { headers: asset.headers, status });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = getClientIp(request);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/back/')) {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname.startsWith('/back/')) {
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
        return serveAssetPage(env, request, '/home.html');
      }
      if (url.pathname === '/home') {
        return serveAssetPage(env, request, '/home.html');
      }
      if (url.pathname === '/privacy') {
        return serveAssetPage(env, request, '/privacy.html');
      }
      if (url.pathname === '/rules') {
        return serveAssetPage(env, request, '/rules.html');
      }
      if (url.pathname === '/release_notes') {
        return serveAssetPage(env, request, '/release_notes.html');
      }
      if (url.pathname === '/resolve') {
        return serveAssetPage(env, request, '/resolve.html');
      }

      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    }

    if (url.pathname === '/back/new' && request.method === 'POST') {
      if (await hasCooldown(env, clientIp)) {
        await onRateLimited(env, clientIp);
        return jsonError('Too many requests, wait 5s', 429);
      }
      const daily = await getDailyCount(env, clientIp);
      if (daily >= 50) {
        await onRateLimited(env, clientIp);
        return jsonError('Daily limit reached (50)', 429);
      }

      const resp = await handleCreateLink(request, env, url, ctx);
      if (resp.ok) {
        await setCooldown(env, clientIp, 5);
        await incrementDailyCount(env, clientIp);
      }
      return resp;
    }

    if (url.pathname === '/back/mine' && request.method === 'GET') {
      return handleListLinks(request, env, url);
    }

    if (url.pathname === '/back/resolve' && request.method === 'GET') {
      return handleResolveLink(request, env, url);
    }

    if (url.pathname.startsWith('/back/scope/') && request.method === 'DELETE') {
      const slugPart = url.pathname.replace('/back/scope/', '');
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

    return serveAssetPage(env, request, '/not-found.html', 404);
  },
};
