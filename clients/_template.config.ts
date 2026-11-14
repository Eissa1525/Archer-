/**
 * TEMPLATE for a real client. Copy to `src/config/site.config.ts` (simplest), or keep it here as
 * `clients/<client>.config.ts` and build with:  SITE_CONFIG=clients/<client>.config.ts npm run build
 *
 * Every "TODO" must be replaced — the build refuses to run in client mode while any remain.
 * Sections you don't change (hero texts, marquee, etc.) are inherited from the Fire Alley demo
 * below, so review them all: they describe Fire Alley's food.
 */
import type { SiteConfig } from '../src/config/types'
import demo from '../src/config/site.config'

const img = (name: string) => `./img/${name}.webp`

const config: SiteConfig = {
  ...demo,
  mode: 'client',

  business: {
    name: 'TODO NAME', // shown huge in the hero loader, header and footer — keep it short
    shortName: 'TODO Name',
    tagline: 'TODO tagline',
    // logo: { src: img('logo'), alt: 'TODO Name logo', height: 34 },
    seoTitle: 'TODO Name — TODO what you serve in TODO city',
    seoDescription: 'TODO one or two sentences for Google results.',
    noindex: false,
  },

  locale: { locale: 'en-CA', currency: 'CAD' },

  contact: {
    email: 'TODO@restaurant.com',
    phone: '+1TODO', // digits only, e.g. +14165550123
    phoneDisplay: 'TODO (416) 555-0123',
    address: 'TODO 123 Main St, Toronto, ON',
    mapsUrl: 'https://maps.google.com/?q=TODO', // Google Maps → Share → Copy link
    hoursSummary: 'TODO Open daily · 11AM – 10PM',
    hours: [
      { days: 'TODO Mon–Thu', hours: '11:00 AM – 10:00 PM' },
      { days: 'TODO Fri–Sat', hours: '11:00 AM – 12:00 AM' },
      { days: 'TODO Sun', hours: 'Closed' },
    ],
  },

  social: [
    // { network: 'instagram', url: 'https://instagram.com/TODO' },
    // { network: 'facebook', url: 'https://facebook.com/TODO' },
  ],

  topbar: ['TODO 123 Main St', 'TODO Open daily · 11AM – 10PM', 'Pickup & delivery', 'TODO short fact'],

  reviews: {
    ...demo.reviews,
    // Only real reviews, copied with permission from a public source (e.g. Google). Or leave
    // items empty to hide the section.
    source: null,
    items: [],
  },

  ordering: {
    ...demo.ordering,
    // Pick ONE: { type: 'endpoint', url: '/api/order' } | { type: 'external', pickupUrl, deliveryUrl }
    //           | { type: 'phone' } | { type: 'disabled' }
    provider: { type: 'phone' },
    payment: { type: 'pay-on-collection', note: 'Pay in store at pickup, or to the driver on delivery.' },
    taxes: [{ label: 'HST', rate: 0.13 }], // TODO check the client's province / tax registration
  },

  reservations: { enabled: false, url: '', label: 'Book a table' },

  credits: {
    studio: { name: 'AETHER Studio', url: 'https://aether-immersive-studio.vercel.app/' },
    // keep if Unsplash photos are still used; remove when all photos are the client's own
    photoCredits: { prefix: 'Some photos from Unsplash', label: 'Photo credits', url: './credits.html' },
  },

  // replace the Fire Alley photos and copy section by section, e.g.:
  // about: { ...demo.about, title: 'TODO', body: ['TODO'], photos: [ { src: img('about-1'), alt: 'TODO' }, … ] },
}
void img

export default config
