/**
 * Types for the restaurant configuration (`site.config.ts`).
 * Visual components read everything from the config, so a new client = a new config file.
 */

export type Mode = 'demo' | 'client'

export interface Photo {
  src: string
  alt: string
}

/** Icon names available in src/lib/Icon.tsx */
export type IconName =
  | 'flame' | 'chili' | 'star' | 'bolt' | 'leaf' | 'drop' | 'moon' | 'plate' | 'clock'
  | 'truck' | 'combo' | 'heart' | 'pin' | 'mail' | 'phone' | 'arrow' | 'left' | 'right'
  | 'instagram' | 'facebook' | 'tiktok' | 'x' | 'youtube' | 'globe'

export interface HeroSlide {
  /** Two headline lines: line 1 sits behind the dish, line 2 in front. */
  lines: [string, string]
  image: string
  alt: string
  stickers: [string, string, string]
  tagline: string
  /** 'round' for circular plate cut-outs, 'free' for free-form cut-outs (e.g. a burger). */
  cutout: 'round' | 'free'
}

export interface OptionChoice {
  id: string
  label: string
  /** Extra cost added to the item, in the configured currency. */
  price?: number
  default?: boolean
}

export interface OptionGroup {
  id: string
  label: string
  /** 'single' = radio (one choice), 'multi' = checkboxes. */
  type: 'single' | 'multi'
  required?: boolean
  /** For 'multi': maximum number of choices. */
  max?: number
  choices: OptionChoice[]
}

export interface MenuItem {
  /** Stable id — used by the cart and by the server to look up the real price. */
  id: string
  name: string
  price: number
  description?: string
  spicy?: boolean
  /** Option group ids from `menu.optionGroups` that apply to this item. */
  options?: string[]
  /** false = shown on the menu but cannot be ordered online. */
  orderable?: boolean
}

export interface MenuCategory {
  id: string
  label: string
  items: MenuItem[]
}

export interface Dish {
  name: string
  price: number
  img: string
  spicy?: boolean
}

export interface Feature {
  icon: IconName
  title: string
  text: string
}

export interface Review {
  name: string
  initials: string
  text: string
  /** 1–5 */
  rating?: number
}

export interface SocialLink {
  network: 'instagram' | 'facebook' | 'tiktok' | 'x' | 'youtube' | 'website'
  url: string
  label?: string
}

export interface OpeningHours {
  /** e.g. 'Mon–Thu' */
  days: string
  /** e.g. '11:00 AM – 11:00 PM' or 'Closed' */
  hours: string
}

/* --------------------------- ordering --------------------------- */

/**
 * How orders are placed.
 * - demo      cart + checkout work, but NOTHING is sent. The UI says so clearly.
 * - endpoint  orders are POSTed as JSON to a URL you control (see server/README.md).
 * - external  Order buttons open the client's ordering platform (Square, Toast, Uber Eats…).
 * - phone     Order buttons call the restaurant.
 * - disabled  no ordering; Order buttons point to the menu and contact sections instead.
 */
export type OrderingProvider =
  | { type: 'demo' }
  | { type: 'endpoint'; url: string; timeoutMs?: number }
  | { type: 'external'; pickupUrl?: string; deliveryUrl?: string }
  | { type: 'phone' }
  | { type: 'disabled' }

/**
 * How customers pay (only used by the 'endpoint' provider).
 * - pay-on-collection  pay in store / to the driver; the order is just submitted.
 * - checkout-redirect  the endpoint returns `{ checkoutUrl }` (e.g. a Stripe Checkout Session
 *                      created server-side with the client's secret key) and the browser goes there.
 */
export type PaymentConfig =
  | { type: 'pay-on-collection'; note?: string }
  | { type: 'checkout-redirect'; note?: string }

export interface Tax {
  label: string
  /** 0.13 = 13% */
  rate: number
}

