/** The template's safety tooling: secret scanner and config checker. */
import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const node = (...args: string[]) => spawnSync('node', args, { cwd: root, encoding: 'utf8' })

describe('secret scanner', () => {
  it('the template itself contains no secrets', () => {
    const r = node('scripts/scan-secrets.mjs')
    expect(r.stdout + r.stderr).toMatch(/No secrets found/)
    expect(r.status).toBe(0)
  })

  it('catches real-looking keys and private env files', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'scan-'))
    // built at runtime so this test file itself never contains a key-shaped string
    const stripeKey = ['sk', 'live', 'a1B2c3D4e5F6g7H8i9J0k1L2'].join('_')
    const hook = ['whsec', 'Zx9Yw8Vu7Ts6Rq5Po4Nm3Lk2Ji1'].join('_')
    writeFileSync(path.join(dir, 'config.ts'), `const key = '${stripeKey}'\nconst hook = '${hook}'\n`)
    writeFileSync(path.join(dir, '.env'), 'X=1\n')
    writeFileSync(path.join(dir, '.env.example'), 'STRIPE_SECRET_KEY=\n')
    const r = node('scripts/scan-secrets.mjs', dir)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/config.ts:1: looks like a Stripe secret/)
    expect(r.stderr).toMatch(/config.ts:2: looks like a Stripe webhook signing secret/)
    expect(r.stderr).toMatch(/\.env: private environment/)
    expect(r.stderr).not.toMatch(/\.env\.example/)
  })
})

describe('config checker', () => {
  it('passes the shipped demo and refuses the unfilled client template', () => {
    expect(node('scripts/check-config.mjs').status).toBe(0)
    const t = node('scripts/check-config.mjs', 'clients/_template.config.ts')
    expect(t.status).toBe(1)
    expect(t.stdout).toMatch(/TODO/)
  }, 30_000)
})
