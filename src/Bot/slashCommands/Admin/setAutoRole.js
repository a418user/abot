const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class AutoRole extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "auto-role",
      description: "Gérer l'auto-rôle",
      options: [
        {
          name: "ajouter",
          description:
            "Ajouter un rôle qui sera donné automatiquement à l'utilisateur",
          type: 1,
          options: [
            {
              name: "rôle",
              description: "Le rôle à ajouter",
              type: 8,
              required: true,
            },
            {
              name: "type",
              description: "Le type du rôle",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Utilisateur",
                  value: "user",
                },
                {
                  name: "Bot",
                  value: "bot",
                },
              ],
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer un rôle de l'auto-rôle",
          type: 1,
          options: [
            {
              name: "rôle",
              description: "Le rôle à supprimer",
              type: 8,
              required: true,
            },
            {
              name: "type",
              description: "Le type du rôle",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Utilisateur",
                  value: "user",
                },
                {
                  name: "Bot",
                  value: "bot",
                },
              ],
            },
          ],
        },
        {
          name: "liste",
          description: "Lister tous les auto-rôles",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_auto_role")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "ajouter") {
      const role = ctx.options.getRole("rôle");
      const type = ctx.options.getString("type");

      if (role.position >= ctx.me.roles.highest.position)
        return ctx.error(
          ctx.translate`Le rôle **${role.name}** est au dessus de mon rôle le plus haut, je ne peux donc pas l'ajouter !`
        );
      if (role.managed)
        return ctx.error(
          ctx.translate`Le rôle **${role.name}** est géré par un bot, je ne peux donc pas l'ajouter !`
        );

      if (!base[0]) {
        await ctx.database.table("guild_auto_role").insert({
          guild_id: ctx.guild.id,
          roles: JSON.stringify([
            {
              roleId: role.id,
              type: type,
            },
          ]),
        });
      } else {
        const roles = JSON.parse(base[0].roles);
        if (roles.find((r) => r.roleId === role.id && r.type === type))
          return ctx.error(
            ctx.translate`Le rôle **${role.name}** est déjà dans la liste des auto-rôles !`
          );

        roles.push({
          roleId: role.id,
          type: type,
        });

        await ctx.database
          .table("guild_auto_role")
          .update({
            roles: JSON.stringify(roles),
          })
          .where("guild_id", ctx.guild.id);
      }

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle **${role.name}** a été ajouté à la liste des auto-rôles !`,
      });
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Il n'y a aucun auto-rôle sur ce serveur !`
        );

      const role = ctx.options.getRole("rôle");
      const type = ctx.options.getString("type");

      let roles = JSON.parse(base[0].roles);
      if (!roles.find((r) => r.roleId === role.id && r.type === type))
        return ctx.error(
          ctx.translate`Le rôle **${role.name}** n'est pas dans la liste des auto-rôles !`
        );

      roles = roles.filter((r) => r.roleId !== role.id);

      if (roles.length === 0) {
        await ctx.database
          .table("guild_auto_role")
          .delete()
          .where("guild_id", ctx.guild.id);
      } else {
        await ctx.database
          .table("guild_auto_role")
          .update({
            roles: JSON.stringify(roles),
          })
          .where("guild_id", ctx.guild.id);
      }

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle **${role.name}** a été supprimé de la liste des auto-rôles !`,
      });
    } else if (subCommand === "liste") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Il n'y a aucun auto-rôle sur ce serveur !`
        );

      const roles = JSON.parse(base[0].roles);

      const typeLabelMap = {
        user: ctx.translate`Utilisateur`,
        bot: ctx.translate`Bot`,
      };

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des auto-rôles`)
        .setColor(ctx.colors.blue)
        .setDescription(
          roles
            .map(
              (r) =>
                ctx.translate`**\`-\`** <@&${r.roleId}> - ${
                  typeLabelMap[r.type] ?? r.type
                }`
            )
            .join("\n")
        )
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        });

      ctx.send({ embeds: [embed] });
    }
  }
};
