const SlashCommand = require('../../managers/structures/SlashCommands.js');

module.exports = class SetPrison extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'prison',
            description: 'Gérer le système de prison',
            options: [{
                name: 'configurer',
                description: 'Configurer le système de prison',
                type: 1,
                options: [
                    {
                        name: 'rôle-prison',
                        description: 'Le rôle qui sera attribué aux membres en prison',
                        type: 8,
                        required: true
                    }]
            },
                {
                    name: 'supprimer',
                    description: 'Supprimer le système de prison',
                    type: 1,
                }],
            category: SlashCommand.Categories.Admin,
            user_permissions: ['ManageGuild']
        });
    }

    async run (ctx) {
        const subCommand = ctx.options.getSubcommand();
        const base = await ctx.database.table('guild_prison').select().where("guild_id", ctx.guild.id);

        if (subCommand === 'configurer') {
            const roleAdd = ctx.options.getRole('rôle-prison');

            if (roleAdd.position >= ctx.me.roles.highest.position) return ctx.error(ctx.translate`Le rôle à ajouter en prison doit être inférieur à mon rôle le plus haut !`);
            if (roleAdd.managed) return ctx.error(ctx.translate`Le rôle à ajouter en prison ne doit pas être un rôle géré par un bot !`);

            if (!base[0]) {
                await ctx.database.table("guild_prison").insert({
                    guild_id: ctx.guild.id,
                    role_add_id: roleAdd.id
                });

                ctx.send({ content: ctx.translate`${ctx.emojiSuccess} Le système de prison a été configuré !` });
            } else {
                await ctx.database.table("guild_prison").update({
                    role_add_id: roleAdd.id
                }).where("guild_id", ctx.guild.id);

                ctx.send({ content: ctx.translate`${ctx.emojiSuccess} Le système de prison a été mis à jour !` });
            }
        }
        else if (subCommand === 'supprimer') {
            if (!base[0]) return ctx.error(ctx.translate`Le système de prison n'est pas configuré !`);

            await ctx.database.table('guild_prison').delete().where("guild_id", ctx.guild.id);

            ctx.send({ content: ctx.translate`${ctx.emojiSuccess} Le système de prison a été supprimé !` });
        }
    }
}