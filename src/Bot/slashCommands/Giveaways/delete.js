const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class GiveawaysDelete extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-delete",
      description: "Supprimer un giveaway en cours",
      options: [
        {
          name: "giveaway",
          type: 3,
          description: "Id du message ou récompense du giveaway à supprimer",
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

    ctx.client.giveaways
      .delete(giveaway.messageId)
      .then(() => {
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le giveaway a bien été supprimé !`,
        });
      })
      .catch((e) => {
        ctx.error(ctx.translate`Une erreur est survenue : ${e}`);
      });
  }
};
