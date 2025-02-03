import { RefreshingAuthProvider } from '@twurple/auth';
import { Bot } from '@twurple/easy-bot';
import { readFileSync, writeFileSync } from 'fs';
import { db } from '../index.js';
import { handleTwitchQuote } from './handleTwitchQuote.js';

interface TwitchTokenFormat {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
}

const clientId = process.env.TWITCH_CLIENT_ID || '';
const secret = process.env.TWITCH_CLIENT_SECRET || '';
const channels: string[] = process.env.TWITCH_CHANNELS?.split(',') || [];
const twitchToken: TwitchTokenFormat = JSON.parse(
    readFileSync('./.twitch_token.json', 'utf-8')
);



export async function startTwitchBot() {
    const auth = new RefreshingAuthProvider({ clientId, clientSecret: secret });

    auth.onRefresh((user, newToken) => {
        const tokenData: TwitchTokenFormat = {
            access_token: newToken.accessToken,
            refresh_token: newToken.refreshToken || '',
            expires_in: newToken.expiresIn || 0,
            scope: newToken.scope,
            token_type: twitchToken.token_type
        };
        writeFileSync(
            './.twitch_token.json',
            JSON.stringify(tokenData, null, 4),
            {
                encoding: 'utf-8'
            }
        );
    });

    await auth.addUserForToken(
        {
            accessToken: twitchToken.access_token,
            refreshToken: twitchToken.refresh_token,
            obtainmentTimestamp: 0,
            expiresIn: twitchToken.expires_in,
            scope: twitchToken.scope
        },
        ['chat']
    );

    const bot = new Bot({ authProvider: auth, channels });

    bot.onConnect(() => {
        console.log(
            `Succesfully joined Twitch channels ${channels.join(', ')}`
        );
    });

    bot.onSub(async ({ broadcasterName: channel, userName }) => {
        await bot.say(channel, `Thank you for subscribing ${userName} <3`);
    });

    bot.onResub(async ({ broadcasterName: channel, userName, months }) => {
        await bot.say(
            channel,
            `Thank you for subscribing for ${months} months ${userName} <3`
        );
    });

    bot.onMessage(async (messageEvent) => {
        const reply = async (message: string) =>
            await messageEvent.reply(message);

        const [command, ...args] = messageEvent.text.trim().split(' ');

        // not a command, nothing to do
        if (!command.startsWith('!')) {
            return;
        }

        const commandName = command.substring(1);

        switch (commandName) {
            // All quotes handling commands
            case 'quote': {
                return await handleTwitchQuote(args, reply, messageEvent, bot);
            }
            // Default command handling
            default: {
                const output = db
                    .prepare(
                        'SELECT `response` FROM `commands` WHERE `name` = ? AND `enabled` = 1'
                    )
                    .get(commandName) as { response: string } | undefined;
                if (!output || !output.response) return;
                await reply(output.response);
                return;
            }
        }
    });
}


