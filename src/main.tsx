import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import './styles.css'
import App from './App'

// Safety net for page translators and extensions that rewrite the DOM behind React's back: without
// it, React removing a node they have already replaced throws and blanks the whole site.
// (React's long-standing recommended workaround, facebook/react#11538.)
if (typeof Node === 'function' && Node.prototype) {
  const { removeChild, insertBefore } = Node.prototype
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    return child.parentNode === this ? (removeChild.call(this, child) as T) : child
  }
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    return (ref && ref.parentNode !== this ? insertBefore.call(this, node, null) : insertBefore.call(this, node, ref)) as T
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
