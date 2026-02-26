export interface Env {
  REDIRECTS: KVNamespace;
  ASSETS: Fetcher;
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
}
