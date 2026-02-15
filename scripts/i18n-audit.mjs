import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function flatten(obj, prefix = '') {
  const out = new Map()
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [kk, vv] of flatten(v, key)) out.set(kk, vv)
    } else {
      out.set(key, v)
    }
  }
  return out
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts.at(-1)] = value
}

function getDeep(obj, dotted) {
  const parts = dotted.split('.')
  let cur = obj
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return undefined
    cur = cur[p]
  }
  return cur
}

const root = process.cwd()
const esPath = path.join(root, 'i18n/locales/es-AR.json')
const enPath = path.join(root, 'i18n/locales/en.json')

const es = readJson(esPath)
const en = readJson(enPath)

const esFlat = flatten(es)
const enFlat = flatten(en)

// extract keys from code
const rgCmd = `rg -n --no-filename "\\$t\\('([^']+)'\\)|\\bt\\('([^']+)'\\)" pages layouts components server || true`
const rgOut = execSync(rgCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })

const used = new Set()
for (const line of rgOut.split('\n')) {
  // line like: 12:t('app.name')
  const m = line.match(/\b(?:\$t|t)\('([^']+)'\)/)
  if (m?.[1]) used.add(m[1])
}

const missingInEn = []
for (const k of esFlat.keys()) {
  if (!enFlat.has(k)) missingInEn.push(k)
}

const missingInEs = []
for (const k of enFlat.keys()) {
  if (!esFlat.has(k)) missingInEs.push(k)
}

const missingInBoth = []
for (const k of used) {
  if (!esFlat.has(k) && !enFlat.has(k)) missingInBoth.push(k)
}

console.log(JSON.stringify({
  counts: {
    usedKeys: used.size,
    esKeys: esFlat.size,
    enKeys: enFlat.size,
    missingInEn: missingInEn.length,
    missingInEs: missingInEs.length,
    missingInBoth: missingInBoth.length
  },
  missingInEn,
  missingInEs,
  missingInBoth
}, null, 2))

// auto-fill en with es values as fallback if missing
let updated = false
for (const k of missingInEn) {
  const val = getDeep(es, k)
  if (typeof val === 'string') {
    setDeep(en, k, val)
    updated = true
  }
}

// add missing-in-both placeholders
for (const k of missingInBoth) {
  setDeep(es, k, k)
  setDeep(en, k, k)
  updated = true
}

if (updated) {
  fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n')
  fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n')
}
