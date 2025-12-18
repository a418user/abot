const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class SetStats extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "statistiques",
      description: "Gérer les salons vocaux de statistiques",
      options: [
        {
          name: "créer",
          description: "Configurer les salons vocaux de statistiques",
          type: 1,
          options: [
            {
              name: "catégorie",
              description: "La catégorie pour les salons vocaux",
              type: 7,
              channel_types: [4],
              required: false,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Retirer les salons vocaux des statistiques",
          type: 1,
        },
        {
          name: "modifier",
          description: "Modifier les salons vocaux des statistiques",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Le salon vocal à modifier",
              type: 7,
              channel_types: [2],
              required: true,
            },
            {
              name: "nom",
              description: "Le nom du salon vocal",
              type: 3,
              required: true,
              min_length: 1,
              max_length: 20,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks", "ManageChannels"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    let base = await ctx.database
      .table("guild_statistics")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "créer") {
      const category = ctx.options.getChannel("catégorie") || null;

      const message = await ctx.send({
        content: ctx.translate(
          ":clock10: Création des salons vocaux de statistiques en cours..."
        ),
      });

      const members = await ctx.guild.members.fetch();
      const bots = members.filter((member) => member.user.bot);
      const humans = members.filter((member) => !member.user.bot);

      const channel1 = await ctx.guild.channels.create({
        name: ctx.translate`👤・Humains : ${humans.size}`,
        type: 2,
        parent: category ? category.id : category,
        permissionOverwrites: [
          { id: ctx.guild.id, deny: ["Connect"], allow: ["ViewChannel"] },
        ],
        reason: `Statistiques`,
      });
      const channel2 = await ctx.guild.channels.create({
        name: ctx.translate`🤖・Bots : ${bots.size}`,
        type: 2,
        parent: category ? category.id : category,
        permissionOverwrites: [
          { id: ctx.guild.id, deny: ["Connect"], allow: ["ViewChannel"] },
        ],
        reason: `Statistiques`,
      });
      const channel3 = await ctx.guild.channels.create({
        name: ctx.translate`👥・Total : ${members.size}`,
        type: 2,
        parent: category ? category.id : category,
        permissionOverwrites: [
          { id: ctx.guild.id, deny: ["Connect"], allow: ["ViewChannel"] },
        ],
        reason: `Statistiques`,
      });

      if (!base[0]) {
        await ctx.database.table("guild_statistics").insert({
          guild_id: ctx.guild.id,
          category_id: category ? category.id : null,
          channel1_id: channel1.id,
          channel2_id: channel2.id,
          channel3_id: channel3.id,
        });

        message
          .edit({
            content: ctx.translate`${ctx.emojiSuccess} Les salons vocaux de statistiques ont été créés !`,
          })
          .catch(() => null);
      } else {
        if (base[0].channel1_id)
          await ctx
            .getChannel(base[0].channel1_id)
            ?.delete()
            .catch(() => null);
        if (base[0].channel2_id)
          await ctx
            .getChannel(base[0].channel2_id)
            ?.delete()
            .catch(() => null);
        if (base[0].channel3_id)
          await ctx
            .getChannel(base[0].channel3_id)
            ?.delete()
            .catch(() => null);

        await ctx.database
          .table("guild_statistics")
          .update({
            category_id: category ? category.id : null,
            channel1_id: channel1.id,
            channel2_id: channel2.id,
            channel3_id: channel3.id,
          })
          .where("guild_id", ctx.guild.id);

        message
          .edit({
            content: ctx.translate`${ctx.emojiSuccess} Les salons vocaux de statistiques ont été mis à jour !`,
          })
          .catch(() => null);
      }
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Les salons vocaux de statistiques ne sont pas configurés !`
        );

      const message = await ctx.send({
        content: ctx.translate(
          ":clock10: Suppression des salons vocaux de statistiques..."
        ),
      });

      if (base[0].channel1_id)
        await ctx
          .getChannel(base[0].channel1_id)
          ?.delete()
          .catch(() => null);
      if (base[0].channel2_id)
        await ctx
          .getChannel(base[0].channel2_id)
          ?.delete()
          .catch(() => null);
      if (base[0].channel3_id)
        await ctx
          .getChannel(base[0].channel3_id)
          ?.delete()
          .catch(() => null);

      await ctx.database
        .table("guild_statistics")
        .delete()
        .where("guild_id", ctx.guild.id);

      message
        .edit({
          content: ctx.translate`${ctx.emojiSuccess} Les salons vocaux de statistiques ont été supprimés !`,
        })
        .catch(() => null);
    } else if (subCommand === "modifier") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Les salons vocaux de statistiques ne sont pas configurés !`
        );

      const channel = ctx.options.getChannel("salon");
      const name = ctx.options.getString("nom");

      const members = await ctx.guild.members.fetch();
      const bots = members.filter((member) => member.user.bot);
      const humans = members.filter((member) => !member.user.bot);

      if (channel.id === base[0].channel1_id) {
        await channel.setName(`${name} ${humans.size}`).catch(() => null);
        await ctx.database
          .table("guild_statistics")
          .update({ channel1_name: name })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le nom du salon vocal a été modifié ! En fonction de la limite de changement de nom faite par Discord, il se peut que le changement ne se fasse pas instantanément.`,
        });
      } else if (channel.id === base[0].channel2_id) {
        await channel.setName(`${name} ${bots.size}`).catch(() => null);
        await ctx.database
          .table("guild_statistics")
          .update({ channel2_name: name })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le nom du salon vocal a été modifié ! En fonction de la limite de changement de nom faite par Discord, il se peut que le changement ne se fasse pas instantanément.`,
        });
      } else if (channel.id === base[0].channel3_id) {
        await channel.setName(`${name} ${members.size}`).catch(() => null);
        await ctx.database
          .table("guild_statistics")
          .update({ channel3_name: name })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le nom du salon vocal a été modifié ! En fonction de la limite de changement de nom faite par Discord, il se peut que le changement ne se fasse pas instantanément.`,
        });
      } else {
        return ctx.error(
          ctx.translate`Ce salon vocal n'est pas configuré pour les statistiques !`
        );
      }
    }
  }
};
