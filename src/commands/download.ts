import { Buffer } from 'buffer'
import {
	AttachmentBuilder,
	Command,
	CommandContext,
	createStringOption,
	Declare,
	OnOptionsReturnObject,
	Options,
	type OKFunction
} from 'seyfert'
import { PassThrough } from 'stream'
import ytdlpWrap from 'yt-dlp-wrap'

const ytdlp = new ytdlpWrap('yt-dlp')

const isURL = (url: string) => {
	try {
		new URL(url)
		return true
	} catch (error) {
		return false
	}
}

const options = {
	url: createStringOption({
		description: 'The URL to download',
		required: true,
		value(data, ok: OKFunction<URL>, fail) {
			if (isURL(data.value)) return ok(new URL(data.value))

			fail(`Invalid URL: ${data.value}`)
		}
	})
}

@Declare({
	name: 'download',
	description: 'Downloads a video from a URL using ytdlp'
})
@Options(options)
export default class Download extends Command {
	async run(ctx: CommandContext<typeof options>) {
		await ctx.deferReply()

		const url = ctx.options.url.href
		const passThrough = new PassThrough()
		const buffer: Buffer[] = []

		ytdlp
			.execStream([
				url,
				'-S',
				// Download the best video with either h264 or h265 codec,
				// or the best video if there is no such video
				`codec:h265`
			])
			.pipe(passThrough)

		passThrough.on('data', (chunk) => {
			buffer.push(chunk)
		})

		passThrough.on('end', () => {
			const file = Buffer.concat(buffer)

			const attachment = new AttachmentBuilder()
				.setFile('buffer', file)
				.setName('video.mp4')
				.setDescription('Downloaded video')

			ctx.editOrReply({
				content: `[Original](<${url}>)`,
				files: [attachment]
			})
		})

		passThrough.on('error', (error) => {
			throw error
		})
	}

	async onOptionsError(
		context: CommandContext,
		metadata: OnOptionsReturnObject
	) {
		await context.editOrReply({
			content: Object.entries(metadata)
				.filter((_) => _[1].failed)
				.map((error) => `${error[0]}: ${error[1].value}`)
				.join('\n')
		})
	}

	async onRunError(context: CommandContext, error: unknown) {
		log.error(error)

		await context.editOrReply({
			content: error instanceof Error ? error.message : `Error: ${error}`
		})
	}
}
