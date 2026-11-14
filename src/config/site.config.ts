/**
 * ============================================================================
 *  RESTAURANT CONFIGURATION — the only file you need to edit for a new client.
 * ============================================================================
 *
 *  This default config is the FIRE ALLEY demo (a fictional restaurant).
 *  For a real client:
 *    1. copy `clients/_template.config.ts`, or edit this file,
 *    2. set `mode: 'client'`,
 *    3. run `npm run build` — it refuses to build while demo/placeholder data remains.
 *
 *  See HANDOVER.md for the full guide.
 */
import type { SiteConfig } from './types'

/** Photos live in /public/img. Use `img('name')` for /public/img/name.webp */
const img = (name: string) => `./img/${name}.webp`

const config: SiteConfig = {
  mode: 'demo',

  business: {
    name: 'FIRE ALLEY',
    shortName: 'Fire Alley',
    tagline: 'Street food, cooked loud.',
    seoTitle: 'Fire Alley — Street Food, Cooked Loud',
    seoDescription: 'Fire Alley — smash burgers, stone-fired pizza, street tacos and wings. Cooked loud, served hot.',
    noindex: true,
  },

  locale: { locale: 'en-CA', currency: 'CAD' },

  contact: {
    email: 'hello@firealley.example',
    phone: '+15550100199',
    phoneDisplay: '+1 (555) 010-0199',
    address: 'Downtown Food Alley, Unit 7',
    mapsUrl: null,
    hoursSummary: 'Open daily · 11AM – 1AM',
    hours: [{ days: 'Mon–Sun', hours: '11:00 AM – 1:00 AM' }],
  },

  social: [],

  topbar: ['Concept demo · fictional restaurant', 'Open daily · 11AM – 1AM', 'Pickup & delivery', 'Fresh sauces made every morning'],

  hero: {
    menuCta: 'See the Menu',
    findCta: 'Find Us',
    slides: [
      {
        lines: ['STONE', 'FIRED'],
        image: img('hero-pizza'),
        alt: 'Stone-fired pizza with burrata and fresh greens',
        stickers: ['Blistered', 'Melty', 'Hand-tossed'],
        tagline: 'Pizza pulled straight from the flames.',
        cutout: 'round',
      },
      {
        lines: ['STACKED', '& SMASHED'],
        image: img('hero-burger'),
        alt: 'Double cheeseburger with bacon, lettuce and tomato',
        stickers: ['Juicy', 'Crispy edges', 'Double cheese'],
        tagline: 'Smash burgers with lacy, crackling edges.',
        cutout: 'free',
      },
      {
        lines: ['STREET', 'TACOS'],
        image: img('hero-tacos'),
        alt: 'Three street tacos with salsa and lime',
        stickers: ['Charred', 'Zesty', 'Fresh salsa'],
        tagline: 'Corn tortillas, slow-cooked fillings, bright salsa.',
        cutout: 'round',
      },
    ],
  },

  about: {
    title: 'ABOUT THE ALLEY',
    body: [
      'Fire Alley started with one grill, one truck and a line around the block. We cook the way street food should taste: loud sauces, crackling edges, portions that mean it.',
      'Everything is made to order, from the smash patties to the salsa we chop every morning.',
    ],
    cta: 'Taste the Difference',
    photos: [
      { src: img('about-spread'), alt: 'Grilled skewers and dips on a shared table' },
      { src: img('about-burger'), alt: 'Cheeseburger on a wooden board' },
      { src: img('about-crowd'), alt: 'Friends sharing food at a busy table' },
      { src: img('about-fries'), alt: 'Golden fries on a dark plate' },
    ],
  },

  specials: {
    title: 'STREET SPECIALS',
    lede: 'The ones regulars order without looking at the menu.',
    dishes: [
      { name: 'Loaded Wrap', price: 9.5, img: img('dish-wrap') },
      { name: 'Firecracker Wings', price: 11, img: img('dish-wings'), spicy: true },
      { name: 'Beer-Battered Rings', price: 6.5, img: img('dish-rings') },
      { name: 'Crispy Bucket', price: 13, img: img('dish-chicken') },
      { name: 'Street Dog', price: 7.5, img: img('dish-hotdog') },
      { name: 'Double Smash', price: 12, img: img('dish-smash'), spicy: true },
    ],
  },

  statement: { lines: ['FLAVOR YOU', 'CAN HEAR'], sub: 'The sizzle starts before the first bite.' },

  menu: {
    title: 'THE MENU',
    note: 'Made to order, every time',
    optionGroups: [
      {
        id: 'burger-extras',
        label: 'Extras',
        type: 'multi',
        max: 3,
        choices: [
          { id: 'extra-patty', label: 'Extra patty', price: 3 },
          { id: 'bacon', label: 'Smoked bacon', price: 2 },
          { id: 'cheese', label: 'Extra cheese', price: 1 },
        ],
      },
      {
        id: 'spice',
        label: 'Heat level',
        type: 'single',
        required: true,
        choices: [
          { id: 'mild', label: 'Mild', default: true },
          { id: 'medium', label: 'Medium' },
          { id: 'fire', label: 'Fire' },
        ],
      },
      {
        id: 'wing-size',
        label: 'Size',
        type: 'single',
        required: true,
        choices: [
          { id: '6pc', label: '6 pieces', default: true },
          { id: '10pc', label: '10 pieces', price: 6 },
        ],
      },
      {
        id: 'dip',
        label: 'Dip',
        type: 'single',
        choices: [
          { id: 'ranch', label: 'Ranch', default: true },
          { id: 'blue-cheese', label: 'Blue cheese' },
          { id: 'alley-sauce', label: 'Alley sauce', price: 0.5 },
        ],
      },
    ],
    categories: [
      {
        id: 'burgers',
        label: 'Burgers',
        items: [
          { id: 'classic-smash', name: 'Classic Smash', price: 10, description: 'American cheese, pickles, alley sauce', options: ['burger-extras'] },
          { id: 'double-smash', name: 'Double Smash', price: 12, description: 'Two patties, double cheese', options: ['burger-extras'] },
          { id: 'hot-honey-chicken', name: 'Hot Honey Chicken', price: 11, spicy: true, description: 'Crispy thigh, chili honey, slaw', options: ['spice'] },
          { id: 'bbq-bacon', name: 'BBQ Bacon', price: 13, description: 'Smoked bacon, onion crunch', options: ['burger-extras'] },
          { id: 'mushroom-swiss', name: 'Mushroom Swiss', price: 12, description: 'Roasted mushrooms, swiss', options: ['burger-extras'] },
          { id: 'veggie-crunch', name: 'Veggie Crunch', price: 10, description: 'Crispy chickpea patty' },
        ],
      },
      {
        id: 'pizza',
        label: 'Pizza',
        items: [
          { id: 'margherita', name: 'Margherita', price: 12, description: 'San Marzano, fior di latte, basil' },
          { id: 'pepperoni-blaze', name: 'Pepperoni Blaze', price: 14, spicy: true, description: 'Cup pepperoni, chili oil' },
          { id: 'hot-honey-salami', name: 'Hot Honey Salami', price: 15, spicy: true },
          { id: 'four-cheese', name: 'Four Cheese', price: 14 },
          { id: 'green-garden', name: 'Green Garden', price: 13, description: 'Burrata, rocket, pesto' },
          { id: 'truffle-shroom', name: 'Truffle Shroom', price: 16 },
        ],
      },
      {
        id: 'wings',
        label: 'Wings',
        items: [
          { id: 'wings-buffalo', name: 'Buffalo', price: 11, spicy: true, options: ['wing-size', 'spice', 'dip'] },
          { id: 'wings-bbq', name: 'Smoky BBQ', price: 11, options: ['wing-size', 'dip'] },
          { id: 'wings-lemon-pepper', name: 'Lemon Pepper', price: 11, options: ['wing-size', 'dip'] },
          { id: 'wings-garlic-parm', name: 'Garlic Parm', price: 12, options: ['wing-size', 'dip'] },
          { id: 'wings-gochujang', name: 'Gochujang Glaze', price: 12, spicy: true, options: ['wing-size', 'spice', 'dip'] },
          { id: 'wings-honey-sriracha', name: 'Honey Sriracha', price: 12, spicy: true, options: ['wing-size', 'spice', 'dip'] },
        ],
      },
      {
        id: 'tacos',
        label: 'Tacos & Wraps',
        items: [
          { id: 'al-pastor', name: 'Al Pastor (3)', price: 10, description: 'Pineapple, onion, cilantro', options: ['spice'] },
          { id: 'carne-asada', name: 'Carne Asada (3)', price: 11, options: ['spice'] },
          { id: 'crispy-fish', name: 'Crispy Fish (3)', price: 11 },
          { id: 'shawarma-wrap', name: 'Chicken Shawarma Wrap', price: 9, description: 'Garlic sauce, pickles' },
          { id: 'falafel-wrap', name: 'Falafel Wrap', price: 8 },
          { id: 'loaded-wrap', name: 'Loaded Wrap', price: 9.5, spicy: true, options: ['spice'] },
        ],
      },
      {
        id: 'sides',
        label: 'Sides',
        items: [
          { id: 'fries', name: 'Fries', price: 4 },
          { id: 'loaded-fries', name: 'Loaded Fries', price: 7, spicy: true },
          { id: 'onion-rings', name: 'Onion Rings', price: 6.5, options: ['dip'] },
          { id: 'mac-bites', name: 'Mac Bites', price: 6 },
          { id: 'street-corn', name: 'Street Corn Cup', price: 5 },
          { id: 'slaw', name: 'Crunchy Slaw', price: 3 },
        ],
      },
      {
        id: 'drinks',
        label: 'Drinks',
        items: [
          { id: 'lemonade', name: 'Fresh Lemonade', price: 3.5 },
          { id: 'iced-tea', name: 'Iced Tea', price: 3 },
          { id: 'mango-lassi', name: 'Mango Lassi', price: 4.5 },
          { id: 'cold-brew', name: 'Cold Brew', price: 4 },
          { id: 'milkshake', name: 'Thick Milkshake', price: 6 },
          { id: 'sparkling-water', name: 'Sparkling Water', price: 2.5 },
        ],
      },
    ],
    promo: { kicker: 'All day, every day', title: 'ALLEY COMBO', text: 'Any burger + fries + a drink', price: 15 },
  },

  marquee: [
    ['FAST DELIVERY', 'OPEN LATE', 'FRESH DAILY', 'MADE TO ORDER'],
    ['SMASHED', 'STACKED', 'SAUCED', 'SERVED HOT'],
    ['CRISPY', 'SPICY', 'SHAREABLE', 'LOUD FLAVOR'],
  ],

  difference: {
    title: 'TASTE THE DIFFERENCE',
    lede: 'Street food done right, one order at a time.',
    photo: { src: img('feature-burger'), alt: 'Tall cheeseburger dripping with cheese' },
    features: [
      { icon: 'leaf', title: 'Fresh every morning', text: 'Produce in at 7, prepped by 9.' },
      { icon: 'drop', title: 'Sauces made in-house', text: 'Seven sauces, zero bottles.' },
      { icon: 'flame', title: 'Cooked to order', text: 'Nothing waits under a lamp.' },
      { icon: 'bolt', title: 'Served blazing hot', text: 'Grill to hand in minutes.' },
    ],
  },

  reviews: {
    title: 'LOVED LOUDLY',
    source: { label: 'Sample reviews', isSample: true },
    items: [
      { initials: 'MK', name: 'Maya K.', rating: 5, text: 'The double smash has the crispiest edges I have ever had. I dream about the alley sauce.' },
      { initials: 'JR', name: 'Jonas R.', rating: 5, text: 'Came for wings, stayed for the pizza. The hot honey salami is unreal.' },
      { initials: 'SA', name: 'Sara A.', rating: 5, text: 'Fast, loud, delicious. Exactly what late-night food should be.' },
      { initials: 'DL', name: 'Dev L.', rating: 5, text: 'Portions are huge and the tacos taste like a street corner in Mexico City.' },
      { initials: 'NO', name: 'Noor O.', rating: 5, text: 'The shawarma wrap with garlic sauce is my weekly ritual now.' },
      { initials: 'TB', name: 'Theo B.', rating: 5, text: 'Best onion rings in town. Crunch you can hear across the room.' },
    ],
  },

  gallery: {
    title: 'LIFE IN THE ALLEY',
    lede: 'Real food, loud nights, good people.',
    endText: ['FOOD TASTES', 'BETTER', 'TOGETHER'],
    items: [
      { src: img('gallery-diner'), caption: 'Late-night booths' },
      { src: img('gallery-tacos'), caption: 'Taco line-up' },
      { src: img('gallery-truck'), caption: 'Where it started' },
      { src: img('gallery-steak'), caption: 'Steak frites Friday' },
      { src: img('gallery-shawarma'), caption: 'The spit never stops' },
      { src: img('gallery-ribs'), caption: 'Low and slow' },
      { src: img('gallery-burgerfries'), caption: 'The classic' },
      { src: img('gallery-bar'), caption: 'Drinks on tap' },
    ],
  },

  whyUs: {
    title: ['WHY WE HIT', 'DIFFERENT'],
    features: [
      { icon: 'moon', title: 'Open late', text: 'Kitchen fires until 1AM.' },
      { icon: 'plate', title: 'Big portions', text: 'Nobody leaves hungry.' },
      { icon: 'clock', title: 'No long waits', text: 'Most orders in under 8 minutes.' },
      { icon: 'truck', title: 'Delivery', text: 'Hot to your door across downtown.' },
      { icon: 'combo', title: 'Combo friendly', text: 'Mix, match and save.' },
      { icon: 'drop', title: 'House sauces', text: 'Made fresh every single day.' },
    ],
    favoritesTitle: "Chef's favorites",
    favorites: [
      { name: 'Street Dog', price: 7.5, img: img('dish-hotdog') },
      { name: 'Double Smash', price: 12, img: img('dish-smash') },
    ],
    cta: 'View Full Menu',
  },

  order: {
    title: ['ORDER BOLD.', 'EAT LOUD.'],
    text: 'Skip the line. Order pickup or delivery and get it hot, fast, and exactly how you like it.',
    pickupLabel: 'Order Pickup',
    deliveryLabel: 'Order Delivery',
    photos: [img('order-burger'), img('order-pepperoni'), img('order-shake'), img('order-tacos')],
  },

  contactSection: {
    title: 'COME HUNGRY',
    photo: { src: img('gallery-truck'), alt: 'Our street-food truck' },
    ringText: 'STREET FOOD • COOKED LOUD',
  },

  footer: { ticker: ['Smash burgers', 'Stone-fired pizza', 'Street tacos', 'Wings', 'Late-night bites', 'House sauces'] },

  ordering: {
    provider: { type: 'demo' },
    payment: { type: 'pay-on-collection', note: 'Pay in store at pickup, or to the driver on delivery.' },
    pickup: { enabled: true, estimate: '15–20 min' },
    delivery: { enabled: true, fee: 4.99, minimumOrder: 15, estimate: '35–45 min', area: 'Downtown only' },
    taxes: [{ label: 'HST', rate: 0.13 }],
    requireEmail: false,
    maxQuantity: 20,
  },

  reservations: { enabled: false, url: '', label: 'Book a table' },

  credits: {
    studio: { name: 'AETHER Studio', url: 'https://aether-immersive-studio.vercel.app/' },
    photoCredits: { prefix: 'Photos from Unsplash (Unsplash License)', label: 'Photo credits', url: './credits.html' },
  },

  demo: {
    notice: 'Demo details · Fire Alley is a fictional restaurant',
    footerNotice: 'Fire Alley is a fictional restaurant: a concept website',
    footerDisclaimer: 'Menu, reviews, address, phone and email are illustrative only.',
    reviewsLabel: 'Sample reviews · not real customers',
    orderNote: 'Demo: try the checkout. Orders are not sent.',
  },
}

export default config
