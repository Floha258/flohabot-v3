import type {
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

export interface DiscordCommand {
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | SlashCommandOptionsOnlyBuilder;

    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CommandObject {
    name: string;
    command: DiscordCommand;
}
