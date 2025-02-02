import type { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface DiscordCommand {
    data: SlashCommandBuilder;

    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CommandObject {
    name: string;
    command: DiscordCommand;
}
