const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class SetInvite extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "set-invite",
      description: "Gérer le système d'invitation",
      options: [
        {
          name: "créer",
          description: "Créer le système d'invitation",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Le salon où les messages d'invitations arriveront",
              type: 7,
              channel_types: [0],
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le système d'invitation",
          type: 1,
          options: [
            {
              name: "réinitialiser",
              description: "Réinitialiser le système d'invitation",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "réinitialiser",
          description: "Réinitialiser le système d'invitation",
          type: 1,
        },
        {
          name: "ajouter-rôle",
          description: "Ajouter un rôle de récompense au système d'invitation",
          type: 1,
          options: [
            {
              name: "rôle",
              description: "Rôle à ajouter",
              type: 8,
              required: true,
            },
            {
              name: "invites",
              description: "Nombre d'invitations requises",
              type: 4,
              min_value: 1,
              required: true,
            },
          ],
        },
        {
          name: "retirer-rôle",
          description: "Retirer un rôle de récompense du système d'invitation",
          type: 1,
          options: [
            {
              name: "rôle",
              description: "Rôle à retirer",
              type: 8,
              required: true,
            },
          ],
        },
        {
          name: "liste-rôles",
          description: "Liste des rôles de récompense du système d'invitation",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Invites,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_invite_config")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "créer") {
      const channel = ctx.options.getChannel("salon");

      if (!ctx.me.permissions.has(["ManageGuild", "ManageChannels"]))
        return ctx.error(
          ctx.translate`Je n'ai pas les permissions \`Manage Server\` et \`Manage Channels\` pour gérer les invitations !`
        );

      const channelMissing = ctx.guild.channels.cache
        .filter(
          (ch) =>
            ch.type === 0 && !ch.permissionsFor(ctx.me).has("ManageChannels")
        )
        .map((ch) => ch.name);

      if (channelMissing.length > 1)
        return ctx.error(
          ctx.translate`Je ne pourrai peut-être pas suivre les invitations correctement.\nJe manque de la permission \`Manage Channel\` dans les salons suivants : ${channelMissing.join(
            ", "
          )}`
        );

      if (!base[0]) {
        await ctx.database.table("guild_invite_config").insert({
          guild_id: ctx.guild.id,
          channel_id: channel.id,
        });

        // Add invites to the cache
        await ctx.invitesManager.cacheGuildInvites(ctx.guild);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système d'invitation a été créé !`,
        });
      } else {
        await ctx.database
          .table("guild_invite_config")
          .update({
            channel_id: channel.id,
          })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système d'invitation a été mis à jour !`,
        });
      }
    } else if (subCommand === "supprimer") {
      const reset = ctx.options.getBoolean("réinitialiser");
      if (!base[0])
        return ctx.error(ctx.translate`Le système d'invitation n'existe pas !`);

      await ctx.database
        .table("guild_invite_config")
        .delete()
        .where("guild_id", ctx.guild.id);

      // Remove the guild from the cache
      ctx.invitesManager.resetInviteCache(ctx.guild.id);

      if (reset) {
        await ctx.database
          .table("user_invite")
          .delete()
          .where("guild_id", ctx.guild.id);
        return ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système d'invitation a été supprimé et réinitialisé !`,
        });
      } else {
        return ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système d'invitation a été supprimé !`,
        });
      }
    } else if (subCommand === "réinitialiser") {
      if (!base[0])
        return ctx.error(ctx.translate`Le système d'invitation n'existe pas !`);

      await ctx.database
        .table("user_invite")
        .delete()
        .where("guild_id", ctx.guild.id);
      return ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le système d'invitation a été réinitialisé !`,
      });
    } else if (subCommand === "ajouter-rôle") {
      const role = ctx.options.getRole("rôle");
      const invites = ctx.options.getInteger("invites");

      if (!base[0])
        return ctx.error(ctx.translate`Le système d'invitation n'existe pas !`);

      // Check if the role is valid
      if (role.managed || role.position >= ctx.me.roles.highest.position)
        return ctx.error(
          ctx.translate`Le rôle ne peut pas être défini pour le système d'invitation !`
        );

      // Get all roles
      const roles = JSON.parse(base[0].roles);

      // Check if the role is already in the list
      if (roles.find((r) => r.roleId === role.id))
        return ctx.error(
          ctx.translate`Le rôle est déjà configuré dans le système d'invitation !`
        );

      // Add the new role
      roles.push({
        roleId: role.id,
        invites: invites,
      });

      await ctx.database
        .table("guild_invite_config")
        .update({
          roles: JSON.stringify(roles),
        })
        .where({ guild_id: ctx.guild.id });

      return ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle de récompense a été ajouté !`,
      });
    } else if (subCommand === "retirer-rôle") {
      const role = ctx.options.getRole("rôle");

      if (!base[0])
        return ctx.error(ctx.translate`Le système d'invitation n'existe pas !`);

      // Get all roles
      const roles = JSON.parse(base[0].roles);

      // Check if the role is in the list
      if (!roles.find((r) => r.roleId === role.id))
        return ctx.error(
          ctx.translate`Le rôle n'est pas configuré dans le système d'invitation !`
        );

      // Remove the role
      const removeRoles = roles.filter((r) => r.roleId !== role.id);

      await ctx.database
        .table("guild_invite_config")
        .update({
          roles: JSON.stringify(removeRoles),
        })
        .where({ guild_id: ctx.guild.id });

      return ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle de récompense a été supprimé !`,
      });
    } else if (subCommand === "liste-rôles") {
      if (!base[0])
        return ctx.error(ctx.translate`Le système d'invitation n'existe pas !`);

      const roles = JSON.parse(base[0].roles);

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des rôles de récompense`)
        .setDescription(
          roles
            .map((r) => {
              const inviteLabel =
                r.invites > 1
                  ? ctx.translate`invitations`
                  : ctx.translate`invitation`;
              return ctx.translate`<@&${r.roleId}> - \`${r.invites}\` ${inviteLabel}`;
            })
            .join("\n")
        )
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setColor(ctx.colors.blue);

      ctx.send({ embeds: [embed] });
    }
  }
};
