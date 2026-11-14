// __NAME__: __DESCRIPTION__
//
// Rules the validator enforces (see docs/WORKFLOW.md):
//  - spell every API call $.noun.method(...) at the call site
//  - pass $ only to functions declared at the top level of this file
//  - event names are string literals; no dynamic import(); relative imports only
import type { EngineInterface, Register } from 'claude-code'

async function hello($: EngineInterface) {
  $.ui.toast('__NAME__ loaded')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await hello($)
    return started
  })

  // A band above the prompt. Delete it if your mod does not draw.
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text dimColor>__NAME__ is running</Text>
  })
}
