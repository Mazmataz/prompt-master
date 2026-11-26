import { expect, test } from 'claude-code/testing'

const BAND = { plugin: 'prompt-master', surface: 'desktop', component: 'AbovePrompt' } as const
const PROPS = { hasSurvey: false, isCollapsed: false, isWorking: false }

test('the button rewrites the draft, and Undo puts it back', async ($, on) => {
  let box = 'fix my code its broke'
  const filled: string[] = []
  on('prompt.read', () => ({ value: { text: box, cursor: box.length } }))
  on('prompt.fill', (_, e) => {
    filled.push(e.text)
    box = e.text
    return { isFilled: true, text: e.text, cursor: e.text.length }
  })
  on('ui.status', () => ({ value: undefined }) as never)
  on('ui.toast', () => ({ value: undefined }) as never)
  on('prompt.change', (_, e) => ({ text: e.text, cursor: e.cursor }) as never)
  on('model.complete', (_, e) => {
    expect(e.prompt).toContain('fix my code its broke')
    return { value: { isAnswered: true, text: '  Please help me fix a bug in my code.  ', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } } as never
  })

  const empty = await $.ui.mount({ ...BAND, props: PROPS })
  expect(await empty.find({ type: 'Button' })).toBeUndefined()
  await empty.unmount()

  await $.prompt.change({ text: box, cursor: box.length, origin: { kind: 'person' } } as never)
  const ui = await $.ui.mount({ ...BAND, props: PROPS })
  await ui.press({ key: 'pm' })
  await new Promise(r => setTimeout(r, 0))
  expect(filled).toEqual(['Please help me fix a bug in my code.'])
  await ui.press({ key: 'undo' })
  expect(filled[1]).toBe('fix my code its broke')
  await ui.unmount()
})
