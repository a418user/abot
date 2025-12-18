const SlashCommand = require("../../managers/structures/SlashCommands.js");
const ms = require("ms");

module.exports = class GiveawaysEdit extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-edit",
      description: "Éditer un giveaway",
      options: [
        {
          name: "giveaway",
          type: 3,
          description: "Id du message ou récompense du giveaway à éditer",
          required: true,
        },
        {
          name: "gagnants",
          type: 4,
          description: "Nombre de gagnants (sera édité mais pas dans l'embed)",
          required: true,
        },
        {
          name: "récompense",
          type: 3,
          description: "Nom de la récompense",
          required: true,
        },
        {
          name: "durée",
          type: 3,
          description: "Durée du giveaway (1s/m/h/d)",
          required: true,
        },
      ],
      category: SlashCommand.Categories.Giveaways,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const query = ctx.options.getString("giveaway");
    const time = ctx.options.getString("durée");
    const winnersCount = ctx.options.getInteger("gagnants");
    const prize = ctx.options.getString("récompense");

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
    if (isNaN(ms(time)))
      return ctx.error(
        ctx.translate`Veuillez entrer une durée valide sous la forme 1s/1m/1h/1d !`
      );

    ctx.client.giveaways
      .edit(giveaway.messageId, {
        addTime: ms(time),
        newWinnerCount: winnersCount,
        newPrize: prize,
      })
      .then(() => {
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le [giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) a bien été édité !`,
        });
      })
      .catch((e) => {
        ctx.error(ctx.translate`Une erreur est survenue : ${e}`);
      });
  }
};
