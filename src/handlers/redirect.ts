import { Env } from '../types';
import { deleteRedirect, getRedirect } from '../storage';

function createAssetRequest(request: Request | undefined, pathname: string): Request {
  const base = new URL(request?.url ?? 'https://local');
  base.pathname = pathname;
  return new Request(base.toString(), {
    method: 'GET',
    headers: new Headers({ 'accept-encoding': 'identity' }),
  });
}

async function serveNotFound(env: Env, request?: Request, status = 404): Promise<Response> {
  const assetRequest = createAssetRequest(request, '/not-found.html');
  const asset = await env.ASSETS.fetch(assetRequest);
  return new Response(asset.body, { headers: asset.headers, status });
}

export async function handleRedirect(slug: string, env: Env, request?: Request): Promise<Response> {
  const record = await getRedirect(env, slug);
  if (!record) {
    return serveNotFound(env, request, 404);
  }

  if (Date.now() >= record.expiresAt) {
    await deleteRedirect(env, slug, record);
    return serveNotFound(env, request, 404);
  }

  return Response.redirect(record.target, 302);
}