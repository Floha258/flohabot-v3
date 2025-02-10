import Express from 'express';
import { readFileSync } from 'fs';
import { startDiscordBot } from './discord/discordBot.js';
import { startTwitchBot } from './twitch/twitchBot.js';
import Database from 'better-sqlite3';

const PORT = process.env.port || '3258';
const app = Express();

const setupScript = readFileSync('./dbSetup.sql', 'utf-8');

const db = new Database(process.env.dbName || 'bot.db');

db.exec(setupScript);

app.listen(parseInt(PORT), () => {
    console.log(`Server started on port ${PORT}`);
});

await startDiscordBot();
await startTwitchBot();
