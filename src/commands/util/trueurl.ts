import { Command, type CommandContext, createBooleanOption, createStringOption, Declare, Options } from 'seyfert'

const options = {
	url: createStringOption({
		required: true,
		description: 'The URL to remove tracking ',
		value(data, ok, fail) {
			try {
				new URL(data.value)
				return ok(data.value)
			} catch (_) {
				return fail(`Invalid URL: ${data.value}`)
			}
		}
	}),
	removequery: createBooleanOption({
		required: false,
		description: 'Whether to remove the query',
		default: false
	}),
	fetch: createBooleanOption({
		required: false,
		description: 'Whether to fetch the URL',
		default: false
	})
}

@Declare({
	name: 'trueurl',
	description: 'Gets the true URL of the URL provided'
})
@Options(options)
export default class TrueUrl extends Command {
	async run(ctx: CommandContext<typeof options>) {
		try {
			const url = ctx.options.url
			const res = await fetch(url, {
				method: 'HEAD',
				redirect: ctx.options.fetch ? 'follow' : 'manual'
			})

			const finalUrl = url ? res.url : url

			ctx.write({
				content: `Follow redirect: ${ctx.options.fetch}\nRemove query parameters:\nURL: ${ctx.options.removequery} \`\`\`\n${ctx.options.removequery ? finalUrl.split('?')[0] : finalUrl}\`\`\``
			})
		} catch (error) {
			return ctx.write({ content: `An error ocurred: \`\`\`\n${error}\`\`\`` })
		}
	}
}
