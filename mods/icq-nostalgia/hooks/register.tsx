// ICQ Nostalgia: Claude Code dressed as a 2007 messenger window.
//
//   look      mint/pine palette and a glossy title-bar backdrop with blossoms
//   chat      "Vic (15:24):" in blue above your prompts, "Claude (15:25):"
//             in orange above each reply, like a conversation log
//   status    a flower status band above the prompt: Online, Occupied ·
//             typing…, or "Uh-oh! Claude needs you"
//   sound     the message sound when Claude needs you: a permission prompt,
//             a question, an idle reminder, and a finished reply
//   /icq      test | mute | unmute | status
//
// Works in the desktop app (Code tab) and the terminal, on macOS and Windows.
// Unofficial fan theme: no ICQ logo, artwork, font or sound ships with it.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { IcqStatus } from '../types'
import { sender, status as STATUS } from './design'
import { LOOK, problems } from './look'
import { SCENE } from './scene'
import { playMessageSound, platformOf } from './sound'

const statusAtom = atom({ plugin: 'icq-nostalgia', key: 'status' } as const, 'online')

const COOLDOWN_MS = 2500
const YOURS = ['composer', 'sdk', 'bridge']
const MAX_NICKNAME = 32
// Rows whose first-drawn time we remember; older ones fall back to a fresh stamp.
const MAX_STAMPS = 2000
const USAGE = 'Usage: /icq [test | mute | unmute | status]'

type Options = { nickname: string; soundFile: string; turnSound: boolean; minTurnSeconds: number; volume: number }

const readOptions = (raw: Record<string, unknown>): Options => {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  return {
    nickname: typeof raw.nickname === 'string' ? raw.nickname.trim().slice(0, MAX_NICKNAME) : '',
    soundFile: typeof raw.soundFile === 'string' ? raw.soundFile.trim() : '',
    turnSound: raw.turnSound !== false,
    minTurnSeconds: Math.max(0, num(raw.minTurnSeconds, 4)),
    volume: Math.min(4, Math.max(0, num(raw.volume, 1))),
  }
}

const hhmm = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Module state: a hot reload starts it over, which is fine for all of it.
let options: Options = readOptions({})
let me = 'You'
let muted = false
let lastSound = Number.NEGATIVE_INFINITY
let themeNote = 'not set yet'
// When each transcript row was first drawn, so its header time stays put.
const seen = new Map<string, number>()

async function setStatus($: EngineInterface, next: IcqStatus) {
  await update($, statusAtom, () => next)
}

