export interface Env {
  REDIRECTS: KVNamespace;
  ASSETS: Fetcher;
  DISCORD_WEBHOOK_URL?: string;
}

export interface StoredRedirect {
  target: string;
  expiresAt: number;
  createdAt: number;
  ownerIp: string;
}

export interface RedirectSummary {
  slug: string;
  target: string;
  expiresAt: number;
  createdAt: number;
}
