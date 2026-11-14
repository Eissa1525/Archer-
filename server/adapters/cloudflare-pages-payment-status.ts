/**
 * Cloudflare Pages Functions adapter for GET /api/payment-status (online payment only).
 * To activate: copy to `functions/api/payment-status.ts` and fix the two imports (one level deeper).
 * Needs STRIPE_SECRET_KEY in the Pages project settings.
 */
import { handlePaymentStatus, type Env } from '../order-handler'
import site from '../../src/config/site.config'

export const onRequest = (context: { request: Request; env: Env }) => handlePaymentStatus(context.request, context.env, site)
