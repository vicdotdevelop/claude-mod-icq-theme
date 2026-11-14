#!/usr/bin/env node
// Generates the original message chime that icq-nostalgia ships
// (mods/icq-nostalgia/sounds/message.wav): two short bell-like notes rising a
// fifth, synthesized from sine partials. Being generated from this file, the
// sound is covered by the repository's MIT license.
//
//   node scripts/make-chime.mjs [out.wav]

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = process.argv[2] ?? join(root, 'mods', 'icq-nostalgia', 'sounds', 'message.wav')

const RATE = 22050
const LENGTH_S = 0.55
const samples = new Float64Array(Math.round(RATE * LENGTH_S))

/** A soft bell: fundamental plus two quiet partials, fast attack, exponential decay. */
function note(startS, frequency, durationS, level) {
  const start = Math.round(startS * RATE)
  const count = Math.round(durationS * RATE)
  for (let i = 0; i < count && start + i < samples.length; i++) {
    const t = i / RATE
    const attack = Math.min(1, t / 0.006)
    const decay = Math.exp(-t / (durationS * 0.35))
    const tone =
      Math.sin(2 * Math.PI * frequency * t) +
      0.35 * Math.sin(2 * Math.PI * frequency * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * frequency * 3.01 * t)
    samples[start + i] += level * attack * decay * tone
  }
}

note(0.0, 880.0, 0.22, 0.42) // A5
note(0.11, 1318.5, 0.42, 0.38) // E6

const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0)
const pcm = Buffer.alloc(samples.length * 2)
samples.forEach((v, i) => pcm.writeInt16LE(Math.round((v / peak) * 0.8 * 32767), i * 2))

const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16) // PCM chunk size
header.writeUInt16LE(1, 20) // PCM
header.writeUInt16LE(1, 22) // mono
header.writeUInt32LE(RATE, 24)
header.writeUInt32LE(RATE * 2, 28) // byte rate
header.writeUInt16LE(2, 32) // block align
header.writeUInt16LE(16, 34) // bits per sample
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)

writeFileSync(out, Buffer.concat([header, pcm]))
console.log(`Wrote ${out} (${(LENGTH_S * 1000).toFixed(0)} ms, ${RATE} Hz, 16-bit mono)`)
