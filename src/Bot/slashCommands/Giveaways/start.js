const SlashCommand = require("../../managers/structures/SlashCommands.js");
const ms = require("ms");

module.exports = class GiveawaysStart extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "giveaway-start",
      description: "Lancer un nouveau giveaway",
      options: [
        {
          name: "salon",
          type: 7,
          channel_types: [0, 5],
          description: "Salon du giveaway",
          required: true,
        },
        {
          name: "durée",
          type: 3,
          description: "Durée du giveaway (1s/m/h/d)",
          required: true,
        },
        {
          name: "gagnants",
          type: 4,
          description: "Nombre de gagnants",
          required: true,
        },
        {
          name: "récompense",
          type: 3,
          description: "Nom de la récompense",
          required: true,
        },
        {
          name: "image",
          type: 11,
          description: "Image dans l'embed",
          required: false,
        },
        {
          name: "thumbnail",
          type: 11,
          description: "Thumbnail dans l'embed",
          required: false,
        },
      ],
      category: SlashCommand.Categories.Giveaways,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const giveawayChannel = ctx.options.getChannel("salon");
    const giveawayDuration = ctx.options.getString("durée");
    const giveawayWinnerCount = ctx.options.getInteger("gagnants");
    const giveawayPrize = ctx.options.getString("récompense");
    const giveawayImage = ctx.options.getAttachment("image");
    const giveawayThumbnail = ctx.options.getAttachment("thumbnail");

    if (!giveawayChannel.isTextBased())
      return ctx.error(
        ctx.translate`Il n'est pas possible de créer un giveaway dans ce salon !`
      );
    if (isNaN(ms(giveawayDuration)))
      return ctx.error(
        ctx.translate`Veuillez entrer une durée valide sous la forme 1s/1m/1h/1d !`
      );
    if (giveawayWinnerCount < 1)
      return ctx.error(
        ctx.translate`Veuillez indiquer un nombre de vainqueurs supérieur à 0 !`
      );

    await ctx.send({
      content: ctx.translate`${
        ctx.emojiSuccess
      } \uD83C\uDF81 Le giveaway pour le \`${giveawayPrize}\` a bien commencé dans le salon : ${giveawayChannel} pour une durée de \`${giveawayDuration}\` avec ${giveawayWinnerCount} ${
        giveawayWinnerCount > 1 ? "gagnants" : "gagnant"
      } !`,
    });

    await ctx.client.giveaways.start(giveawayChannel, {
      duration: ms(giveawayDuration),
      prize: giveawayPrize,
      winnerCount: giveawayWinnerCount,
      image: giveawayImage
        ? giveawayImage.contentType.includes("image")
          ? giveawayImage.url
          : null
        : null,
      thumbnail: giveawayThumbnail
        ? giveawayThumbnail.contentType.includes("image")
          ? giveawayThumbnail.url
          : null
        : null,
      messages: {
        giveaway: ctx.translate`\uD83C\uDF81 **GIVEAWAY** \uD83C\uDF81`,
        giveawayEnded: ctx.translate`\uD83C\uDF81 **GIVEAWAY FINI** \uD83C\uDF81`,
        inviteToParticipate: ctx.translate`Réagit avec l'emote 🎉 pour participer !`,
        winMessage: ctx.translate`Félicitations, {winners} ! Vous avez gagné un **{this.prize}** !\n<{this.messageURL}>`,
        drawing: ctx.translate`\n**Le giveaway se termine {timestamp}** !\n${
          giveawayWinnerCount > 1
            ? `Gagnants : **${giveawayWinnerCount}**`
            : `Gagnant : **${giveawayWinnerCount}**`
        }`,
        embedFooter: ctx.translate`Créé par : ${ctx.user.displayName}`,
        noWinner: ctx.translate`${ctx.emojiError} Il n'y a pas eu assez de membre pour déterminer un gagnant !`,
        winners:
          giveawayWinnerCount > 1
            ? ctx.translate`Gagnants :`
            : ctx.translate`Gagnant :`,
        endedAt: ctx.translate`Fini le`,
      },
    });
  }
};
