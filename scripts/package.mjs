#!/usr/bin/env node
/**
 * Builds the downloadable source package:  npm run package
 *   1. refuses to run with uncommitted changes (the package is exactly a git commit)
 *   2. secret scan → tests → config check → production build must all pass
 *   3. git archive → release/<name>-v<version>.zip (honours .gitattributes export-ignore,
 *      and can never include node_modules, dist, .env files or anything else git ignores)
 *   4. extracts a copy and scans it again, then prints the SHA-256 checksum
 */
import { execFileSync, execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const name = `${pkg.name}-v${pkg.version}`
const run = (title, cmd) => {
  console.log(`\n▶ ${title}`)
  execSync(cmd, { stdio: 'inherit' })
}

if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) {
  console.error('✗ Uncommitted changes. Commit (or stash) first: the package is built from the last commit.')
  process.exit(1)
}
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()

run('Secret scan', 'node scripts/scan-secrets.mjs')
run('Tests', 'npm test')
run('Config check (default demo)', 'node scripts/check-config.mjs')
run('Production build', 'npm run build')

mkdirSync('release', { recursive: true })
const zip = path.join('release', `${name}.zip`)
rmSync(zip, { force: true })
execFileSync('git', ['archive', '--format=zip', `--prefix=${name}/`, '-o', zip, 'HEAD'])

// verify an extracted copy (tar is available on macOS, Linux and Windows 10+)
const tmp = mkdtempSync(path.join(tmpdir(), 'pkg-verify-'))
execSync(`git archive --format=tar HEAD | tar -x -C "${tmp}"`)
run('Secret scan of the packaged files', `node scripts/scan-secrets.mjs "${tmp}"`)
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean)
const count = (dir) => readdirSync(dir).reduce((n, f) => n + (statSync(path.join(dir, f)).isDirectory() ? count(path.join(dir, f)) : 1), 0)
const exported = count(tmp)
rmSync(tmp, { recursive: true, force: true })

const licence = readFileSync('LICENSE.md', 'utf8')
const blanks = [...new Set(licence.match(/\[(LICENSOR LEGAL NAME|PROVINCE|YEAR)\]/g) ?? [])]
const sha = createHash('sha256').update(readFileSync(zip)).digest('hex')
console.log(`
✓ ${zip}
  commit   ${commit}
  files    ${exported} (of ${files.length} in git; internal files excluded via .gitattributes)
  size     ${(statSync(zip).size / 1e6).toFixed(2)} MB
  sha256   ${sha}`)
if (blanks.length)
  console.log(`\n⚠ NOT READY FOR SALE: LICENSE.md still has blanks ${blanks.join(', ')}.\n  Fill them in, commit, and run npm run package again.`)
else if (/DRAFT FOR REVIEW/.test(licence))
  console.log(`\n⚠ LICENCE STILL MARKED DRAFT: buyers will see "DRAFT FOR REVIEW" in LICENSE.md.\n  After review, remove that notice, commit, and run npm run package again.`)
