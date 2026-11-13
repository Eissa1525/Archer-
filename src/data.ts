/**
 * All brand content lives here. Rename the brand, change prices or swap photos in one place.
 * Address, phone and email are placeholders.
 */
const img = (name: string) => `./img/${name}.webp`

export const brand = {
  name: 'FIRE ALLEY',
  short: 'Fire Alley',
  tagline: 'Street food, cooked loud.',
  topbar: ['Downtown Food Alley', 'Open daily · 11AM – 1AM', 'Pickup & delivery', 'Fresh sauces made every morning'],
}

export interface Slide {
  lines: [string, string]
  image: string
  alt: string
  stickers: string[]
  tagline: string
  cutout: 'round' | 'free'
}

export const slides: Slide[] = [
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
]

export const about = {
  title: 'ABOUT THE ALLEY',
  body: [
    'Fire Alley started with one grill, one truck and a line around the block. We cook the way street food should taste: loud sauces, crackling edges, portions that mean it.',
    'Everything is made to order, from the smash patties to the salsa we chop every morning.',
  ],
  photos: [
    { src: img('about-spread'), alt: 'Grilled skewers and dips on a shared table' },
    { src: img('about-burger'), alt: 'Cheeseburger on a wooden board' },
    { src: img('about-crowd'), alt: 'Friends sharing food at a busy table' },
    { src: img('about-fries'), alt: 'Golden fries on a dark plate' },
  ],
}

export const specials = [
  { name: 'Loaded Wrap', price: 9.5, img: img('dish-wrap') },
  { name: 'Firecracker Wings', price: 11, img: img('dish-wings'), hot: true },
  { name: 'Beer-Battered Rings', price: 6.5, img: img('dish-rings') },
  { name: 'Crispy Bucket', price: 13, img: img('dish-chicken') },
  { name: 'Street Dog', price: 7.5, img: img('dish-hotdog') },
  { name: 'Double Smash', price: 12, img: img('dish-smash'), hot: true },
]

export interface MenuItem {
  name: string
  price: number
  hot?: boolean
  note?: string
}

export const menu: { id: string; label: string; items: MenuItem[] }[] = [
  {
    id: 'burgers',
    label: 'Burgers',
    items: [
      { name: 'Classic Smash', price: 10, note: 'American cheese, pickles, alley sauce' },
      { name: 'Double Smash', price: 12, note: 'Two patties, double cheese' },
      { name: 'Hot Honey Chicken', price: 11, hot: true, note: 'Crispy thigh, chili honey, slaw' },
      { name: 'BBQ Bacon', price: 13, note: 'Smoked bacon, onion crunch' },
      { name: 'Mushroom Swiss', price: 12, note: 'Roasted mushrooms, swiss' },
      { name: 'Veggie Crunch', price: 10, note: 'Crispy chickpea patty' },
    ],
  },
  {
    id: 'pizza',
    label: 'Pizza',
    items: [
      { name: 'Margherita', price: 12, note: 'San Marzano, fior di latte, basil' },
      { name: 'Pepperoni Blaze', price: 14, hot: true, note: 'Cup pepperoni, chili oil' },
      { name: 'Hot Honey Salami', price: 15, hot: true },
      { name: 'Four Cheese', price: 14 },
      { name: 'Green Garden', price: 13, note: 'Burrata, rocket, pesto' },
      { name: 'Truffle Shroom', price: 16 },
    ],
  },
  {
    id: 'wings',
    label: 'Wings',
    items: [
      { name: 'Buffalo', price: 11, hot: true },
      { name: 'Smoky BBQ', price: 11 },
      { name: 'Lemon Pepper', price: 11 },
      { name: 'Garlic Parm', price: 12 },
      { name: 'Gochujang Glaze', price: 12, hot: true },
      { name: 'Honey Sriracha', price: 12, hot: true },
    ],
  },
  {
    id: 'tacos',
    label: 'Tacos & Wraps',
    items: [
      { name: 'Al Pastor (3)', price: 10, note: 'Pineapple, onion, cilantro' },
      { name: 'Carne Asada (3)', price: 11 },
      { name: 'Crispy Fish (3)', price: 11 },
      { name: 'Chicken Shawarma Wrap', price: 9, note: 'Garlic sauce, pickles' },
      { name: 'Falafel Wrap', price: 8 },
      { name: 'Loaded Wrap', price: 9.5, hot: true },
    ],
  },
  {
    id: 'sides',
    label: 'Sides',
    items: [
      { name: 'Fries', price: 4 },
      { name: 'Loaded Fries', price: 7, hot: true },
      { name: 'Onion Rings', price: 6.5 },
      { name: 'Mac Bites', price: 6 },
      { name: 'Street Corn Cup', price: 5 },
      { name: 'Crunchy Slaw', price: 3 },
    ],
  },
  {
    id: 'drinks',
    label: 'Drinks',
    items: [
      { name: 'Fresh Lemonade', price: 3.5 },
      { name: 'Iced Tea', price: 3 },
      { name: 'Mango Lassi', price: 4.5 },
      { name: 'Cold Brew', price: 4 },
      { name: 'Thick Milkshake', price: 6 },
      { name: 'Sparkling Water', price: 2.5 },
    ],
  },
]

