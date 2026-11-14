#!/usr/bin/env node
/**
 * Checks a restaurant config without building.
 *   npm run check                               → src/config/site.config.ts
 *   npm run check -- clients/acme.config.ts     → a client config
 */
import { runnerImport } from 'vite'
import path from 'node:path'

const file = path.resolve(process.argv[2] ?? process.env.SITE_CONFIG ?? 'src/config/site.config.ts')
const { module: cfgMod } = await runnerImport(file)
const { module: v } = await runnerImport(path.resolve('src/config/validate.ts'))
const site = cfgMod.default
const { errors, warnings } = v.validateConfig(site)
console.log(`${path.relative(process.cwd(), file)} — mode: ${site.mode}, ordering: ${site.ordering.provider.type}, payment: ${site.ordering.payment.type}`)
for (const w of warnings) console.log(`  ! ${w}`)
for (const e of errors) console.log(`  ✗ ${e}`)
if (errors.length) {
  console.log(`\n${errors.length} problem(s) — the build will refuse this config until they are fixed.`)
  process.exit(1)
}
console.log(`  ✓ ready to build${warnings.length ? ` (${warnings.length} warning(s))` : ''}`)
