/**
 * Cloudflare Pages Functions adapter.
 * To activate: copy this file to `functions/api/order.ts` at the project root (Pages picks up
 * `functions/` automatically) and set the env variables in the Pages project settings.
 * For Stripe, also copy it as `functions/api/stripe-webhook.ts` and switch the handler (see README).
 */
import { handleOrderRequest, type Env } from '../order-handler'
import site from '../../src/config/site.config'

export const onRequest = (context: { request: Request; env: Env }) => handleOrderRequest(context.request, context.env, site)
