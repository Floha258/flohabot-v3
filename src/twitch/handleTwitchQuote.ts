import {
    addQuote,
    aliasQuote,
    deleteQuote,
    editQuote,
    getLatestQuote,
    getQuoteByAlias,
    getQuoteById,
    getRandomQuote,
    searchQuote
} from '../quotes/quotes.js';
import { isMod, replyWithError, replyWithQuote } from './twitchBot.js';
import { ChatMessage } from '@twurple/chat';

export async function handleTwitchQuote(
    args: string[],
    reply: (message: string) => Promise<void>,
    message: ChatMessage
): Promise<void> {
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
                return await reply(
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
            if (!isMod(message.userInfo))
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
            if (!isMod(message.userInfo)) {
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
            if (!isMod(message.userInfo))
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
        case 'latest': {
            const quote = getLatestQuote();
            if (!quote) {
                return await replyWithError(reply);
            }
            return await replyWithQuote(quote, reply);
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
