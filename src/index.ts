import { handleCreateLink, handleDeleteLink, handleListLinks } from './handlers/api';
import { handleRedirect } from './handlers/redirect';
import { corsHeaders, jsonError } from './responses';
import { getClientIp, normalizeSlug } from './utils';
import { Env } from './types';
import { isBlacklisted } from './blacklist';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = getClientIp(request);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/i/')) {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method === 'GET') {
      if (url.pathname === '/') {
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

      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    }

    if (url.pathname === '/i/rules' && request.method === 'POST') {
      if (await isBlacklisted(env, clientIp)) {
        return jsonError('Forbidden', 403);
      }
      return handleCreateLink(request, env, url);
    }

    if (url.pathname === '/i/mine' && request.method === 'GET') {
      if (await isBlacklisted(env, clientIp)) {
        return jsonError('Forbidden', 403);
      }
      return handleListLinks(request, env, url);
    }

    if (url.pathname.startsWith('/i/rules/') && request.method === 'DELETE') {
      if (await isBlacklisted(env, clientIp)) {
        return jsonError('Forbidden', 403);
      }
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
