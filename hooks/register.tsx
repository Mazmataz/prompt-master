import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const hasDraft = atom({ plugin: 'prompt-master', key: 'hasDraft' } as const, false)
const isBusy = atom({ plugin: 'prompt-master', key: 'isBusy' } as const, false)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, null)

const SYSTEM = `You are Prompt Master, an expert prompt engineer. The user gives you a rough, hastily written prompt they are about to send to an AI assistant (Claude). Rewrite it into a clearer, more effective prompt.

Rules:
- Keep the user's intent, facts, names, file paths, code and constraints exactly. Never invent requirements, data or context they did not give.
- State the goal plainly up front, then the relevant context, then any constraints and the desired output (format, length, tone) where the draft implies them.
- Fix spelling and grammar; remove filler and ambiguity. Use short sections or bullets only when the request has several parts.
- Write in the first person, as the user speaking to the assistant. Keep it concise: no longer than it needs to be.
- If something essential is unclear, keep it as the user wrote it rather than guessing.
- Output ONLY the rewritten prompt text: no preamble, no quotes, no explanation.`

async function rewrite($: EngineInterface): Promise<string | undefined> {
  if (await read($, isBusy)) return
  const box = await $.prompt.read()
  const draft = box.text.trim()
  if (!draft) {
    $.ui.toast('Prompt Master: type a rough prompt first')
    return
  }
  await update($, isBusy, () => true)
  $.ui.status('✨ Prompt Master: rewriting…')
  try {
    const r = await $.model.complete({
      model: 'sonnet',
      system: SYSTEM,
      prompt: `Rough prompt to rewrite:\n<<<\n${draft}\n>>>`,
      maxTokens: 2000,
      effort: 'low',
      timeoutMs: 60000,
    })
    if (!r.isAnswered || !r.text.trim()) {
      $.ui.toast(`Prompt Master couldn't rewrite that (${r.isAnswered ? 'empty reply' : r.reason})`)
      return
    }
    const better = r.text.trim()
    const filled = await $.prompt.fill({ text: better, mode: 'replace' })
    if (!filled.isFilled) {
      $.ui.toast('Prompt Master: the prompt box was busy; try again')
      return
    }
    await update($, original, () => box.text)
    $.ui.toast('✨ Prompt rewritten. Review it, then send')
    return better
  } finally {
    await update($, isBusy, () => false)
    $.ui.status(undefined)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Rewrite the draft in the prompt box into a better prompt',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async ($, e, next) => {
    const better = await rewrite($)
    return { text: better ? 'Prompt rewritten in the box.' : 'Nothing rewritten.' }
  })

  on('prompt.change', async ($, e, next) => {
    const has = e.text.trim().length > 0
    if (has !== (await read($, hasDraft))) await update($, hasDraft, () => has)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, original, () => null)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking) return next(e)
    const busy = await read($, isBusy)
    const draft = await read($, hasDraft)
    const prev = await read($, original)
    if (!draft && !busy) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        {busy ? (
          <Text dimColor>✨ Prompt Master is rewriting…</Text>
        ) : (
          <Button key="pm" label="✨ Prompt Master" onPress={() => void rewrite($)} />
        )}
        {prev !== null && !busy ? (
          <Button
            key="undo"
            label="Undo"
            onPress={async () => {
              await $.prompt.fill({ text: prev, mode: 'replace' })
              await update($, original, () => null)
            }}
          />
        ) : null}
      </Box>
    )
  })
}
