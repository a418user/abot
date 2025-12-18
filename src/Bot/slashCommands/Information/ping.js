const SlashCommand = require('../../managers/structures/SlashCommands.js');
const { EmbedBuilder } = require('discord.js');

module.exports = class Ping extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'ping',
            description: 'Afficher le ping du bot',
            category: SlashCommand.Categories.Information,
            bot_permissions: ['EmbedLinks']
        });
    }

    async run (ctx) {
        const embed = new EmbedBuilder()
            .setTitle(ctx.translate`Pong !`)
            .setDescription(ctx.translate`🤖 La latence du bot est de **${Date.now() - ctx.inter.createdTimestamp} ms**\n:satellite: Le ping de l'api est de **${Math.round(ctx.client.ws.ping)} ms**`)
            .setColor(ctx.colors.blue);

        ctx.send({ embeds: [embed] });
    }
}
