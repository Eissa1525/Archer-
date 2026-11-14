/** E2E helper: the real order handlers + fixture configs, bundled for a local Node test server. */
export { handleOrderRequest, handlePaymentStatus } from '../../server/order-handler'
export { default as site } from './client-endpoint.config'
export { default as stripeSite } from './client-stripe.config'
