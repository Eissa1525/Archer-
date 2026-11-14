#!/usr/bin/env node
/**
 * Starts a new client from the template.
 *   npm run new-client -- smoke-house
 * creates clients/smoke-house.config.ts and prints the next steps.
 */
import { copyFileSync, existsSync } from 'node:fs'

const slug = (process.argv[2] ?? '').toLowerCase()
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(slug)) {
  console.error('Usage: npm run new-client -- <client-name>   (lowercase letters, digits and dashes, e.g. smoke-house)')
  process.exit(1)
}
const target = `clients/${slug}.config.ts`
if (existsSync(target)) {
  console.error(`${target} already exists — not overwriting it.`)
  process.exit(1)
}
copyFileSync('clients/_template.config.ts', target)
console.log(`✓ Created ${target}

Next steps:
  1. Fill in every TODO in ${target} (business details, map link, hours, menu, ordering).
  2. Put the client's photos in public/img/ and point the config at them.
  3. Check it:    npm run check -- ${target}
  4. Preview it:  SITE_CONFIG=${target} npm run dev
  5. Build it:    SITE_CONFIG=${target} npm run build      (refuses to build while TODOs remain)

See docs/CLIENT-GUIDE.md and docs/ACTIVATION-CHECKLIST.md.`)