export const marqueeRows = [
  ['FAST DELIVERY', 'OPEN LATE', 'FRESH DAILY', 'MADE TO ORDER'],
  ['SMASHED', 'STACKED', 'SAUCED', 'SERVED HOT'],
  ['CRISPY', 'SPICY', 'SHAREABLE', 'LOUD FLAVOR'],
]

export const difference = {
  title: 'TASTE THE DIFFERENCE',
  photo: { src: img('feature-burger'), alt: 'Tall cheeseburger dripping with cheese' },
  features: [
    { icon: 'leaf', title: 'Fresh every morning', text: 'Produce in at 7, prepped by 9.' },
    { icon: 'drop', title: 'Sauces made in-house', text: 'Seven sauces, zero bottles.' },
    { icon: 'flame', title: 'Cooked to order', text: 'Nothing waits under a lamp.' },
    { icon: 'bolt', title: 'Served blazing hot', text: 'Grill to hand in minutes.' },
  ],
}

export const reviews = [
  { initials: 'MK', name: 'Maya K.', text: 'The double smash has the crispiest edges I have ever had. I dream about the alley sauce.' },
  { initials: 'JR', name: 'Jonas R.', text: 'Came for wings, stayed for the pizza. The hot honey salami is unreal.' },
  { initials: 'SA', name: 'Sara A.', text: 'Fast, loud, delicious. Exactly what late-night food should be.' },
  { initials: 'DL', name: 'Dev L.', text: 'Portions are huge and the tacos taste like a street corner in Mexico City.' },
  { initials: 'NO', name: 'Noor O.', text: 'The shawarma wrap with garlic sauce is my weekly ritual now.' },
  { initials: 'TB', name: 'Theo B.', text: 'Best onion rings in town. Crunch you can hear across the room.' },
]

export const gallery = [
  { src: img('gallery-diner'), caption: 'Late-night booths' },
  { src: img('gallery-tacos'), caption: 'Taco line-up' },
  { src: img('gallery-truck'), caption: 'Where it started' },
  { src: img('gallery-steak'), caption: 'Steak frites Friday' },
  { src: img('gallery-shawarma'), caption: 'The spit never stops' },
  { src: img('gallery-ribs'), caption: 'Low and slow' },
  { src: img('gallery-burgerfries'), caption: 'The classic' },
  { src: img('gallery-bar'), caption: 'Drinks on tap' },
]

export const whyUs = [
  { icon: 'moon', title: 'Open late', text: 'Kitchen fires until 1AM.' },
  { icon: 'plate', title: 'Big portions', text: 'Nobody leaves hungry.' },
  { icon: 'clock', title: 'No long waits', text: 'Most orders in under 8 minutes.' },
  { icon: 'truck', title: 'Delivery', text: 'Hot to your door across downtown.' },
  { icon: 'combo', title: 'Combo friendly', text: 'Mix, match and save.' },
  { icon: 'drop', title: 'House sauces', text: 'Made fresh every single day.' },
]

export const favorites = [
  { name: 'Street Dog', price: 7.5, img: img('dish-hotdog') },
  { name: 'Double Smash', price: 12, img: img('dish-smash') },
]

export const order = {
  photos: [img('order-burger'), img('order-pepperoni'), img('order-shake'), img('order-tacos')],
}

export const contact = {
  photo: img('gallery-truck'),
  address: 'Downtown Food Alley, Unit 7',
  hours: 'Open daily · 11AM – 1AM',
  email: 'hello@firealley.example',
  phone: '+1 (555) 010-0199',
}
