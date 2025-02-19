import type {
    ChatInputCommandInteraction,
    CommandInteraction,
    TextChannel
} from 'discord.js';
import type { CommandObject } from '../../../types.js';

import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { connect } from '../archipelago/connect.js';

const AP_DEFAULT_URL = 'archipelago.gg';

const apConnect: CommandObject = {
    name: 'ap-connect',
    command: {
        data: new SlashCommandBuilder()
            .setName('ap-connect')
            .setDescription(
                'Connects to an Archieplago Server and logs messages from the server'
            )
            .addIntegerOption((option) =>
                option
                    .setName('port')
                    .setDescription('Port to connect to')
                    .setRequired(true)
                    .setMinValue(10_000)
                    .setMaxValue(99_999)
            )
            .addStringOption((option) =>
                option
                    .setName('player-name')
                    .setDescription('Player name you want to connect as')
                    .setRequired(true)
                    .setMinLength(1)
            )
            .addChannelOption((option) =>
                option
                    .setName('channel')
                    .setDescription(
                        'Channel you want to log to, defaults to this channel'
                    )
                    .addChannelTypes(ChannelType.GuildText)
            )
            .addStringOption((option) =>
                option
                    .setName('url')
                    .setDescription(
                        'url of the ap server to connect to (excluding port), if not set defaults to archipelago.gg'
                    )
            ),
        async execute(interaction: ChatInputCommandInteraction) {
            if (!interaction.isChatInputCommand()) {
                return;
            }
            await interaction.deferReply();
            const url =
                interaction.options.getString('url', false) || AP_DEFAULT_URL;
            const channel = (interaction.options.getChannel('channel', false) ||
                interaction.channel) as TextChannel;
            const port = interaction.options.getInteger('port', true);
            const player = interaction.options.getString('player-name', true);
            try {
                await connect(`${url}:${port}`, player, channel);
            } catch (error: unknown) {
                await interaction.editReply(
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `Something went wrong, connecting to the specified AP Server: ${error}`
                );
                return;
            }
            await interaction.editReply(
                `Succesfully connected to ${url}:${port} as ${player}`
            );
        }
    }
};

export default apConnect;