/** "Uh-oh": plays at most once per cooldown, never holding the hook. */
async function ding($: EngineInterface) {
  if (muted || options.volume <= 0) return
  const now = await $.clock.now()
  if (now - lastSound < COOLDOWN_MS) return
  lastSound = now
  $.clock.after(0, () => {
    playMessageSound($, options.volume, options.soundFile).catch(error =>
      $.ui.log(`icq-nostalgia: sound failed: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' }),
    )
  })
}

async function stamp($: EngineInterface, id: string) {
  let at = seen.get(id)
  if (at === undefined) {
    at = await $.clock.now()
    if (seen.size >= MAX_STAMPS) {
      const oldest = seen.keys().next()
      if (!oldest.done) seen.delete(oldest.value)
    }
    seen.set(id, at)
  }
  return hhmm(at)
}

export const register: Register = (on, rawOptions) => {
  options = readOptions(rawOptions as Record<string, unknown>)
  me = options.nickname || 'You'

  // ── Look ────────────────────────────────────────────────────────────────
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    if (!options.nickname) {
      const account = (await $.env.get('USERNAME')) || (await $.env.get('USER')) || 'You'
      me = account.slice(0, MAX_NICKNAME)
    }
    try {
      muted = (await $.store.get('muted')) === true
    } catch {
      muted = false
    }
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.log(`icq-nostalgia: ${unpainted}`, { to: 'debug' })
    const set = await $.theme.set(LOOK)
    themeNote = set.isDrawn ? 'drawn' : `not drawn here (${set.reason})`
    await setStatus($, 'online')
    try {
      await $.command.register({
        name: 'icq',
        description: 'ICQ Nostalgia: play the message sound, mute or unmute it, or show status',
        argumentHint: 'test | mute | unmute | status',
      })
    } catch (error) {
      $.ui.log(`icq-nostalgia: /icq not registered (${error instanceof Error ? error.message : String(error)})`)
    }
    return started
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== 'icq-nostalgia' || (e.surface !== 'desktop' && e.surface !== 'mobile')) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={SCENE} alt="A mint messenger window with soft green blossoms" isInteractive />
  })

  // ── Conversation log headers ───────────────────────────────────────────
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (!YOURS.includes(e.props.origin.kind)) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const time = await stamp($, e.requestId)
    return (
      <Box flexDirection="column">
        <Text color={sender.me} weight="bold">
          {me} ({time}):
        </Text>
        {await next(e)}
      </Box>
    )
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (!e.props.isFirstOfReply) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const time = await stamp($, e.requestId)
    return (
      <Box flexDirection="column">
        <Text color={sender.them} weight="bold">
          Claude ({time}):
        </Text>
        {await next(e)}
      </Box>
    )
  })

  // The terminal's spinner word becomes the messenger's typing notice.
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.message !== null) return next(e)
    return next({ ...e, props: { ...e.props, word: '✎ Claude is typing' } })
  })

  // ── Status flower band ─────────────────────────────────────────────────
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const s = STATUS[await read($, statusAtom)]
    return (
      <Box flexDirection="row">
        <Text color={s.color} weight="bold">
          {s.glyph}{' '}
        </Text>
        <Text weight="semibold">Claude</Text>
        <Text dimColor> · </Text>
        <Text color={s.color}>{s.label}</Text>
        {muted ? <Text dimColor> · sound muted (/icq unmute)</Text> : null}
      </Box>
    )
  })

  on('prompt.submit', async ($, e, next) => {
    await setStatus($, 'typing')
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await setStatus($, 'typing')
    return next(e)
  })

  // ── Attention: the message sound ───────────────────────────────────────
  // A finished reply is an incoming message.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await setStatus($, 'online')
      const isLongEnough = e.durationMs >= options.minTurnSeconds * 1000
      if (options.turnSound && e.reason === 'answer' && isLongEnough) await ding($)
    }
    return next(e)
  })

  // Permission prompts, idle reminders and MCP elicitation dialogs.
  on('classic.Notification', async ($, e, next) => {
    if (e.notification_type !== 'auth_success') {
      await setStatus($, 'needsYou')
      await ding($)
    }
    return next(e)
  })

  // The permission dialog: only when no hook already answered it.
  on('classic.PermissionRequest', async ($, e, next) => {
    const answer = await next(e)
    if (answer.decision === undefined) {
      await setStatus($, 'needsYou')
      await ding($)
    }
    return answer
  })

  // Claude asks you a multiple-choice question.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    await setStatus($, 'needsYou')
    await ding($)
    const result = await next(e)
    await setStatus($, 'typing')
    return result
  })

  // ── /icq ───────────────────────────────────────────────────────────────
  on('command.run', { command: 'icq' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'mute' || arg === 'unmute') {
      muted = arg === 'mute'
      await $.store.set('muted', muted).catch(() => undefined)
      $.ui.invalidate('ui.render')
      return { text: muted ? 'Message sound muted.' : 'Message sound on.' }
    }
    const platform = await platformOf($)
    if (arg === '' || arg === 'test') {
      const result = await playMessageSound($, Math.max(0.1, options.volume), options.soundFile).then(
        sound => ({ sound }),
        (error: unknown) => ({ error: error instanceof Error ? error.message : String(error) }),
      )
      return {
        text:
          'error' in result
            ? `Could not play the sound on ${platform}: ${result.error}`
            : `Played the ${result.sound.source} sound on ${platform}.`,
      }
    }
    if (arg !== 'status') return { text: USAGE }
    return {
      text: [
        `ICQ Nostalgia: theme ${themeNote}.`,
        `Sound: ${muted ? 'muted' : 'on'} · platform ${platform} · volume ${options.volume} · reply sound ${options.turnSound ? `after ${options.minTurnSeconds}s turns` : 'off'}.`,
        `You appear as "${me}".`,
      ].join('\n'),
    }
  })
}
