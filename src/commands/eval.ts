import { inspect } from 'bun'
import {
	Command,
	type CommandContext,
	createNumberOption,
	createStringOption,
	Declare,
	IgnoreCommand,
	Middlewares,
	type OKFunction,
	Options
} from 'seyfert'
import { createQuickMessage } from '../utils/createQuickMessage'
import { formatDuration } from '../utils/formatDuration'
import { truncate } from '../utils/truncate'

const codeBlockRegex = /^\s*```(?<language>\S*)\s*\n(?<content>[\s\S]*?)\n\s*```\s*$/

const options = {
	code: createStringOption({
		description: 'Code to run',
		required: true,
		value(data, ok: OKFunction<string>) {
			const match = data.value.match(codeBlockRegex)
			if (match?.groups) {
				return ok(match.groups.content!)
			}

			return ok(data.value)
		}
	}),
	depth: createNumberOption({
		description: 'Depth of the inspect',
		required: false
	})
}

@Declare({
	name: 'eval',
	description: 'Eval code',
	ignore: IgnoreCommand.Slash
})
@Options(options)
@Middlewares(['dev'])
export default class Eval extends Command {
	async run(ctx: CommandContext<typeof options>) {
		const start = Date.now()

		const { code, depth } = ctx.options
		const isAsync = code.includes('await')
		let res = await eval(isAsync ? `(async()=>{ ${code} })();` : code)
		if (typeof res !== 'string') res = inspect(res, { depth: depth ?? 0, sorted: true })

		res = [Bun.env.DISCORD_TOKEN, Bun.env.DATABASE_URL].reduce(
			(acc, val) => (val ? acc.replace(new RegExp(val, 'g'), '[ENV]') : acc),
			res
		)

		ctx.write(
			createQuickMessage(
				`### Evaluated code in ${formatDuration(Date.now() - start)}`,
				`\`\`\`js\n${truncate(res, 3900)}\n\`\`\`${
					res === 'undefined' && isAsync
						? '\n-# Code is async and returned undefined, did you forget to put "return"?'
						: ''
				}`
			)
		)
	}
}
