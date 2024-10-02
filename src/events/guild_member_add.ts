import { AttachmentBuilder, createEvent } from 'seyfert'
import { constants } from '../config'

const file = new AttachmentBuilder().setFile(
	'url',
	'https://c.tenor.com/rfASxs4sUP4AAAAd/tenor.gif'
)

export default createEvent({
	data: {
		name: 'guildMemberAdd'
	},
	run(member, bot) {
		bot.members.addRole(constants.guildId, member.id, constants.joinRoleId)

		bot.messages.write(constants.welcomeChannelId, {
			content: `Hark! A ${member.user.toString()} joins the seal's kin. Welcome, and may you find mirth among us!`,
			files: [file]
		})
	}
})
