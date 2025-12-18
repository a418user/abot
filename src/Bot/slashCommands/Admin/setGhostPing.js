const SlashCommand = require('../../managers/structures/SlashCommands.js');

module.exports = class GhostPing extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'ghost-ping',
            description: 'Gérer le système de ghost ping lors de l\'arrivée d\'un membre',
            options: [{
                name: 'activer',
                description: 'Activer le système de ghost ping lors de l\'arrivée d\'un membre',
                type: 1,
                options: [{
                    name: 'salon',
                    description: 'Le salon où le ghostping sera envoyé',
                    type: 7,
                    channel_types: [0],
                    required: true
                }, {
                    name: 'salon-2',
                    description: 'Un autre salon où le ghostping sera envoyé',
                    type: 7,
                    channel_types: [0],
                    required: false
                }, {
                    name: 'salon-3',
                    description: 'Un autre salon où le ghostping sera envoyé',
                    type: 7,
                    channel_types: [0],
                    required: false
                }, {
                    name: 'salon-4',
                    description: 'Un autre salon où le ghostping sera envoyé',
                    type: 7,
                    channel_types: [0],
                    required: false
                }, {
                    name: 'salon-5',
                    description: 'Un autre salon où le ghostping sera envoyé',
                    type: 7,
                    channel_types: [0],
                    required: false
                }]
            }, {
                name: 'désactiver',
                description: 'Désactiver le système de ghost ping lors de l\'arrivée d\'un membre',
                type: 1
        }],
            category: SlashCommand.Categories.Admin,
            user_permissions: ['ManageGuild']
        });
    }

    async run (ctx) {
        const subCommand = ctx.options.getSubcommand();
        const base = await ctx.database.table('guild_ghost_ping_member').select('guild_id').where("guild_id", ctx.guild.id);

        if (subCommand === 'activer') {
            const channel = ctx.options.getChannel('salon');
            const channel2 = ctx.options.getChannel('salon-2') || null;
            const channel3 = ctx.options.getChannel('salon-3') || null;
            const channel4 = ctx.options.getChannel('salon-4') || null;
            const channel5 = ctx.options.getChannel('salon-5') || null;

            if (!base[0]) {
                await ctx.database.table("guild_ghost_ping_member").insert({
                    guild_id: ctx.guild.id,
                    channel_id: channel.id,
                    channel_id_2: channel2 ? channel2.id : null,
                    channel_id_3: channel3 ? channel3.id : null,
                    channel_id_4: channel4 ? channel4.id : null,
                    channel_id_5: channel5 ? channel5.id : null
                });

                ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de ghost ping a été activé !`});
            }
            else {
                await ctx.database.table("guild_ghost_ping_member").update({
                    channel_id: channel.id,
                    channel_id_2: channel2 ? channel2.id : null,
                    channel_id_3: channel3 ? channel3.id : null,
                    channel_id_4: channel4 ? channel4.id : null,
                    channel_id_5: channel5 ? channel5.id : null
                }).where({guild_id: ctx.guild.id});

                ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de ghost ping a été mis à jour !`});
            }
        }
        else if (subCommand === 'désactiver') {
            if (!base[0]) return ctx.error(ctx.translate`Le système de ghost ping n'est pas activé !`);

            await ctx.database.table("guild_ghost_ping_member").delete().where({guild_id: ctx.guild.id});
            ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le système de ghost ping a été désactivé !`});
        }
    }
}