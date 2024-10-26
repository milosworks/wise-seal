import { sql } from "drizzle-orm";
import { createEvent } from "seyfert";
import { db } from "../database";
import { guilds } from "../database/models/guilds";
import { users } from "../database/models/users";

export default createEvent({
	data: {
		name: "messageCreate",
	},
	async run(msg) {
		try {
			if (!msg.guildId || msg.author.bot) return;

			const content = msg.content
				.toLowerCase()
				.replaceAll(/<a?:[\w\d]+:\d+>/g, "")
				.replaceAll(
					/(?<http>(http:[/][/]|www.)([a-z]|[A-Z]|[0-9]|[/.]|[~])*)/g,
					"",
				);
			if (!content.includes("seal")) return;

			let doc = await db.query.guilds.findFirst({
				where: (u, { eq }) => eq(u.id, msg.guildId!),
			});
			if (!doc) {
				doc = (await db
					.insert(guilds)
					.values({ id: msg.guildId })
					.returning())![0];
			}
			if (doc.ignoredChannels.includes(msg.channelId)) return;

			let uDoc = await db.query.users.findFirst({
				where: (u, { eq }) => eq(u.id, msg.author.id),
			});
			if (!uDoc) {
				uDoc = (await db
					.insert(users)
					.values({ id: msg.author.id })
					.returning())![0];
			}
			if (uDoc.ignoreCount) return;

			doc.sealCount++;
			uDoc.sealCount++;

			await Promise.all([
				db
					.update(guilds)
					.set({ sealCount: doc.sealCount })
					.where(sql`id = ${doc.id}`),
				db.update(users).set({ sealCount: uDoc.sealCount }),
			]);

			const emojis = await msg.client.emojis.list(msg.guildId);
			if (emojis.length > 0)
				await msg.react(emojis[Math.floor(Math.random() * emojis.length)]);
		} catch (error) {
			msg.client.logger.error(`An error ocurred when : ${error}`);
		}
	},
});
