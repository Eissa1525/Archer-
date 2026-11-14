/**
 * Cloudflare Pages Functions adapter for POST /api/stripe-webhook (online payment only).
 * To activate: copy to `functions/api/stripe-webhook.ts`, fix the two imports (one level deeper),
 * create a KV namespace and bind it to the Pages project as `ORDERS_KV`.
 * The KV namespace makes the webhook idempotent: Stripe retries never create a second kitchen order.
 * Without the binding the webhook answers 503 (Stripe keeps retrying) instead of risking duplicates.
 */
import { handleStripeWebhook, type Env, type KeyValueStore } from '../order-handler'
import site from '../../src/config/site.config'

export const onRequest = (context: { request: Request; env: Env & { ORDERS_KV?: KeyValueStore } }) =>
  handleStripeWebhook(context.request, context.env, site, { store: context.env.ORDERS_KV ?? null })