export interface OrderingConfig {
  provider: OrderingProvider
  payment: PaymentConfig
  pickup: { enabled: boolean; estimate?: string }
  delivery: {
    enabled: boolean
    fee: number
    minimumOrder?: number
    estimate?: string
    /** Shown to customers, e.g. 'Downtown only (5 km)'. */
    area?: string
  }
  taxes: Tax[]
  requireEmail: boolean
  /** Max quantity of one line. */
  maxQuantity: number
}

/* ----------------------------- site ----------------------------- */

export interface SiteConfig {
  /**
   * 'demo'   sample content is allowed and clearly labelled as fictional.
   * 'client' real business only: the build FAILS if placeholder/demo data is still present.
   */
  mode: Mode

  business: {
    name: string
    shortName: string
    tagline: string
    /** Optional logo image; when omitted the flame icon + name is used. */
    logo?: { src: string; alt: string; height?: number }
    /** Used in the browser title and search description. */
    seoTitle: string
    seoDescription: string
    /** true = ask search engines not to index (always true in demo mode). */
    noindex?: boolean
  }

  locale: {
    /** BCP-47, e.g. 'en-CA' */
    locale: string
    /** ISO 4217, e.g. 'CAD' */
    currency: string
  }

  contact: {
    email: string
    /** Digits for the tel: link, e.g. '+15550100199' */
    phone: string
    /** How the phone number is displayed. */
    phoneDisplay: string
    address: string
    /** A Google Maps (or Apple Maps) link to the exact location. */
    mapsUrl: string | null
    hoursSummary: string
    hours: OpeningHours[]
  }

  social: SocialLink[]

  /** Short items scrolling in the orange bar at the very top. */
  topbar: string[]

  hero: { slides: HeroSlide[]; menuCta: string; findCta: string }

  about: { title: string; body: string[]; cta: string; photos: [Photo, Photo, Photo, Photo] }

  specials: { title: string; lede: string; dishes: Dish[] }

  statement: { lines: [string, string]; sub: string }

  menu: {
    title: string
    note: string
    categories: MenuCategory[]
    optionGroups: OptionGroup[]
    promo: { kicker: string; title: string; text: string; price: number } | null
  }

  marquee: [string[], string[], string[]]

  difference: { title: string; lede: string; photo: Photo; features: [Feature, Feature, Feature, Feature] }

  reviews: {
    title: string
    /**
     * Where the reviews come from. In client mode reviews are only shown when this is set and
     * `isSample` is false — the site never shows invented testimonials as real.
     */
    source: { label: string; url?: string; isSample: boolean } | null
    items: Review[]
  }

  gallery: { title: string; lede: string; endText: [string, string, string]; items: { src: string; caption: string }[] }

  whyUs: { title: [string, string]; features: Feature[]; favoritesTitle: string; favorites: Dish[]; cta: string }

  order: {
    title: [string, string]
    text: string
    pickupLabel: string
    deliveryLabel: string
    photos: [string, string, string, string]
  }

  contactSection: { title: string; photo: Photo; ringText: string }

  footer: { ticker: string[] }

  ordering: OrderingConfig

  /** Optional table reservations through the client's own provider (OpenTable, Resy, Tock…). */
  reservations: { enabled: boolean; url: string; label: string }

  credits: {
    /** "Website by …" credit. Set to null to hide. */
    studio: { name: string; url: string } | null
    /** e.g. prefix 'Photos from Unsplash (Unsplash License)', link label 'Photo credits'. */
    photoCredits: { prefix?: string; label: string; url: string } | null
  }

  /** Text shown only in demo mode to make clear the business is fictional. */
  demo: {
    /** Chip in the contact section. */
    notice: string
    /** Footer: "<footerNotice> designed and built by <studio>. <footerDisclaimer>" */
    footerNotice: string
    footerDisclaimer: string
    /** Tag next to the reviews arrows. */
    reviewsLabel: string
    /** Small line under the Order buttons when the provider is 'demo'. */
    orderNote: string
  }
}
