const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class ManagePubChannels extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "pub-salons",
      description: "Gérer les salons du système de publicités",
      options: [
        {
          name: "ajouter",
          description: "Ajouter un salons au système de publicités",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Salon à ajouter",
              type: 7,
              channel_types: [0],
              required: true,
            },
          ],
        },
        {
          name: "retirer",
          description: "Retirer un salon du système de publicités",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Salon à retirer",
              type: 7,
              channel_types: [0],
              required: true,
            },
          ],
        },
        {
          name: "liste",
          description: "Afficher la liste des salons du système de publicités",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Pub,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "ajouter") {
      const channel = ctx.options.getChannel("salon");

      const base = await ctx.database
        .table("guild_pub_channel")
        .where({ guild_id: ctx.guild.id });
      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de publicités n'a pas été initialisé !`
        );

      const channels = JSON.parse(base[0].channels);

      if (channels.includes(channel.id))
        return ctx.error(
          ctx.translate`Le salon est déjà présent dans le système de publicités !`
        );

      channels.push(channel.id);

      await ctx.database
        .table("guild_pub_channel")
        .update({
          channels: JSON.stringify(channels),
        })
        .where({ guild_id: ctx.guild.id });

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le salon a bien été ajouté au système de publicités !`,
      });
    } else if (subCommand === "retirer") {
      const channel = ctx.options.getChannel("salon");

      const base = await ctx.database
        .table("guild_pub_channel")
        .where({ guild_id: ctx.guild.id });
      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de publicités n'a pas été initialisé !`
        );

      let channels = JSON.parse(base[0].channels);

      if (!channels.includes(channel.id))
        return ctx.error(
          ctx.translate`Le salon n'est pas présent dans le système de publicités !`
        );

      channels = channels.filter((c) => c !== channel.id);

      await ctx.database
        .table("guild_pub_channel")
        .update({
          channels: JSON.stringify(channels),
        })
        .where({ guild_id: ctx.guild.id });

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le salon a bien été retiré du système de publicités !`,
      });
    } else if (subCommand === "liste") {
      const base = await ctx.database
        .table("guild_pub_channel")
        .where({ guild_id: ctx.guild.id });
      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de publicités n'a pas été initialisé !`
        );

      const channels = JSON.parse(base[0].channels);

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des salons du système de publicités`)
        .setDescription(
          channels
            .map((c) => {
              return `- <#${c}>`;
            })
            .join("\n")
        )
        .setColor(ctx.colors.blue);

      ctx.send({ embeds: [embed] });
    }
  }
};
