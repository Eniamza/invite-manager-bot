import { Message, User } from 'eris';
import { Op } from 'sequelize';

import { IMClient } from '../../client';
import { BooleanResolver, UserResolver } from '../../resolvers';
import {
	customInvites,
	inviteCodes,
	joins,
	LogAction,
	sequelize
} from '../../sequelize';
import { BotCommand, CommandGroup } from '../../types';
import { Command, Context } from '../Command';

export default class extends Command {
	public constructor(client: IMClient) {
		super(client, {
			name: BotCommand.clearInvites,
			aliases: ['clear-invites'],
			args: [
				{
					name: 'clearBonus',
					resolver: BooleanResolver
				},
				{
					name: 'user',
					resolver: UserResolver
				}
			],
			// clientPermissions: ['MANAGE_GUILD'],
			group: CommandGroup.Invites,
			guildOnly: true,
			strict: true
		});
	}

	public async action(
		message: Message,
		[clearBonus, user]: [boolean, User],
		flags: {},
		{ guild, t }: Context
	): Promise<any> {
		const memberId = user ? user.id : undefined;

		await inviteCodes.update(
			{
				clearedAmount: sequelize.col('uses') as any
			},
			{
				where: {
					guildId: guild.id,
					inviterId: memberId ? memberId : { [Op.ne]: null }
				}
			}
		);

		await joins.update(
			{
				cleared: true
			},
			{
				where: {
					guildId: guild.id,
					...(memberId && {
						exactMatchCode: (await inviteCodes.findAll({
							where: { guildId: guild.id, inviterId: memberId }
						})).map(ic => ic.code)
					})
				}
			}
		);

		await customInvites.update(
			{
				cleared: false
			},
			{
				where: {
					guildId: guild.id,
					...(memberId && { memberId })
				}
			}
		);

		if (clearBonus) {
			// Clear invites
			await customInvites.update(
				{
					cleared: true
				},
				{
					where: {
						guildId: guild.id,
						...(memberId && { memberId })
					}
				}
			);
		}

		this.client.logAction(guild, message, LogAction.clearInvites, {
			clearBonus,
			...(memberId && { targetId: memberId })
		});

		return this.client.sendReply(message, t('cmd.clearInvites.done'));
	}
}
