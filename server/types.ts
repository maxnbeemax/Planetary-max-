export interface Bindings {
  DB: D1Database;
  AI: Ai;
  ASSETS: Fetcher;
  SESSION_KV: KVNamespace;
  NODE_REGISTRY: DurableObjectNamespace;
  BEEMAX_SECURE_REGISTRY: DurableObjectNamespace;
  PAYMENT_WEBHOOK_SECRET?: string;
  PROVENANCE_SECRET?: string;
  ENVIRONMENT?: string;
  PROTOCOL_VERSION?: string;
}
