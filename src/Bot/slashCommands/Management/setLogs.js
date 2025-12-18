const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { PermissionsBitField } = require("discord.js");

module.exports = class ConfigLog extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "logs",
      description: "Gérer les logs",
      options: [
        {
          name: "configurer",
          description: "Configurer les logs",
          type: 1,
          options: [
            {
              name: "messages",
              description: "Salon des logs de messages",
              type: 7,
              channel_types: [0],
              required: false,
            },
            {
              name: "membres",
              description: "Salon des logs des membres",
              type: 7,
              channel_types: [0],
              required: false,
            },
            {
              name: "liens",
              description: "Salon des logs d'invitations",
              type: 7,
              channel_types: [0],
              required: false,
            },
            {
              name: "serveur",
              description: "Salon des logs de serveur",
              type: 7,
              channel_types: [0],
              required: false,
            },
            {
              name: "vocal",
              description: "Salon des logs d'activités vocales",
              type: 7,
              channel_types: [0],
              required: false,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer les logs",
          type: 1,
          options: [
            {
              name: "choix",
              description: "Choisir quel logs à enlever",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Tout",
                  value: "all",
                },
                {
                  name: "Messages",
                  value: "messages",
                },
                {
                  name: "Membres",
                  value: "members",
                },
                {
                  name: "Liens",
                  value: "links",
                },
                {
                  name: "Serveur",
                  value: "server",
                },
                {
                  name: "Vocal",
                  value: "vocal",
                },
              ],
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["ManageChannels"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_log")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      let channelMessages = ctx.options.getChannel("messages");
      let channelMembers = ctx.options.getChannel("members");
      let channelLinks = ctx.options.getChannel("links");
      let channelServer = ctx.options.getChannel("server");
      let channelVocal = ctx.options.getChannel("vocal");

      let msg = null;

      if (
        !channelMessages &&
        !channelMembers &&
        !channelLinks &&
        !channelServer &&
        !channelVocal
      ) {
        msg = await ctx.send({
          content: ctx.translate(
            ":clock10: Les salons sont en cours de création..."
          ),
        });

        const category = await ctx.guild.channels
          .create({
            name: ctx.translate`🤖Logs🤖`,
            type: 4,
            permissionOverwrites: [
              {
                id: ctx.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: ctx.user.id,
                allow: [
                  PermissionsBitField.Flags.ManageChannels,
                  PermissionsBitField.Flags.ManageRoles,
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks,
                  PermissionsBitField.Flags.AttachFiles,
                ],
              },
              {
                id: ctx.client.user.id,
                allow: [
                  PermissionsBitField.Flags.ManageMessages,
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks,
                  PermissionsBitField.Flags.AttachFiles,
                ],
              },
            ],
            reason: ctx.translate`Catégorie des logs créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        if (!category)
          return msg.edit({
            content: ctx.translate`${ctx.emojiError} Je n'ai pas pu créer la catégorie des logs !`,
          });

        channelMessages = await ctx.guild.channels
          .create({
            name: ctx.translate`📃┆logs-messages`,
            type: 0,
            parent: category.id,
            reason: ctx.translate`Salon des logs Messages créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        channelMembers = await ctx.guild.channels
          .create({
            name: ctx.translate`📃┆logs-membres`,
            type: 0,
            parent: category.id,
            reason: ctx.translate`Salon des logs Membres créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        channelLinks = await ctx.guild.channels
          .create({
            name: ctx.translate`📃┆logs-liens`,
            type: 0,
            parent: category.id,
            reason: ctx.translate`Salon des logs Liens créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        channelServer = await ctx.guild.channels
          .create({
            name: ctx.translate`📃┆logs-serveur`,
            type: 0,
            parent: category.id,
            reason: ctx.translate`Salon des logs Serveur créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        channelVocal = await ctx.guild.channels
          .create({
            name: ctx.translate`📃┆logs-vocal`,
            type: 0,
            parent: category.id,
            reason: ctx.translate`Salon des logs Vocal créé par ${ctx.user.displayName}`,
          })
          .catch(() => null);

        if (
          !channelMessages ||
          !channelMembers ||
          !channelLinks ||
          !channelServer ||
          !channelVocal
        )
          return msg.edit({
            content: ctx.translate`${ctx.emojiError} Je n'ai pas pu créer les salons des logs !`,
          });

        await channelMessages.lockPermissions().catch(() => null);
        await channelMembers.lockPermissions().catch(() => null);
        await channelLinks.lockPermissions().catch(() => null);
        await channelServer.lockPermissions().catch(() => null);
        await channelVocal.lockPermissions().catch(() => null);
      }

      if (!base[0]) {
        await ctx.database.table("guild_log").insert({
          guild_id: ctx.guild.id,
          message_id: channelMessages ? channelMessages.id : null,
          update_member_id: channelMembers ? channelMembers.id : null,
          link_id: channelLinks ? channelLinks.id : null,
          update_server_id: channelServer ? channelServer.id : null,
          voice_id: channelVocal ? channelVocal.id : null,
        });

        await (msg ? msg.edit.bind(msg) : ctx.send.bind(ctx))({
          content: ctx.translate`${ctx.emojiSuccess} Les salons des logs ont bien été configurés !`,
        });
      } else {
        await ctx.database
          .table("guild_log")
          .update({
            message_id: channelMessages
              ? channelMessages.id
              : base[0].message_id
              ? base[0].message_id
              : null,
            update_member_id: channelMembers
              ? channelMembers.id
              : base[0].update_member_id
              ? base[0].update_member_id
              : null,
            link_id: channelLinks
              ? channelLinks.id
              : base[0].link_id
              ? base[0].link_id
              : null,
            update_server_id: channelServer
              ? channelServer.id
              : base[0].update_server_id
              ? base[0].update_server_id
              : null,
            voice_id: channelVocal
              ? channelVocal.id
              : base[0].voice_id
              ? base[0].voice_id
              : null,
          })
          .where("guild_id", ctx.guild.id);

        await (msg ? msg.edit.bind(msg) : ctx.send.bind(ctx))({
          content: ctx.translate`${ctx.emojiSuccess} Les salons des logs ont bien été mis à jour !`,
        });
      }
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Aucun salon de logs n'a été configuré !`,
        });

      const choice = ctx.options.getString("choix");

      if (choice === "all") {
        await ctx.database
          .table("guild_log")
          .delete()
          .where("guild_id", ctx.guild.id);
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Tous les salons de logs ont bien été supprimés !`,
        });
      } else {
        function capitalizeFirstLetter(word) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }

        let updateData = {};
        switch (choice) {
          case "messages":
            updateData = { message_id: null };
            break;
          case "members":
            updateData = { update_member_id: null };
            break;
          case "links":
            updateData = { link_id: null };
            break;
          case "server":
            updateData = { update_server_id: null };
            break;
          case "vocal":
            updateData = { voice_id: null };
            break;
        }

        await ctx.database
          .table("guild_log")
          .update(updateData)
          .where("guild_id", ctx.guild.id);
        ctx.send({
          content: ctx.translate`${
            ctx.emojiSuccess
          } Le salon de logs des ${capitalizeFirstLetter(
            choice
          )} a bien été supprimé !`,
        });
      }
    }
  }
};
