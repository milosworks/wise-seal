import {
	Command,
	type CommandContext,
	createBooleanOption,
	createStringOption,
	Declare,
	IgnoreCommand,
	Options
} from 'seyfert'
import { inspect } from 'node:util'
import { config } from 'dotenv'

const codeblockWithLang = /^```[a-zA-Z]*\n?/
const codeblock = /\n?```$/

const { parsed: envVars } = config()

const options = {
	code: createStringOption({
		description: 'Code to run',
		required: true,
		value(data, ok) {
			if (data.value.startsWith('```')) {
				const cleanedValue = data.value.replace(codeblockWithLang, '').replace(codeblock, '')
				return ok(cleanedValue)
			}

			return ok(data.value)
		}
	})
}

@Declare({
	name: 'eval',
	description: 'Eval code',
	ignore: IgnoreCommand.Slash
})
@Options(options)
export default class Eval extends Command {
	async run(ctx: CommandContext<typeof options>) {
		if (ctx.author.id !== '538421122920742942') return
		if (!ctx.options.code) return ctx.write({ content: 'You need to provide code to run' })

		try {
			let res = await eval(
				ctx.options.code.contains('await') ? `(async()=>{ ${ctx.options.code} })();` : ctx.options.code
			)
			if (typeof res !== 'string') res = inspect(res, { depth: 0, showHidden: true })

			res = Object.values(envVars || {}).reduce(
				(acc, val) => (val ? acc.replace(new RegExp(val, 'g'), '[ENV]') : acc),
				res
			)

			ctx.write({ content: `\`\`\`js\n${res}\n\`\`\`` })
		} catch (error) {
			return ctx.write({ content: `An error ocurred: \`\`\`\n${error}\`\`\`` })
		}
	}
}
