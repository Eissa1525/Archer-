/**
 * INTERNAL — not part of the sold package (export-ignored).
 * The public showcase of the template: the Fire Alley demo with real Unsplash photos.
 * Using Unsplash photos on a website is allowed by the Unsplash License; selling them is not,
 * which is why they live here and the package ships original placeholders instead.
 *
 *   SITE_CONFIG=demo-assets/showcase.config.ts PUBLIC_DIR=demo-assets/public npm run build
 */
import demo from '../src/config/site.config'
import type { SiteConfig } from '../src/config/types'

const showcase: SiteConfig = {
  ...demo,
  credits: { ...demo.credits, photoCredits: { prefix: 'Photos from Unsplash (Unsplash License)', label: 'Photo credits', url: './credits.html' } },
}
export default showcase
