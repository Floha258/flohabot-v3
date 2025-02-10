import Database from 'better-sqlite3';

const db = new Database(process.env.dbName || 'bot.db');

export interface Quote {
    quote: string;
    id: number;
    date: string;
    alias?: string;
}

function getDateString(): string {
    const date = new Date(Date.now());
    return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
}

/**
 * Adds a new quote
 * @param quote The quote to add
 * @return The full quote object that was added to the db or void if something went wrong
 */
export function addQuote(quote: string): Quote | undefined {
    const date = getDateString();
    try {
        const addData = db
            .prepare(
                'INSERT INTO `quotes` (quote_text, creation_date) VALUES (?, ?)'
            )
            .run(quote, date);
        if (!addData || !addData.lastInsertRowid) return;
        return { id: Number(addData.lastInsertRowid), date, quote };
    } catch (error) {
        console.error(error);
        return;
    }
}

/**
 * Deletes a given code from the db
 * @param id The id of the quote to delete
 * @return true if the deletion was succesful or false if something went wrong
 */
export function deleteQuote(id: number): boolean {
    try {
        db.prepare('DELETE FROM `quotes` WHERE id = ?').run(id);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

/**
 *
 * @param id
 * @param newQuote
 */
export function editQuote(id: number, newQuote: string): Quote | undefined {
    try {
        db.prepare('UPDATE `quotes` SET `quote_text` = ? WHERE `id` = ?').run(
            newQuote,
            id
        );
        return getQuoteById(id);
    } catch (error) {
        console.log(error);
        return;
    }
}

interface DbQuote {
    id: number;
    quote_text: string;
    creation_date: string;
    alias?: string;
}

/**
 *
 * @param id
 */
export function getQuoteById(id: number): Quote | undefined {
    try {
        const quote = db
            .prepare('SELECT * FROM `quotes` WHERE `id` = ?')
            .get(id) as DbQuote | undefined;
        if (!quote) {
            return;
        }
        return {
            id: quote.id,
            quote: quote.quote_text,
            date: quote.creation_date,
            alias:
                quote.alias || quote.alias !== 'NONE' ? quote.alias : undefined,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export function getQuoteByAlias(alias: string): Quote | undefined {
    try {
        const quote = db
            .prepare('SELECT * FROM `quotes` WHERE `alias` = ?')
            .get(alias) as DbQuote | undefined;
        if (!quote) {
            return undefined;
        }
        return {
            id: quote.id,
            quote: quote.quote_text,
            date: quote.creation_date,
            alias: quote.alias
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export function getRandomQuote(): Quote | undefined {
    try {
        const quote = db
            .prepare('SELECT * FROM `quotes` ORDER BY random() LIMIT 1')
            .get() as DbQuote;
        return {
            id: quote.id,
            quote: quote.quote_text,
            date: quote.creation_date,
            alias: quote.alias
        };
    } catch (error) {
        console.log(error);
        return;
    }
}

export function searchQuote(searchString: string): Quote | Quote[] | undefined {
    try {
        const quotes = (db.prepare('SELECT * FROM `quotes`').all() as DbQuote[])
            .filter((dbQuote) =>
                dbQuote.quote_text.includes(searchString.toLowerCase())
            )
            .map((filteredQuote) => {
                return {
                    id: filteredQuote.id,
                    quote: filteredQuote.quote_text,
                    date: filteredQuote.creation_date,
                    alias: filteredQuote.alias
                };
            });
        if (quotes.length === 0) return;
        if (quotes.length === 1) return quotes[0];
        return quotes;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export function aliasQuote(alias: string, quoteId: number): Quote | undefined {
    try {
        db.prepare('UPDATE `quotes` SET `alias` = ? WHERE `id` = ?').run(
            alias,
            quoteId
        );
        return getQuoteByAlias(alias);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export function getLatestQuote(): Quote | undefined {
    try {
        const quote = db
            .prepare('SELECT * from `quotes` ORDER BY id DESC LIMIT 1')
            .get() as DbQuote;
        return {
            alias:
                quote.alias || quote.alias !== 'NONE' ? quote.alias : undefined,
            date: quote.creation_date,
            id: quote.id,
            quote: quote.quote_text
        };
    } catch (error) {
        console.log(error);
        return;
    }
}
