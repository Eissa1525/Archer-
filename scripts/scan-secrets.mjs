#!/usr/bin/env node
/**
 * Fails (exit 1) if anything that looks like a real secret or a private env file is in the project.
 *   node scripts/scan-secrets.mjs            → every file git would ship (tracked + new, not ignored);
 *                                              outside a git repository: every project file
 *   node scripts/scan-secrets.mjs <folder>   → every file in a folder (e.g. an extracted package or dist/)
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const PATTERNS = [
  [/\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}/, 'Stripe secret/restricted key'],
  [/\bwhsec_[A-Za-z0-9]{20,}/, 'Stripe webhook signing secret'],
  [/\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/, 'Resend API key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/\bxox[abp]-[A-Za-z0-9-]{20,}/, 'Slack token'],
  [/https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}/, 'Slack webhook URL'],
  [/https:\/\/discord(app)?\.com\/api\/webhooks\/\d{15,}\/[A-Za-z0-9_-]{30,}/, 'Discord webhook URL'],
]
const FORBIDDEN_FILES = [/(^|\/)\.env(\.(?!example$)[^/]*)?$/, /(^|\/)\.dev\.vars$/, /\.pem$/, /\.p12$/]
const BINARY = /\.(webp|png|jpe?g|gif|ico|woff2?|ttf|zip|pdf)$/i
// build output and dependencies are not part of the source (they are re-created by npm)
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'release'])

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (SKIP_DIRS.has(name)) return []
    return statSync(full).isDirectory() ? walk(full, base) : [path.relative(base, full)]
  })
}

export function scan(root, files) {
  const findings = []
  for (const rel of files) {
    if (FORBIDDEN_FILES.some((re) => re.test(rel))) findings.push(`${rel}: private environment/key file must not be shipped`)
    if (BINARY.test(rel)) continue
    let text
    try {
      text = readFileSync(path.join(root, rel), 'utf8')
    } catch {
      continue
    }
    text.split('\n').forEach((line, i) => {
      for (const [re, what] of PATTERNS) if (re.test(line)) findings.push(`${rel}:${i + 1}: looks like a ${what}`)
    })
  }
  return findings
}

const target = process.argv[2]
const root = target ? path.resolve(target) : process.cwd()
function gitFiles() {
  try {
    return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean)
  } catch {
    return null // not a git repository (e.g. an unzipped package)
  }
}
const files = target ? walk(root) : (gitFiles() ?? walk(root))
const findings = scan(root, files)
if (findings.length) {
  console.error(`✗ Possible secrets found (${findings.length}):\n  ${findings.join('\n  ')}\n\nRemove them and rotate any real key that was exposed.`)
  process.exit(1)
}
console.log(`✓ No secrets found in ${files.length} files.`)
