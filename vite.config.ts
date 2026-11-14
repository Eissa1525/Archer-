/// <reference types="vitest/config" />
import { defineConfig, runnerImport, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import type { SiteConfig } from './src/config/types.ts'
import { validateConfig } from './src/config/validate.ts'
import { faviconHref, themeCss } from './src/config/theme.ts'

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
      // load through Vite (not Node's import) so the config can use extensionless TS imports
      site = (await runnerImport<{ default: SiteConfig }>(configFile)).module.default
      const { errors, warnings } = validateConfig(site)
      for (const w of warnings) this.warn(`[site config] ${w}`)
      if (errors.length) {
        // never build a broken site, a client site with placeholder data, or a demo that could take real orders
        this.error(`\n[site config] ${path.relative(process.cwd(), configFile)} (mode: ${site.mode}) has problems:\n  - ${errors.join('\n  - ')}\n`)
      }
    },
    // 'pre': fill the placeholders before Vite parses the HTML (its CSS minifier reads the inline <style>)
    transformIndexHtml: { order: 'pre', handler: (html) => fillHead(html, site) },
  }
}

function fillHead(html: string, site: SiteConfig): string {
  {
      const b = site.business
      const noindex = site.mode === 'demo' || b.noindex
      return html
        .replace('%SEO_TITLE%', escape(b.seoTitle))
        .replace('%SEO_DESCRIPTION%', escape(b.seoDescription))
        .replace('%LANG%', escape(site.locale.locale.split('-')[0]))
        .replace('%HERO_IMAGE%', escape(site.hero.slides[0]?.image ?? ''))
        .replace('%ROBOTS%', noindex ? '<meta name="robots" content="noindex" />' : '')
        .replace('%THEME_COLOR%', escape(site.theme.colors.brown))
        .replace('%FAVICON%', escape(faviconHref(site.theme)))
        .replace('%THEME_CSS%', themeCss(site.theme))
        .replace(
          '%FONTS%',
          site.theme.fonts.googleFontsUrl
            ? `<link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    <link href="${escape(site.theme.fonts.googleFontsUrl)}" rel="stylesheet" />`
            : '',
        )
  }
}

export default defineConfig({
  base: './',
  // static files (images…). PUBLIC_DIR lets the internal showcase build use licensed demo photos.
  publicDir: process.env.PUBLIC_DIR ?? 'public',
  plugins: [restaurantConfig(), react()],
  resolve: { alias: { '@site-config': configFile } },
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  test: { include: ['tests/**/*.test.ts'] },
})
