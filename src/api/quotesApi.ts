import { Router } from 'express';
import {
    getQuoteByAlias,
    getQuoteById,
    getRandomQuote,
    searchQuote
} from '../quotes/quotes.js';

export const quotesRouter = Router();

quotesRouter.get('/quote', (req, res) => {
    const { quoteNumber, alias, search } = req.query;
    let quote;
    if (quoteNumber) {
        const id = parseInt(quoteNumber as string, 10);
        quote = getQuoteById(id);
    } else if (alias) {
        quote = getQuoteByAlias(alias as string);
    } else if (search) {
        quote = searchQuote(search as string);
    } else {
        quote = getRandomQuote();
    }
    if (!quote) {
        res.sendStatus(404);
    }
    res.send(quote);
});
