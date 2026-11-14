/** Test fixture: a demo that tries to send real orders. The build must refuse it. */
import demo from '../../src/config/site.config'
import type { SiteConfig } from '../../src/config/types'

const unsafe: SiteConfig = { ...demo, ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' } } }
export default unsafe
