import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatUser, ChatClient } from '@twurple/chat';
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

    // const bot = new Bot({ authProvider: auth, channels });
    const client = new ChatClient({ authProvider: auth, channels });

    client.onConnect(() => {
        console.log(
            `Succesfully joined Twitch channels ${channels.join(', ')}`
        );
    });

    client.onSub(async (channel, user) => {
        await client.say(channel, `Thank you for subscribing ${user} <3`);
    });

    client.onResub(async (channel, user, subInfo) => {
        await client.say(
            channel,
            `Thank you for subscribing for ${subInfo.months} months ${user} <3`
        );
    });

    client.onMessage(async (channel, user, text, message) => {
        const reply = async (reply: string) => {
            await client.say(channel, reply, { replyTo: message });
        };

        const [command, ...args] = text.trim().split(' ');
        // not a command, nothing to do
        if (!command.startsWith('!')) {
            return;
        }

        const commandName = command.substring(1);

        switch (commandName) {
            // All quotes handling commands
            case 'quote': {
                return await handleTwitchQuote(args, reply, message);
            }
            case 'addcmd': {
                if (!isMod(message.userInfo)) {
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
                if (!isMod(message.userInfo)) {
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
                if (!isMod(message.userInfo)) {
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

    client.connect();
}

export function isMod(user: ChatUser) {
    return user.isMod || user.isBroadcaster;
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
            !(
                quote?.alias === 'NONE' ||
                quote.alias === '' ||
                quote.alias === 'unknown'
            )
                ? `. Also known as ${quote.alias}`
                : ''
        } `
    );
}
