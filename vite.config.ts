/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { SiteConfig } from './src/config/types.ts'
import { validateConfig } from './src/config/validate.ts'

/**
 * Which restaurant to build. Defaults to the Fire Alley demo.
 *   SITE_CONFIG=clients/acme.config.ts npm run build
 */
const configFile = path.resolve(process.env.SITE_CONFIG ?? 'src/config/site.config.ts')

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function restaurantConfig(): Plugin {
  let site: SiteConfig
  return {
    name: 'restaurant-config',
    async buildStart() {
      site = (await import(/* @vite-ignore */ pathToFileURL(configFile).href + `?t=${Date.now()}`)).default as SiteConfig
      const { errors, warnings } = validateConfig(site)
      for (const w of warnings) this.warn(`[site config] ${w}`)
      if (errors.length) {
        const msg = `\n[site config] ${path.relative(process.cwd(), configFile)} (mode: ${site.mode}) has problems:\n  - ${errors.join('\n  - ')}\n`
        // client mode must never ship placeholder or broken business data
        if (site.mode === 'client') this.error(msg)
        else this.warn(msg)
      }
    },
    transformIndexHtml(html) {
      const b = site.business
      const noindex = site.mode === 'demo' || b.noindex
      return html
        .replace('%SEO_TITLE%', escape(b.seoTitle))
        .replace('%SEO_DESCRIPTION%', escape(b.seoDescription))
        .replace('%LANG%', escape(site.locale.locale.split('-')[0]))
        .replace('%HERO_IMAGE%', escape(site.hero.slides[0]?.image ?? ''))
        .replace('%ROBOTS%', noindex ? '<meta name="robots" content="noindex" />' : '')
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [restaurantConfig(), react()],
  resolve: { alias: { '@site-config': configFile } },
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  test: { include: ['tests/**/*.test.ts'] },
})
