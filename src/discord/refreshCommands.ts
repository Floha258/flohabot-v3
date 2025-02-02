// Construct and prepare an instance of the REST module
import commandsList from './commands/_commands.js';
import { REST, Routes } from 'discord.js';

const guildId = process.env.DISCORD_GUILD_ID || '';
const clientId = process.env.DISCORD_CLIENT_ID || '';
const token = process.env.DISCORD_TOKEN || '';

const rest = new REST().setToken(token);

// and deploy your commands!
await (async () => {
    try {
        console.log(
            `Started refreshing ${commandsList.length} application (/) commands.`,
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            {
                body: commandsList.map((commandObject) =>
                    commandObject.command.data.toJSON(),
                ),
            },
        );

        console.log(
            `Successfully reloaded ${(data as unknown[]).length} application (/) commands.`,
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
