#!/usr/bin/env node
// Scaffold a new mod in mods/<name> and list it in the marketplace.
// Works the same on Windows (PowerShell, cmd) and macOS/Linux shells.
//
//   node scripts/new-mod.mjs <name> "<one-line description>" [--theme]
//
// --theme also copies make-colors.js/.d.ts into the mod's hooks folder, for
// a mod that calls $.theme.set (see docs/WORKFLOW.md, "Themes").

import { cpSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MOD_NAME, oneLine, run } from './lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const isTheme = args.includes('--theme')
const [name, rawDescription = 'A Claude Code mod'] = args.filter(a => !a.startsWith('--'))
const description = oneLine(rawDescription)

if (!name || !MOD_NAME.test(name) || name.length > 64) {
  console.error('Usage: node scripts/new-mod.mjs <kebab-case-name> "<description>" [--theme]')
  process.exit(1)
}
if (name.startsWith('claude-') || name.startsWith('anthropic')) {
  console.error('Names starting with "claude-" or "anthropic" are refused by claude plugin validate.')
  process.exit(1)
}

const target = join(root, 'mods', name)
if (existsSync(target)) {
  console.error(`mods/${name} already exists.`)
  process.exit(1)
}

let ccVersion = 'unknown'
const version = run('claude', ['--version'], { stdio: 'pipe', encoding: 'utf8' })
if (version.status === 0) ccVersion = oneLine(String(version.stdout)).split(' ')[0]

const marketplacePath = join(root, '.claude-plugin', 'marketplace.json')
const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'))
const author = marketplace.owner?.name ?? 'Me'

cpSync(join(root, 'templates', 'starter'), target, { recursive: true })
if (isTheme) {
  for (const file of ['make-colors.js', 'make-colors.d.ts']) {
    cpSync(join(root, 'templates', 'theme', file), join(target, 'hooks', file))
  }
}

// In JSON files the values are JSON-escaped; elsewhere they are already one plain line.
const json = text => JSON.stringify(text).slice(1, -1)
const fill = (text, isJson) =>
  text
    .replaceAll('__NAME__', name)
    .replaceAll('__DESCRIPTION__', isJson ? json(description) : description)
    .replaceAll('__AUTHOR__', isJson ? json(author) : oneLine(author, 64))
    .replaceAll('__CC_VERSION__', ccVersion)

const walk = dir =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

for (const file of walk(target)) {
  if (/\.(json|tsx?|md)$/.test(file) && !file.includes('make-colors')) {
    writeFileSync(file, fill(readFileSync(file, 'utf8'), file.endsWith('.json')))
  }
}

marketplace.plugins = [...(marketplace.plugins ?? []), { name, source: `./mods/${name}`, description }]
writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n')

console.log(`Created mods/${name} and listed it in .claude-plugin/marketplace.json.`)
console.log('Next:')
console.log(`  node scripts/check.mjs ${name}`)
console.log(`  claude --plugin-dir mods/${name}        (try it in a terminal session)`)
console.log(`  node scripts/dev-link.mjs ${name}       (try it in the desktop app)`)
