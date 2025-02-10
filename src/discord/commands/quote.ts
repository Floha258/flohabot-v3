import { SlashCommandBuilder } from 'discord.js';
import type { CommandObject } from '../../../types.js';
import { discordQuoteHandler } from './handlers/discordQuoteHandler.js';

const quote: CommandObject = {
    name: 'quote',
    command: {
        data: new SlashCommandBuilder()
            .setName('quote')
            .setDescription('Interact with quotes')
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('add')
                    .setDescription('Add a new quote')
                    .addStringOption((option) =>
                        option
                            .setName('quote')
                            .setDescription('The quote to add')
                            .setRequired(true)
                    )
            )
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('get')
                    .setDescription('Gets a quote from the database')
                    .addIntegerOption((option) =>
                        option
                            .setName('id')
                            .setDescription('id of the quote to get')
                            .setMinValue(1)
                    )
                    .addStringOption((option) =>
                        option
                            .setName('alias')
                            .setDescription('alias of the quote to get')
                            .setMinLength(1)
                    )
            )
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('edit')
                    .setDescription('Edit a quote')
                    .addIntegerOption((option) =>
                        option
                            .setName('id')
                            .setDescription('The id of the quote to edit')
                            .setMinValue(1)
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName('quote')
                            .setDescription('The edited quote')
                            .setRequired(true)
                    )
            )
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('delete')
                    .setDescription('Delete a quote')
                    .addIntegerOption((option) =>
                        option
                            .setName('id')
                            .setDescription('The id of the quote to delete')
                            .setMinValue(1)
                            .setRequired(true)
                    )
            )
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('search')
                    .setDescription('Search for a specific text in a quote')
                    .addStringOption((option) =>
                        option
                            .setName('text')
                            .setDescription('The text you want to search for')
                            .setMinLength(1)
                            .setRequired(true)
                    )
            )
            .addSubcommand((subCommand) =>
                subCommand
                    .setName('latest')
                    .setDescription('gets the latest quote from the db')
            ),
        execute: discordQuoteHandler
    }
};

export default quote;
