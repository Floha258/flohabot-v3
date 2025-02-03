import type { MessageEvent } from '@twurple/easy-bot';
import { Bot } from '@twurple/easy-bot';
import type { Quote } from '../quotes/quotes.js';
import {
    addQuote,
    aliasQuote,
    deleteQuote,
    editQuote,
    getQuoteByAlias,
    getQuoteById,
    getRandomQuote,
    searchQuote
} from '../quotes/quotes.js';

export async function handleTwitchQuote(
    args: string[],
    reply: (message: string) => Promise<void>,
    messageEvent: MessageEvent,
    bot: Bot
) {
    switch (args[0]) {
        // no args provided return random quote
        case undefined: {
            const quote = getRandomQuote();
            if (!quote) {
                return await replyWithError(reply);
            }
            return await replyWithQuote(quote, reply);
        }
        case 'search': {
            try {
                if (!args[1]) {
                    return await reply('Please provide a search string');
                }
                const quotes = searchQuote(args[1]);
                if (!quotes) {
                    return await reply(
                        `Could not find a quote that includes ${args[1]}`
                    );
                }
                if (!Array.isArray(quotes)) {
                    return await replyWithQuote(quotes, reply);
                }
                const quoteIds = quotes.map((quote) => `'${quote.id}`);
                return await messageEvent.reply(
                    `Found multiple quotes, try one of these: ${quoteIds.join(', ')}`
                );
            } catch (error) {
                console.log(error);
                return await replyWithError(reply);
            }
        }
        case 'add': {
            const text = args.slice(1).join(' ');
            const quote = addQuote(text);
            if (!quote) return await replyWithError(reply);
            return await reply(`Succesfully added quote #${quote?.id}`);
        }
        case 'delete': {
            if (!(await isMod(bot, messageEvent)))
                return await reply(
                    'You do not have the permissions to perform this action'
                );
            const quoteId = parseInt(args[1]);
            if (!quoteId || isNaN(quoteId))
                return await reply('Please provide a proper quoteId');
            if (deleteQuote(quoteId)) {
                return await reply(`Succesfully deleted quote #${quoteId}`);
            } else {
                return await replyWithError(reply);
            }
        }
        case 'edit': {
            if (!(await isMod(bot, messageEvent))) {
                return await reply(
                    'You do not have the permissions to perform this action'
                );
            }
            const quoteId = parseInt(args[0]);
            if (isNaN(quoteId))
                return await reply('Please provide a proper quoteId');
            const quote = editQuote(quoteId, args.slice(1).join(' '));
            if (!quote) {
                return await replyWithError(reply);
            }
            return await reply(`Succesfully edited quote #${quote.id}`);
        }
        case 'alias': {
            if (!(await isMod(bot, messageEvent)))
                return await reply(
                    'You do not have the permissions to perform this action'
                );
            const alias = args[1];
            const quoteId = parseInt(args[2]);
            if (!alias || !isNaN(quoteId))
                return await reply(
                    'Please provide the neccessary information to properly alias a quote. Format: !quote alias `alias` `quoteId`'
                );
            try {
                const quote = aliasQuote(alias, quoteId);
                if (!quote)
                    return await reply(`Could not find quote #${quoteId}`);
            } catch (error) {
                console.error(error);
                return await replyWithError(reply);
            }
            return;
        }
        // either requesting quote by id or by alias
        default: {
            const quoteId = parseInt(args[0]);
            if (!isNaN(quoteId)) {
                const quote = getQuoteById(quoteId);
                if (!quote)
                    return await reply(
                        `Quote with id ${quoteId} could not be found`
                    );
                return await replyWithQuote(quote, reply);
            }
            const alias = args[0];
            const quote = getQuoteByAlias(alias);
            if (!quote)
                return await reply(
                    `Quote with alias ${alias} could not be found`
                );
            return await replyWithQuote(quote, reply);
        }
    }
}

async function replyWithQuote(
    quote: Quote,
    reply: (text: string) => Promise<void>
) {
    await reply(
        `#${quote?.id}: ${quote?.quote} ${quote?.date}${
            !(quote?.alias === 'NONE') ? `. Also known as ${quote.alias}` : ''
        } `
    );
}

async function replyWithError(reply: (text: string) => Promise<void>) {
    await reply(
        "An error occured. Please try again. If it still doesn't work, something is" +
            'probably on fire. #blameFloha'
    );
}

async function isMod(bot: Bot, messageEvent: MessageEvent) {
    const mods = await bot.getMods(messageEvent.broadcasterName);
    return (
        mods.filter((mod) => mod.userName === messageEvent.userName).length > 0
    );
}
