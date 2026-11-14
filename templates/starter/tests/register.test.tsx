import { describe, expect, mock, test } from 'claude-code/testing'

describe('register', () => {
  test('draws its band on the terminal and the desktop', async ($, on) => {
    mock.clock(on)
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({
        plugin: '__NAME__',
        surface,
        component: 'AbovePrompt',
        requestId: 'band',
        props: {
          hasSurvey: false,
          isCollapsed: false,
          isWorking: false,
          maxRows: 3,
          bodyColumns: 80,
          scroll: { offset: 0, bodyRows: 3 },
          view: {},
        },
      })
      expect((await ui.find({ type: 'Text', text: /running/ }))?.text).toBe('__NAME__ is running')
      await ui.unmount()
    }
  })
})
