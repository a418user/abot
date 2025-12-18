const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class GiveawaysEnd extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-end",
      description: "Arrêter un giveaway",
      options: [
        {
          name: "giveaway",
          type: 3,
          description: "Id du message ou récompense du giveaway à arrêter",
          required: true,
        },
      ],
      category: SlashCommand.Categories.Giveaways,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const query = ctx.options.getString("giveaway");

    const giveaway =
      ctx.client.giveaways.giveaways.find(
        (g) => g.prize === query && g.guildId === ctx.guild.id
      ) ||
      ctx.client.giveaways.giveaways.find(
        (g) => g.messageId === query && g.guildId === ctx.guild.id
      );

    if (!giveaway)
      return ctx.error(
        ctx.translate`Le giveaway avec comme recherche \`${query}\` n'a pas été trouvé !`
      );
    if (giveaway.ended)
      return ctx.error(
        ctx.translate`Le [giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) est déjà fini !`
      );

    ctx.client.giveaways
      .end(giveaway.messageId)
      .then(() => {
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le [giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) a bien été terminé !`,
        });
      })
      .catch((e) => {
        ctx.error(ctx.translate`Une erreur est survenue : ${e}`);
      });
  }
};
