import { Client } from 'archipelago.js';
import { TextChannel } from 'discord.js';
import { sendDiscordMessage } from '../discordBot.js';

let client: Client;
let discordChannel: TextChannel;

export async function connect(
    url: string,
    playerSlot: string,
    responseDiscordChannel: TextChannel
) {
    client = new Client();

    client.messages.on('message', async (content) => {
        await sendDiscordMessage(discordChannel, content);
    });

    await client.login(url, playerSlot);

    discordChannel = responseDiscordChannel;
}

export function disconnect() {
    if (!client || !client.authenticated) {
        return;
    }
    client.socket.disconnect();
}

// await connect('archipelago.gg:35887', 'FlohaDLC');
