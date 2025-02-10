import { Quote } from './quotes.js';

export enum REMOTE_QUOTE_SOURCES {
    CEEJUS = 'ceejus'
}

const SOURCES_URL_MAP: Record<REMOTE_QUOTE_SOURCES, string> = {
    [REMOTE_QUOTE_SOURCES.CEEJUS]:
        'https://ceejus.deepwelldevelopment.com/api/quotes/quote'
};

interface RemoteQuote {
    id: number;
    quote: string;
    alias: string;
    quotedBy: string;
    quotedOn: string;
}

export async function getRemoteQuote(
    args: string[],
    source: REMOTE_QUOTE_SOURCES
): Promise<Quote | undefined> {
    const url = SOURCES_URL_MAP[source];
    let requestUrl: string;
    try {
        // Random quote requested
        if (args.length === 0) {
            return await sendAndParseRequest(url);
        }
        const id = parseInt(args[0], 10);
        if (Number.isNaN(id)) {
            const alias = args.join(' ');
            requestUrl = `${url}?alias=${alias}`;
            return await sendAndParseRequest(requestUrl);
        }
        requestUrl = `${url}?quoteNumber=${id}`;
        return await sendAndParseRequest(requestUrl);
    } catch (error) {
        console.error(error);
        return;
    }
}

async function sendAndParseRequest(requestUrl: string): Promise<Quote> {
    const res = await fetch(requestUrl);
    if (!res.ok) {
        throw new Error(`Error getting remote quote, Status: ${res.status}`);
    }
    const data = (await res.json()) as RemoteQuote;
    return {
        date: data.quotedOn,
        id: data.id,
        quote: data.quote,
        alias: data.alias
    };
}
