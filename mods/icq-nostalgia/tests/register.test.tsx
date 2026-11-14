import { describe, expect, mock, test } from 'claude-code/testing'

import { isAcceptableSoundPath } from '../hooks/sound'

const BAND = {
  plugin: 'icq-nostalgia',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 3,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 3 },
    view: {},
  },
} as const

describe('register', () => {
  test('sets the mint theme and a backdrop scene at session start', async ($, on) => {
    const themes: unknown[] = []
    mock.clock(on)
    mock.store(on)
    mock.env(on, { USERNAME: 'Vic', OS: 'Windows_NT' })
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('command.register', () => ({ value: { command: 'icq' } }))
    on('theme.set', (_, e) => {
      themes.push(e)
      return { value: { isDrawn: true, requestId: 'backdrop' } }
    })

    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

    expect(themes).toHaveLength(1)
    const look = themes[0] as { colors: { label: string }; backdrop: { scene: string } }
    expect(look.colors.label).toBe('Mint Messenger')
    expect(look.backdrop.scene).toBe('mint-window')
  })

  test('a question from Claude plays the chime through PowerShell on Windows, path passed by env', async ($, on) => {
    const runs: { argv: string[]; env: Record<string, string> }[] = []
    const clock = mock.clock(on)
    mock.store(on)
    mock.env(on, { USERNAME: 'Vic', OS: 'Windows_NT' })
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('command.register', () => ({ value: { command: 'icq' } }))
    on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
    on('fs.exists', () => ({ value: false }))
    on('process.run', (_, e) => {
      runs.push({ argv: [...e.argv], env: { ...(e.init?.env ?? {}) } })
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    on('tool.call', () => ({ result: {} }))

    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
    await $.tool.call({ tool: 'AskUserQuestion', questions: [] } as never)
    await clock.advance(10)

    expect(runs).toHaveLength(1)
    const [run] = runs
    expect(run?.argv[0]).toBe('powershell.exe')
    // The command is constant: the file path never appears in PowerShell code.
    expect(run?.argv.at(-1)).toBe('(New-Object System.Media.SoundPlayer $env:ICQ_NOSTALGIA_SOUND).PlaySync()')
    expect(run?.env.ICQ_NOSTALGIA_SOUND).toMatch(/sounds[\\/]message\.wav$/)
  })

  test('only absolute .wav paths are accepted as a custom sound', () => {
    expect(isAcceptableSoundPath('C:\\Users\\vic\\Music\\uh-oh.wav')).toBe(true)
    expect(isAcceptableSoundPath('/Users/vic/Music/uh-oh.WAV')).toBe(true)
    expect(isAcceptableSoundPath('uh-oh.wav')).toBe(false)
    expect(isAcceptableSoundPath('/tmp/evil.ps1')).toBe(false)
    expect(isAcceptableSoundPath("C:\\x'; Remove-Item -Recurse C:\\ ;'.wav\n")).toBe(false)
    expect(isAcceptableSoundPath('')).toBe(false)
  })

  test('/icq with an unknown word prints usage and plays nothing', async ($, on) => {
    const runs: string[][] = []
    mock.clock(on)
    mock.store(on)
    mock.env(on, { USERNAME: 'Vic', OS: 'Windows_NT' })
    on('process.run', (_, e) => {
      runs.push([...e.argv])
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    const { text } = await $.command.run({ command: 'icq', args: 'rm -rf', origin: { kind: 'composer' } } as never)
    expect(text).toContain('Usage: /icq')
    expect(runs).toHaveLength(0)
  })

  test('the status band shows the flower and Online on every surface', async ($, on) => {
    mock.clock(on)
    mock.store(on)
    mock.env(on, { USERNAME: 'Vic' })

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ ...BAND, surface })
      expect((await ui.find({ type: 'Text', text: /Online/ }))?.text).toBe('Online')
      await ui.unmount()
    }
  })

  test('your prompts and the replies get messenger-style name headers', async ($, on) => {
    mock.clock(on)
    mock.store(on)
    mock.env(on, { USERNAME: 'Vic' })
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('command.register', () => ({ value: { command: 'icq' } }))
    on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
    on('ui.render', ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text>body</Text>
    })
    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

    for (const surface of ['terminal', 'desktop'] as const) {
      const you = await $.ui.mount({
        plugin: 'icq-nostalgia',
        surface,
        component: 'UserMessage',
        requestId: 'u1',
        props: { text: 'hi', origin: { kind: 'composer' }, isExpanded: true },
      })
      expect((await you.find({ type: 'Text', text: /^Vic \(\d\d:\d\d\):$/ }))?.text).toMatch(/^Vic/)
      await you.unmount()

      const claude = await $.ui.mount({
        plugin: 'icq-nostalgia',
        surface,
        component: 'AssistantMessage',
        requestId: 'a1',
        props: { text: 'hello', isFirstOfReply: true },
      })
      expect((await claude.find({ type: 'Text', text: /^Claude \(\d\d:\d\d\):$/ }))?.text).toMatch(/^Claude/)
      await claude.unmount()
    }
  })
})

