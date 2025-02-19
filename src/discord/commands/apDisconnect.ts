import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import type { CommandObject } from '../../../types.js';
import { disconnect } from '../archipelago/connect.js';

const apDisconnect: CommandObject = {
    name: 'ap-disconnect',
    command: {
        data: new SlashCommandBuilder()
            .setName('ap-disconnect')
            .setDescription('Disconnects from an Archieplago Server'),
        async execute(interaction: ChatInputCommandInteraction) {
            if (!interaction.isChatInputCommand()) {
                return;
            }
            await interaction.deferReply();
            disconnect();
            await interaction.editReply(
                'Succesfully disconnected from AP Server'
            );
        }
    }
};

export default apDisconnect;
