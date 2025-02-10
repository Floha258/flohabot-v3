import { RefreshingAuthProvider } from '@twurple/auth';
import { Bot, MessageEvent } from '@twurple/easy-bot';
import { readFileSync, writeFileSync } from 'fs';
import { handleTwitchQuote } from './handleTwitchQuote.js';
import {
    getRemoteQuote,
    REMOTE_QUOTE_SOURCES
} from '../quotes/getRemoteQuote.js';
import type { Quote } from '../quotes/quotes.js';
import Database from 'better-sqlite3';

const db = new Database(process.env.dbName || 'bot.db');

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
            case 'addcmd': {
                if (!(await isMod(bot, messageEvent))) {
                    return await reply(
                        'You do not have the permissions to perform this action'
                    );
                }
                const command = args.shift();
                if (!command || args.length === 0) {
                    return await reply(
                        'Please provide a command and message like so: !addcmd ping Pong'
                    );
                }
                const output = args.join(' ');
                try {
                    db.prepare(
                        'INSERT INTO `commands` (name, response, enabled) VALUES (?, ?, 1)'
                    ).run(command, output);
                    return await reply(`Succesfully added command !${command}`);
                } catch (error) {
                    console.error(error);
                    return await replyWithError(reply);
                }
            }
            case 'setcmd': {
                if (!(await isMod(bot, messageEvent))) {
                    return await reply(
                        'You do not have the permissions to perform this action'
                    );
                }
                const command = args.shift();
                if (!command || args.length === 0) {
                    return await reply(
                        'Please provide a command and message like so: !setcmd ping Ping returned'
                    );
                }
                const output = args.join(' ');
                try {
                    db.prepare(
                        'UPDATE `commands` SET (response, enabled) VALUES (?, 1) WHERE `name` = ?'
                    ).run(output, command);
                    return await reply(
                        `Succesfully edited command !${command}`
                    );
                } catch (error) {
                    console.error(error);
                    return await replyWithError(reply);
                }
            }
            case 'delcmd': {
                if (!(await isMod(bot, messageEvent))) {
                    return await reply(
                        'You do not have the permissions to perform this action'
                    );
                }
                const command = args.shift();
                if (!command) {
                    return await reply(
                        'Please provide a command to delete: !delcmd ping'
                    );
                }
                try {
                    db.prepare('DELETE FROM `commands` WHERE `name` = ?').run(
                        command
                    );
                    return await reply(
                        `Succesfully deleted command !${command}`
                    );
                } catch (error) {
                    console.error(error);
                    return await replyWithError(reply);
                }
            }
            case 'ceejus': {
                const remoteQuote = await getRemoteQuote(
                    args,
                    REMOTE_QUOTE_SOURCES.CEEJUS
                );
                if (!remoteQuote) {
                    return await reply(
                        'Something went wrong, please try again. If you still get an error #blameCJ'
                    );
                }
                return await replyWithQuote(remoteQuote, reply);
            }
            // Default command handling
            default: {
                const output = db
                    .prepare(
                        'SELECT `response` FROM `commands` WHERE `name` = ? AND `enabled` = 1'
                    )
                    .get(commandName) as { response: string } | undefined;
                if (!output || !output.response) return;
                return await reply(output.response);
            }
        }
    });
}

export async function isMod(bot: Bot, messageEvent: MessageEvent) {
    const mods = await bot.getMods(messageEvent.broadcasterName);
    return (
        mods.filter((mod) => mod.userName === messageEvent.userName).length > 0
    );
}

export async function replyWithError(reply: (text: string) => Promise<void>) {
    await reply(
        "An error occured. Please try again. If it still doesn't work, something is" +
            'probably on fire. #blameFloha'
    );
}

export async function replyWithQuote(
    quote: Quote,
    reply: (text: string) => Promise<void>
) {
    await reply(
        `#${quote.id}: ${quote.quote} ${quote.date !== 'unknown' ? quote.date : ''}${
            !(quote?.alias === 'NONE' || quote.alias === '' || quote.alias === 'unknown') ? `. Also known as ${quote.alias}` : ''
        } `
    );
}
