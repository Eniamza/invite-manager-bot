import {
	Command,
	CommandDecorators,
	Logger,
	logger,
	Message,
	Middleware
} from 'yamdbf';

import { IMClient } from '../client';
import { CommandGroup, createEmbed, sendEmbed } from '../utils/util';

const { resolve } = Middleware;
const { using } = CommandDecorators;

const config = require('../../config.json');

interface FAQ {
	name: string;
	aliases: string[];
	question: string;
	answer: string;
}

export default class extends Command<IMClient> {
	@logger('Command') private readonly _logger: Logger;

	public constructor() {
		super({
			name: 'faq',
			aliases: ['setup'],
			desc: 'Show frequently asked questions.',
			usage: '<prefix>faq',
			group: CommandGroup.Other,
			guildOnly: true
		});
	}

	@using(resolve('faqName: String'))
	public async action(message: Message, [faqName]: [string]): Promise<any> {
		this._logger.log(
			`${message.guild.name} (${message.author.username}): ${message.content}`
		);

		const faqs: FAQ[] = require('../../faqs.json');

		const embed = createEmbed(this.client);

		if (!faqName) {
			faqs.forEach(faq => {
				embed.addField(faq.question, '`!faq ' + faq.name + '`');
			});
			embed.addField(
				'More',
				'Please check out our readme for a list of all FAQs and much more!' +
					'https://github.com/AndreasGassmann/discord-invite-manager/'
			);
		} else {
			let faq = faqs.find(
				el => el.name === faqName || el.aliases.some(f => f === faqName)
			);
			if (faq) {
				embed.setTitle(faq.question);
				embed.setDescription(faq.answer);
			} else {
				embed.setTitle(`Name ${faqName} not found!`);
			}
		}

		sendEmbed(message.channel, embed, message.author);
	}
}
