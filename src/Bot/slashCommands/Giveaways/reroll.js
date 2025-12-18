const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class GiveawaysReroll extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-reroll",
      description: "Relancer le gagnant d'un giveaway",
      options: [
        {
          name: "giveaway",
          description: "Le giveaway à relancer (ID du message ou récompense)",
          type: 3,
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
    if (!giveaway.ended)
      return ctx.error(
        ctx.translate`Le [giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) n'est pas fini !`
      );

    ctx.client.giveaways
      .reroll(giveaway.messageId, {
        messages: {
          congrat: ctx.translate`:tada: Nouveau(x) gagnants(s): {winners} ! Félicitations, vous avez gagné un **{this.prize}**!\n<{this.messageURL}>`,
          error: ctx.translate`Il n'y a pas assez de participation pour déterminer un nouveau gagnant !`,
          replyWhenNoWinner: true,
        },
      })
      .then(() => {
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le [giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) a bien été relancé !`,
        });
      })
      .catch((e) => {
        ctx.error(ctx.translate`Une erreur est survenue : ${e}`);
      });
  }
};
