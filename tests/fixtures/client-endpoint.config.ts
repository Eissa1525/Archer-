/** E2E fixture: a "real client" in client mode, ordering through the server handler at /api/order. */
import { clientConfig } from '../helpers'

export default clientConfig({
  social: [
    { network: 'instagram', url: 'https://instagram.com/smokehouse.test' },
    { network: 'facebook', url: 'https://facebook.com/smokehouse.test' },
  ],
  reservations: { enabled: true, url: 'https://www.opentable.com/r/smokehouse-test', label: 'Book a table' },
})
