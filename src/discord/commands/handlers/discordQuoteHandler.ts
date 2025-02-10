import {
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedAuthorOptions,
    EmbedBuilder,
    GuildMemberRoleManager,
    messageLink,
    MessageReaction,
    User
} from 'discord.js';
import {
    addQuote,
    deleteQuote,
    editQuote,
    getQuoteByAlias,
    getQuoteById,
    getRandomQuote,
    Quote,
    searchQuote
} from '../../../quotes/quotes.js';

export const MOD_ROLE_ID = '341653957120098304';
export const LEFT_ARROW = '⬅️';
export const RIGHT_ARROW = '➡';

export function buildQuoteEmbed(
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

export function buildErrorEmbed() {
    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Something went wrong')
        .setDescription(
            "Please try again. If it still doesn't work #blameFloha"
        );
}

export function buildPermissionDeniedEmbed() {
    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Access Denied')
        .setDescription(
            'You have insufficient permissions to perform this action'
        );
}

export function buildQuoteNotFoundEmbed(
    options: Partial<{
        id: number;
        alias: string;
        searchString: string;
    }>
) {
    const { id, alias, searchString } = options;
    const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('Quote not found');
    if (id) {
        embed.setDescription(`Quote with id #${id} does not exist`);
    }
    if (alias) {
        embed.setDescription(`Quote with alias ${alias} does not exist`);
    }
    if (searchString) {
        embed.setDescription(
            `Could not found any quote that includes '${searchString}'`
        );
    }
    return embed;
}

export const discordQuoteHandler = async (
    interaction: ChatInputCommandInteraction
) => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply();
    switch (interaction.options.getSubcommand()) {
        case 'add': {
            const quoteText = interaction.options.getString('quote', true);
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
                        embeds: [buildQuoteNotFoundEmbed({ id })],
                        allowedMentions: { repliedUser: false }
                    });
                    return;
                }
            }
            if (alias) {
                quote = getQuoteByAlias(alias);
                if (!quote) {
                    await interaction.editReply({
                        embeds: [buildQuoteNotFoundEmbed({ alias })],
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
        case 'search': {
            const searchString = interaction.options.getString('text', true);
            const searchResult = searchQuote(searchString);
            if (!searchResult) {
                await interaction.editReply({
                    embeds: [buildQuoteNotFoundEmbed({ searchString })]
                });
                return;
            }
            if (Array.isArray(searchResult)) {
                const res = await interaction.editReply({
                    embeds: [
                        buildQuoteEmbed(searchResult[0], {
                            title: `Quote #${searchResult[0].id} - 1/${searchResult.length}`
                        })
                    ],
                    allowedMentions: { repliedUser: false }
                });

                let searchIndex = 0;

                await res.react(LEFT_ARROW);
                await res.react(RIGHT_ARROW);

                const leftArrowCollectorFilter = (
                    reaction: MessageReaction,
                    user: User
                ) => {
                    return (
                        reaction.emoji.name === LEFT_ARROW &&
                        user.id === interaction.user.id
                    );
                };
                const rightArrowCollectorFilter = (
                    reaction: MessageReaction,
                    user: User
                ) => {
                    return (
                        reaction.emoji.name === RIGHT_ARROW &&
                        user.id === interaction.user.id
                    );
                };

                const leftCollector = res.createReactionCollector({
                    filter: leftArrowCollectorFilter
                });
                const rightCollector = res.createReactionCollector({
                    filter: rightArrowCollectorFilter
                });

                rightCollector.on('collect', async (reaction) => {
                    if (searchIndex < searchResult.length - 1) {
                        searchIndex++;
                        await interaction.editReply({
                            embeds: [
                                buildQuoteEmbed(searchResult[searchIndex], {
                                    title: `Quote #${searchResult[searchIndex].id} - ${searchIndex + 1}/${searchResult.length}`
                                })
                            ],
                            allowedMentions: { repliedUser: false }
                        });
                    }
                    await reaction.users.remove(interaction.user.id)
                });

                leftCollector.on('collect', async (reaction) => {
                    if (searchIndex > 0) {
                        searchIndex--;
                        await interaction.editReply({
                            embeds: [
                                buildQuoteEmbed(searchResult[searchIndex], {
                                    title: `Quote #${searchResult[searchIndex].id} - ${searchIndex + 1}/${searchResult.length}`
                                })
                            ],
                            allowedMentions: { repliedUser: false }
                        });
                        await reaction.users.remove(interaction.user.id)
                    }
                });
                return;
            }
            await interaction.editReply({
                embeds: [buildQuoteEmbed(searchResult)],
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
            return;
    }
};
