/** E2E fixture: a client in client mode with Stripe Checkout (checkout-redirect) payments. */
import { clientConfig, demo } from '../helpers'

export default clientConfig({
  ordering: {
    ...demo.ordering,
    provider: { type: 'endpoint', url: '/api/order' },
    payment: { type: 'checkout-redirect', statusUrl: '/api/payment-status', note: 'You will pay on a secure Stripe page.' },
  },
})
