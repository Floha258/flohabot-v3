import type { CommandInteraction } from 'discord.js';
import type { CommandObject } from '../../../types.js';

import { SlashCommandBuilder } from 'discord.js';

const ping: CommandObject = {
    name: 'ping',
    command: {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Pings the Bot'),
        async execute(interaction: CommandInteraction) {
            await interaction.reply('Pong!');
        }
    }
};

export default ping;
