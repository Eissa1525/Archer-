/** Small hand-drawn icon set (inline SVG) — no emoji-font dependency. */
const paths: Record<string, string> = {
  flame: 'M12 2c.8 3.6 5 5.4 5 10.4A5 5 0 0 1 7 12.6c0-2.6 1.4-4 2.2-5.4.6 2 1.4 2.8 2.2 2.8-.6-2.8.2-5.6.6-8z',
  chili: 'M15.5 4.5c1.6-.4 2.8.2 3.4 1.4M14 6c3.2 0 5 2 4 5.4-1.4 4.8-6.4 8.6-12 9.6-1.6.2-2-1.4-.6-2C10 17 12.6 12.6 12.2 8.4 12 6.8 12.8 6 14 6z',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  leaf: 'M5 19c0-8 5-14 15-15 0 10-6 15-14 15M5 19c3-5 6-8 10-10',
  drop: 'M12 3c3.5 4.6 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 2.5-6.4 6-11z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  plate: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M7.5 12a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0',
  clock: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 7v5l3.5 2',
  truck: 'M2 6h11v9H2zM13 9h4.5L21 12.5V15h-8M6.5 18.5a1.8 1.8 0 1 0 0-.01M17 18.5a1.8 1.8 0 1 0 0-.01',
  combo: 'M4 9h10l-1.2 11H5.2zM6 9l1.5-5h3L12 9M15 13h5v7h-5z',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z',
  pin: 'M12 21s6.5-6.2 6.5-11.5a6.5 6.5 0 0 0-13 0C5.5 14.8 12 21 12 21zM12 7a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 1 0 0-4.8',
  mail: 'M3 6h18v12H3zM3 7l9 6.5L21 7',
  phone: 'M6.6 3.5 9.4 4l1.2 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.2.5 2.8c.1.9-.6 1.6-1.5 1.6A17 17 0 0 1 5 5c0-.9.7-1.6 1.6-1.5z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  check: 'M5 12.5l4.5 4.5L19 7',
  alert: 'M12 3 2 20h20zM12 10v4M12 17.2v.1',
  instagram: 'M4 4h16v16H4zM8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M16.8 7.2v.1',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z',
  tiktok: 'M14 4c.4 2.6 2 4.2 5 4.5v3.4c-1.9 0-3.6-.6-5-1.7V16a5 5 0 1 1-5-5v3.4a1.7 1.7 0 1 0 1.6 1.6V4z',
  x: 'M4 4l16 16M20 4 4 20',
  youtube: 'M3 7.5C3 6 4 5 5.5 5h13C20 5 21 6 21 7.5v9c0 1.5-1 2.5-2.5 2.5h-13C4 19 3 18 3 16.5zM10 9v6l5-3z',
  globe: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3',
}
const filled = new Set(['flame', 'chili', 'star', 'bolt', 'drop', 'moon', 'heart'])

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const fill = filled.has(name)
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] ?? paths.star} />
    </svg>
  )
}
