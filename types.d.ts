import type {
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

export interface DiscordCommand {
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;

    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CommandObject {
    name: string;
    command: DiscordCommand;
}
