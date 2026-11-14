import demo from '../src/config/site.config'
import type { SiteConfig } from '../src/config/types'

/** A complete, valid "real client" config for tests. */
export function clientConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    ...demo,
    mode: 'client',
    topbar: ['12 King St W', 'Open daily · 11AM – 10PM', 'Pickup & delivery'],
    business: { ...demo.business, name: 'SMOKE HOUSE', shortName: 'Smoke House', seoTitle: 'Smoke House', seoDescription: 'BBQ in Toronto.', noindex: false },
    contact: {
      email: 'orders@smokehouse.ca',
      phone: '+14163682200',
      phoneDisplay: '(416) 368-2200',
      address: '12 King St W, Toronto, ON',
      mapsUrl: 'https://maps.google.com/?q=12+King+St+W+Toronto',
      hoursSummary: 'Open daily · 11AM – 10PM',
      hours: [{ days: 'Mon–Sun', hours: '11:00 AM – 10:00 PM' }],
    },
    reviews: { ...demo.reviews, source: null, items: [] },
    ordering: { ...demo.ordering, provider: { type: 'endpoint', url: '/api/order' } },
    demo: demo.demo,
    ...overrides,
  }
}

export { demo }

/** A fetch stub that records calls and answers with the given responses in order. */
export function fakeFetch(...responses: (Response | Error)[]) {
  const calls: { url: string; init?: RequestInit }[] = []
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    const r = responses.length > 1 ? responses.shift()! : responses[0]
    if (r instanceof Error) throw r
    return r.clone()
  }) as typeof fetch
  return { fn, calls }
}

export const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
