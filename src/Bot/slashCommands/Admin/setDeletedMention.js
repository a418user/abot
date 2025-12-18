const SlashCommand = require('../../managers/structures/SlashCommands.js');

module.exports = class DeletedMention extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'mention-supprimée',
            description: 'Gérer le système de mentions supprimées',
            options: [{
                name: 'activer',
                description: 'Activer le système de mentions supprimées',
                type: 1,
                options: [{
                    name: 'salon',
                    description: 'Le salon où les mentions supprimées seront envoyées',
                    type: 7,
                    channel_types: [0],
                    required: true
                }]
            }, {
                name: 'désactiver',
                description: 'Désactiver le système de mentions supprimées',
                type: 1
        }],
            category: SlashCommand.Categories.Admin,
            user_permissions: ['ManageGuild']
        });
    }

    async run (ctx) {
        const subCommand = ctx.options.getSubcommand();
        const base = await ctx.database.table('guild_ghost_ping').select('guild_id').where("guild_id", ctx.guild.id);

        if (subCommand === 'activer') {
            const channel = ctx.options.getChannel('salon');
            if (!base[0]) {
                await ctx.database.table("guild_ghost_ping").insert({
                    guild_id: ctx.guild.id,
                    channel_id: channel.id
                });

                ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de mentions supprimées a été activé dans ${channel} !`});
            }
            else {
                await ctx.database.table("guild_ghost_ping").update({
                    channel_id: channel.id
                }).where({guild_id: ctx.guild.id});

                ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de mentions supprimées a été mis à jour dans ${channel} !`});
            }
        }
        else if (subCommand === 'désactiver') {
            if (!base[0]) return ctx.error(ctx.translate`Le système de mentions supprimées n'est pas activé !`);

            await ctx.database.table("guild_ghost_ping").delete().where({guild_id: ctx.guild.id});
            ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de mentions supprimées a été désactivé !`});
        }
    }
}