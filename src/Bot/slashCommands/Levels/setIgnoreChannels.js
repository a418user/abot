const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class setIgnoreChannels extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-ignore-channels",
      description: "Configurer les salons à ignorer pour le gain d'XP",
      options: [
        {
          type: 1,
          name: "add",
          description: "Ajouter un salon à ignorer",
          options: [
            {
              type: 7,
              name: "channel",
              description: "Le salon à ignorer",
              required: true,
              channel_types: [0, 2],
            },
          ],
        },
        {
          type: 1,
          name: "remove",
          description: "Retirer un salon à ignorer",
          options: [
            {
              type: 7,
              name: "channel",
              description: "Le salon à retirer",
              required: true,
              channel_types: [0, 2],
            },
          ],
        },
        {
          type: 1,
          name: "list",
          description: "Voir les salons ignorés",
        },
      ],
      category: SlashCommand.Categories.Levels,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const settings = await ctx.database
      .table("guild_levels")
      .select()
      .where("guildId", ctx.guild.id);
    const levelingSettings = settings[0]
      ? JSON.parse(settings[0].leveling)
      : {};

    if (subCommand === "list") {
      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Les salons ignorés pour le gain d'XP`)
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setDescription(
          levelingSettings.ignoreChannels &&
            levelingSettings.ignoreChannels.length > 0
            ? levelingSettings.ignoreChannels
                .map((channelId) => `- <#${channelId}>`)
                .join("\n")
            : ctx.translate`Aucun salon n'est ignoré pour le gain d'XP !`
        );

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "add") {
      const channel = ctx.options.getChannel("channel");

      const ignoreChannels = levelingSettings.ignoreChannels || [];

      /* Check if the channel is already ignored for XP gain */
      if (ignoreChannels.includes(channel.id))
        return ctx.error(
          ctx.translate`Ce salon est déjà ignoré pour le gain d'XP !`
        );

      /* Add the channel to the list of channels to ignore */
      ignoreChannels.push(channel.id);

      /* Update the leveling settings */
      levelingSettings.ignoreChannels = ignoreChannels;

      /* Update the database */
      if (settings[0]) {
        await ctx.database
          .table("guild_levels")
          .update({
            leveling: JSON.stringify(levelingSettings),
          })
          .where("guildId", ctx.guild.id);
      } else {
        await ctx.database.table("guild_levels").insert({
          guildId: ctx.guild.id,
          leveling: JSON.stringify(levelingSettings),
        });
      }

      /* Send the message */
      await ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le salon ${channel} a été ajouté à la liste des salons ignorés pour le gain d'XP !`,
      });
    } else if (subCommand === "remove") {
      const channel = ctx.options.getChannel("channel");

      if (!settings[0])
        return ctx.error(
          ctx.translate`Il n'y a aucun salon ignoré pour le gain d'XP !`
        );

      /* If there is no data return */
      if (
        !levelingSettings.ignoreChannels ||
        levelingSettings.ignoreChannels.length < 1
      )
        return ctx.error(
          ctx.translate`Il n'y a aucun salon ignoré pour le gain d'XP !`
        );

      /* Check if the channel is already ignored for XP gain */
      if (!levelingSettings.ignoreChannels.includes(channel.id))
        return ctx.error(
          ctx.translate`Ce salon n'est pas ignoré pour le gain d'XP !`
        );

      /* Remove the channel from the list of channels to ignore */
      levelingSettings.ignoreChannels = levelingSettings.ignoreChannels.filter(
        (ch) => ch !== channel.id
      );

      /* It's updating the settings in the database. */
      await ctx.database
        .table("guild_levels")
        .update({
          leveling: JSON.stringify(levelingSettings),
        })
        .where("guildId", ctx.guild.id);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le salon ${channel} a été retiré de la liste des salons ignorés pour le gain d'XP !`,
      });
    }
  }
};
