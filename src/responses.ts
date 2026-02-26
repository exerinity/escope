const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

export function corsHeaders(): Record<string, string> {
  return { ...BASE_CORS_HEADERS };
}

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = {
    'content-type': 'application/json',
    ...corsHeaders(),
    ...(init.headers || {}),
  };

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function jsonError(message: string, status = 400): Response {
  return jsonResponse({ error: message }, { status });
}
