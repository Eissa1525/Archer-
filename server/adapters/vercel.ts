/**
 * Vercel adapter (Edge runtime).
 * To activate: copy this file to `api/order.ts` at the project root and set the env variables in
 * the Vercel project settings.
 */
import { handleOrderRequest, type Env } from '../order-handler'
import site from '../../src/config/site.config'

export const config = { runtime: 'edge' }

export default function handler(request: Request) {
  return handleOrderRequest(request, process.env as unknown as Env, site)
}
