const SlashCommand = require('../../managers/structures/SlashCommands.js');
const { PermissionsBitField } = require('discord.js');
const ms = require('ms');
const schedule = require('node-schedule');

module.exports = class CreatePrivateChannel extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'salon-perso',
            description: 'Gérer le salon personnel d\'un membre',
            options: [{
                name: 'créer',
                description: 'Créer un salon personnel pour un membre',
                type: 1,
                options: [{
                    name: 'membre',
                    description: 'Le membre à qui créer un salon privé',
                    type: 6,
                    required: true
                }, {
                    name: 'catégorie',
                    description: 'La catégorie où créer le salon privé',
                    type: 7,
                    channel_types: [4],
                    required: true
                }, {
                    name: 'raison',
                    description: 'La raison de la création du salon privé',
                    type: 3,
                    required: true
                }, {
                    name: 'temps',
                    description: 'Temps avant suppression du salon (1s/m/h/d)',
                    type: 3,
                    required: false
                }]
            },
                {
                    name: 'supprimer',
                    description: 'Supprimer le salon personnel d\'un membre',
                    type: 1,
                    options: [{
                        name: 'membre',
                        description: 'Le membre à qui créer un salon privé',
                        type: 6,
                        required: true
                    }]
                }],
            category: SlashCommand.Categories.Admin,
            user_permissions: ['ManageGuild'],
            bot_permissions: ['ManageChannels']
        });
    }

    async run (ctx) {
        const subCommand = ctx.options.getSubcommand();
        const member = ctx.options.getMember('membre');
        if (!member) return ctx.error(ctx.translate`Le membre n'est pas présent sur le serveur !`);

        const base = await ctx.database.table('guild_private_channel').select().where({
            guild_id: ctx.guild.id,
            user_id: member.id
        });

        if (subCommand === 'créer') {
            if (base[0]) return ctx.error(ctx.translate`Le membre **${member.displayName}** a déjà un salon privé !`);

            const category = ctx.options.getChannel('catégorie');
            const reason = ctx.options.getString('raison');
            const time = ctx.options.getString('temps') || null;

            let timing = null;
            if (time) {
                if (ms(time) > ms('5y')) return ctx.error(ctx.translate`Le temps doit être inférieur à 5 ans !`);
                timing = (Date.now()) + ms(time);
            }

            const channel = await ctx.guild.channels.create({
                name: member.displayName,
                type: 0,
                parent: category,
                permissionOverwrites: [
                    {
                        id: ctx.guild.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel
                        ],
                        deny: [
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ]
            }).catch(() => null);

            if (!channel) return ctx.error(ctx.translate`Impossible de créer le salon personnel !`);

            channel.send({
                content:ctx.translate`👤**Salon Perso de :** ${member} | ${member.displayName} (\`${member.id}\`)\n:calendar_spiral: **Valable jusqu'au :** ${timing ? `<t:${Math.floor(timing/1000)}:F>` : ctx.translate`Non défini`}\n**:mag_right: Raison :** ${reason}`
            }); 

            await ctx.database.table('guild_private_channel').insert({
                guild_id: ctx.guild.id,
                user_id: member.id,
                channel_id: channel.id,
                time: timing ? timing : null
            });

            if (time) {
                schedule.scheduleJob(timing, async () => {
                    await channel.delete().catch(() => null);
                    await ctx.database.table('guild_private_channel').delete().where({
                        guild_id: ctx.guild.id,
                        user_id: member.id
                    });
                });
            }

            ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le salon privé ${channel} du membre **${member.displayName}** a été créé !`});
        }
        else if (subCommand === 'supprimer') {
            if (!base[0]) return ctx.error(ctx.translate`Le membre **${member.displayName}** n'a pas de salon privé !`);

            const channel = ctx.guild.channels.cache.get(base[0].channel_id);
            if (channel) await channel.delete().catch(() => null);

            await ctx.database.table('guild_private_channel').delete().where({
                guild_id: ctx.guild.id,
                user_id: member.id
            });

            ctx.send({content: ctx.translate`${ctx.emojiSuccess} Le salon privé du membre **${member.displayName}** a été supprimé !`});
        }
    }
}