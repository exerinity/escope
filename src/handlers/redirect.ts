import { Env } from '../types';
import { deleteRedirect, getRedirect } from '../storage';

export async function handleRedirect(slug: string, env: Env, request?: Request): Promise<Response> {
  const record = await getRedirect(env, slug);
  if (!record) {
    const base = new URL(request?.url ?? 'https://local');
    base.pathname = '/not-found.html';
    const asset = await env.ASSETS.fetch(new Request(base.toString(), request));
    return new Response(asset.body, { headers: asset.headers, status: 404 });
  }

  if (Date.now() >= record.expiresAt) {
    await deleteRedirect(env, slug, record);
    const base = new URL(request?.url ?? 'https://local');
    base.pathname = '/expired.html';
    const asset = await env.ASSETS.fetch(new Request(base.toString(), request));
    return new Response(asset.body, { headers: asset.headers, status: 410 });
  }

  return Response.redirect(record.target, 302);
}
