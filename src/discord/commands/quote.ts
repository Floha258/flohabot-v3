import type {
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedAuthorOptions
} from 'discord.js';
import {
    SlashCommandBuilder,
    EmbedBuilder,
    GuildMemberRoleManager
} from 'discord.js';
import type { CommandObject } from '../../../types.js';
import {
    addQuote,
    deleteQuote,
    editQuote,
    getQuoteByAlias,
    getQuoteById,
    getRandomQuote,
    Quote
} from '../../quotes/quotes.js';

const MOD_ROLE_ID = '341653957120098304';

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
                            .setDescription('The id of the quote to deleted')
                            .setMinValue(1)
                            .setRequired(true)
                    )
            ),
        async execute(interaction: ChatInputCommandInteraction) {
            if (!interaction.isChatInputCommand()) return;
            await interaction.deferReply();
            switch (interaction.options.getSubcommand()) {
                case 'add': {
                    const quoteText = interaction.options.getString(
                        'quote',
                        true
                    );
                    const quote = addQuote(quoteText);
                    if (!quote) {
                        await interaction.editReply({
                            content: '',
                            embeds: [buildErrorEmbed()],
                            allowedMentions: { repliedUser: false }
                        });
                        return;
                    }
                    await interaction.editReply({
                        content: '',
                        embeds: [
                            buildQuoteEmbed(quote, {
                                title: `Added quote #${quote.id}`
                            })
                        ],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }
                case 'get': {
                    const id = interaction.options.getInteger('id');
                    const alias = interaction.options.getString('alias');
                    let quote;
                    if (!id && !alias) {
                        quote = getRandomQuote();
                        if (!quote) {
                            await interaction.editReply({
                                embeds: [buildErrorEmbed()],
                                allowedMentions: { repliedUser: false }
                            });
                            return;
                        }
                    }
                    if (id) {
                        quote = getQuoteById(id);
                        if (!quote) {
                            await interaction.editReply({
                                embeds: [
                                    buildQuoteNotFoundEmbed(id, undefined)
                                ],
                                allowedMentions: { repliedUser: false }
                            });
                            return;
                        }
                    }
                    if (alias) {
                        quote = getQuoteByAlias(alias);
                        if (!quote) {
                            await interaction.editReply({
                                embeds: [
                                    buildQuoteNotFoundEmbed(undefined, alias)
                                ],
                                allowedMentions: { repliedUser: false }
                            });
                            return;
                        }
                    }
                    await interaction.editReply({
                        embeds: [buildQuoteEmbed(quote!)],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }
                case 'edit': {
                    const modRole = (
                        interaction.member?.roles as GuildMemberRoleManager
                    ).cache.get(MOD_ROLE_ID);
                    if (!modRole) {
                        await interaction.editReply({
                            embeds: [buildPermissionDeniedEmbed()],
                            allowedMentions: { repliedUser: false }
                        });
                        return;
                    }
                    const id = interaction.options.getInteger('id', true);
                    const edit = interaction.options.getString('quote', true);
                    const quote = editQuote(id, edit);
                    if (!quote) {
                        await interaction.editReply({
                            embeds: [buildErrorEmbed()],
                            allowedMentions: { repliedUser: false }
                        });
                        return;
                    }
                    await interaction.editReply({
                        embeds: [
                            buildQuoteEmbed(quote, {
                                title: `Edited quote #${quote?.id}`
                            })
                        ],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }
                case 'delete': {
                    const modRole = (
                        interaction.member?.roles as GuildMemberRoleManager
                    ).cache.get(MOD_ROLE_ID);
                    if (!modRole) {
                        await interaction.editReply({
                            embeds: [buildPermissionDeniedEmbed()],
                            allowedMentions: { repliedUser: false }
                        });
                        return;
                    }
                    const id = interaction.options.getInteger('id', true);
                    const success = deleteQuote(id);
                    if (!success) {
                        await interaction.editReply({
                            embeds: [buildErrorEmbed()],
                            allowedMentions: { repliedUser: false }
                        });
                    }
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#00ff00')
                                .setTitle('Deleted Quote')
                                .setDescription(
                                    `Successfully deleted quote #${id}. It will be missed`
                                )
                        ],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }
                default:
                    // This shouldn't happen
                    console.error('Invalid subcommand. How did this happen?');
                    await interaction.editReply(
                        "You have found the super secret message. Congratulations. This really shouldn't happen"
                    );
            }
            await interaction.reply('Pong!');
        }
    }
};

function buildQuoteEmbed(
    quote: Quote,
    options?: Partial<{
        color: ColorResolvable;
        author: EmbedAuthorOptions;
        title: string;
        description: string;
        fields: { name: string; value: string; inline: boolean }[];
        footer: string;
    }>
) {
    let fields;
    if (options && options.fields) {
        fields = options.fields;
    }
    const embed = new EmbedBuilder()
        .setColor(options?.color || '#a91438')
        .setTitle(options?.title || `Quote #${quote.id}`)
        .setDescription(options?.description || quote.quote)
        .setAuthor(options?.author || { name: 'Flohabot - Quotes' });
    if (
        options?.footer ||
        (quote.alias && quote.alias != 'NONE' && quote.alias != 'unknown')
    ) {
        embed.setFooter({
            text: options?.footer || `Also known as: ${quote.alias}`
        });
    }
    if (fields) {
        embed.setFields(...fields);
    } else {
        embed.setFields({
            name: 'Quoted on',
            value: quote.date,
            inline: true
        });
    }
    return embed;
}

function buildErrorEmbed() {
    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Something went wrong')
        .setDescription(
            "Please try again. If it still doesn't work #blameFloha"
        );
}

function buildPermissionDeniedEmbed() {
    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Access Denied')
        .setDescription(
            'You have insufficient permissions to perform this action'
        );
}

function buildQuoteNotFoundEmbed(
    id: number | undefined,
    alias: string | undefined
) {
    const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('Quote not found');
    if (id) {
        embed.setDescription(`Quote with id #${id} does not exist`);
    }
    if (alias) {
        embed.setDescription(`Quote with alias ${alias} does not exist`);
    }
    return embed;
}

export default quote;
