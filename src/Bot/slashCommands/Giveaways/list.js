const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class GiveawaysList extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-list",
      description: "Afficher la liste de tous les giveaways",
      category: SlashCommand.Categories.Giveaways,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const giveaways = ctx.client.giveaways.giveaways.filter(
      (g) => g.guildId === ctx.guild.id
    );
    if (!giveaways.length)
      return ctx.error(ctx.translate`Aucun giveaway n'a été trouvé !`);

    const data = giveaways
      .map(
        (x) =>
          ctx.translate`**Récompense :** **[${
            x.prize
          }](https://discord.com/channels/${x.guildId}/${x.channelId}/${
            x.messageId
          })**\nCommencé : <t:${(x.startAt / 1000).toFixed(0)}:R> (<t:${(
            x.startAt / 1000
          ).toFixed(0)}:f>)\nFini : <t:${(x.endAt / 1000).toFixed(0)}:R> (<t:${(
            x.endAt / 1000
          ).toFixed(0)}:f>)`
      )
      .join("\n");

    const embedTitle = ctx.translate`Liste des Giveaways du serveur`;

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(embedTitle)
      .setDescription(data);

    if (embed.data.description.length > 4096) {
      // Loop for each 4096 characters
      const embeds = [];

      for (let i = 0; i < embed.data.description.length; i += 4096) {
        const embed = new EmbedBuilder()
          .setColor(ctx.colors.blue)
          .setTitle(embedTitle)
          .setDescription(data.slice(i, i + 4096));

        embeds.push(embed);
      }

      return ctx.send({ embeds: embeds });
    }

    ctx.send({ embeds: [embed] });
  }
};
