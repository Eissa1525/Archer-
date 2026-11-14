import { site } from '../config'
import { Icon } from './Icon'

/** Brand mark: the client's logo image when configured, otherwise flame icon + name (the demo look). */
export function Logo({ size }: { size: number }) {
  const logo = site.business.logo
  if (logo) return <img className="logo__img" src={logo.src} alt={logo.alt} style={{ height: logo.height ?? size + 8 }} />
  return (
    <>
      <Icon name="flame" size={size} className="logo__flame" />
      <span>{site.business.name}</span>
    </>
  )
}
