import {
    Client,
    GatewayIntentBits,
    IntentsBitField,
    Collection,
    Events,
    ChatInputCommandInteraction,
    TextChannel
} from 'discord.js';
import { commandsList } from './commands/_commands.js';
import { DiscordCommand } from '../../types.js';

import 'dotenv/config.js';

export interface ClientWithCommands extends Client {
    commands: Collection<string, DiscordCommand>;
}

const channel = process.env.DISCORD_CHANNEL || '745285346849456141';
const guildId = process.env.DISCORD_GUILD_ID || '';
const clientId = process.env.DISCORD_CLIENT_ID || '';
const token = process.env.DISCORD_TOKEN || '';

const intents = new IntentsBitField();
intents.add(
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
);

let client: ClientWithCommands;

export async function startDiscordBot(): Promise<ClientWithCommands> {
    client = new Client({ intents: intents }) as ClientWithCommands;

    client.once(Events.ClientReady, (client) => {
        console.log(`Client ready and logged in as ${client.user.tag}`);
    });

    await client.login(token);

    client.commands = new Collection();

    for (const command of commandsList) {
        client.commands.set(command.name, command.command);
    }

    client.on(Events.InteractionCreate, async (itraction): Promise<void> => {
        if (!itraction.isChatInputCommand()) return;
        // Despite DiscordJS Docs claiming the above can infer the type properly, it cannot
        const interaction = itraction as ChatInputCommandInteraction;

        const command = (interaction.client as ClientWithCommands).commands.get(
            interaction.commandName
        );
        if (!command) {
            console.error(`Could not find command ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error' });
            } else {
                await interaction.reply({ content: 'Error' });
            }
        }
    });

    return client;
}

export async function sendDiscordMessage(
    channel: TextChannel,
    message: string
) {
    if (!client) {
        throw new Error('Discord Client not ready');
    }

    if (!channel || !channel.isTextBased()) {
        throw new Error('Channel does not exist or is not a text channel');
    }
    await channel.send(message);
}
