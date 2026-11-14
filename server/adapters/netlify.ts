/**
 * Netlify Functions adapter (v2, Web-standard).
 * To activate: copy this file to `netlify/functions/order.ts` and set the env variables in the
 * Netlify site settings. The `config.path` below serves it at /api/order.
 */
import { handleOrderRequest, type Env } from '../order-handler'
import site from '../../src/config/site.config'

export const config = { path: '/api/order' }

export default function handler(request: Request) {
  return handleOrderRequest(request, process.env as unknown as Env, site)
}
