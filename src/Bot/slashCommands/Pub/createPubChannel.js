const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { PermissionsBitField } = require("discord.js");

module.exports = class CreatePubChannel extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "pub-salons-config",
      description: "Gérer le système de publicités",
      options: [
        {
          name: "créer",
          description: "Créer les salons de publicités",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer les salons de publicités",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Pub,
      user_permissions: ["Administrator"],
      bot_permissions: ["ManageChannels"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const base = await ctx.database
      .table("guild_pub_channel")
      .select()
      .where({ guild_id: ctx.guild.id });

    if (subCommand === "créer") {
      if (base[0])
        return ctx.error(
          ctx.translate`Les salons de publicités sont déjà activés !`
        );

      const msg = await ctx.send({
        content: ctx.translate`:clock10: Création des salons de publicités en cours...`,
      });

      const category = await ctx.guild.channels
        .create({
          name: `══⊹⊱🪐Pub à thème🪐⊰⊹══`,
          type: 4,
        })
        .catch(() => null);

      if (!category)
        return ctx.error(
          ctx.translate`Impossible de créer la catégorie de publicités !`
        );

      const decoration1 = await ctx.guild.channels
        .create({
          name: `🪐╭-︰⁺˳⊹-✨-⨯-✨-⁺˳⊹`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              deny: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel1 = await ctx.guild.channels
        .create({
          name: `〖🎭〗communautaire`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel2 = await ctx.guild.channels
        .create({
          name: `〖🎥〗youtube-twitch`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel3 = await ctx.guild.channels
        .create({
          name: `〖📜〗manga-animé`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel4 = await ctx.guild.channels
        .create({
          name: `〖🎨〗artistique`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel5 = await ctx.guild.channels
        .create({
          name: `〖💻〗informatique`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel6 = await ctx.guild.channels
        .create({
          name: `〖📬〗publicitaire`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel7 = await ctx.guild.channels
        .create({
          name: `〖💰〗rôle-play`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel8 = await ctx.guild.channels
        .create({
          name: `〖🎮〗gaming`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel9 = await ctx.guild.channels
        .create({
          name: `〖📚〗autres`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const decoration2 = await ctx.guild.channels
        .create({
          name: `╰︰⁺˳⊹✨-⨯-✨-⁺˳⊹`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              deny: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const channel10 = await ctx.guild.channels
        .create({
          name: `〖🔍〗recherche`,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.id,
              allow: [PermissionsBitField.Flags.SendMessages],
            },
          ],
        })
        .catch(() => null);

      const verification = await ctx.guild.channels.create({
        name: "〖💚〗ᴠérifications",
        type: 0,
        permissionOverwrites: [
          {
            id: ctx.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: ctx.client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      const log = await ctx.guild.channels.create({
        name: "〖⚙〗logs-vérif",
        type: 0,
        permissionOverwrites: [
          {
            id: ctx.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: ctx.client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      const channels = [];
      if (channel1) channels.push(channel1.id);
      if (channel2) channels.push(channel2.id);
      if (channel3) channels.push(channel3.id);
      if (channel4) channels.push(channel4.id);
      if (channel5) channels.push(channel5.id);
      if (channel6) channels.push(channel6.id);
      if (channel7) channels.push(channel7.id);
      if (channel8) channels.push(channel8.id);
      if (channel9) channels.push(channel9.id);
      if (channel10) channels.push(channel10.id);

      const decorations = [];
      if (decoration1) decorations.push(decoration1.id);
      if (decoration2) decorations.push(decoration2.id);

      await ctx.database.table("guild_pub_channel").insert({
        guild_id: ctx.guild.id,
        category_id: category.id,
        verification_channel_id: verification.id,
        log_channel_id: log.id,
        channels: JSON.stringify(channels),
        channels_decoration: JSON.stringify(decorations),
      });

      msg.edit({
        content: ctx.translate`${ctx.emojiSuccess} Les salons de publicités ont été créés !`,
      });
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Les salons de publicités ne sont pas activés !`
        );

      const msg = await ctx.send({
        content: ctx.translate`:clock10: Suppression des salons de publicités en cours...`,
      });

      for (const channelId of JSON.parse(base[0].channels)) {
        const channel = ctx.getChannel(channelId);
        if (channel) await channel.delete().catch(() => null);
      }

      for (const channelId of JSON.parse(base[0].channels_decoration)) {
        const channel = ctx.getChannel(channelId);
        if (channel) await channel.delete().catch(() => null);
      }

      const verification = ctx.getChannel(base[0].verification_channel_id);
      if (verification) await verification.delete().catch(() => null);

      const log = ctx.getChannel(base[0].log_channel_id);
      if (log) await log.delete().catch(() => null);

      const category = ctx.guild.channels.cache.get(base[0].category_id);
      if (category) await category.delete().catch(() => null);

      await ctx.database
        .table("guild_pub_channel")
        .delete()
        .where({ guild_id: ctx.guild.id });

      msg
        .edit({
          content: ctx.translate`${ctx.emojiSuccess} Les salons de publicités ont été supprimés !`,
        })
        .catch(() => null);
    }
  }
};
