const SlashCommand = require("../../managers/structures/SlashCommands.js");
const Games = require("discord-gamecord");

module.exports = class TicTacToe extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "morpion",
      description: "Jouer au morpion",
      options: [
        {
          name: "utilisateur",
          description: "L'utilisateur que vous souhaitez affronter",
          type: 6,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Fun,
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    const opponent = ctx.options.getUser("utilisateur");

    if (opponent.bot)
      return ctx.error(ctx.translate`Vous ne pouvez pas jouer contre un bot !`);
    if (opponent.id === ctx.user.id)
      return ctx.error(
        ctx.translate`Vous ne pouvez pas vous affronter vous-même !`
      );

    const game = new Games.TicTacToe({
      message: ctx.inter,
      isSlashGame: true,
      opponent,
      embed: {
        title: ctx.translate`Morpion`,
        statusTitle: ctx.translate`Statut de la partie`,
        color: ctx.colors.blue,
      },
      emojis: {
        xButton: "❌",
        oButton: "⭕",
        blankButton: "➖",
      },
      mentionUser: true,
      timeoutTime: 60000,
      xButtonStyle: "DANGER",
      oButtonStyle: "PRIMARY",
      turnMessage: ctx.translate`{emoji} | Au tour de **{player}** !`,
      winMessage: ctx.translate`{emoji} | **{player}** remporte la partie !`,
      tieMessage: ctx.translate`La partie est nulle, aucun gagnant.`,
      timeoutMessage: ctx.translate`Partie terminée faute de réponse, aucun gagnant.`,
      playerOnlyMessage: ctx.translate`Seuls {player} et {opponent} peuvent interagir avec ces boutons.`,
    });

    await game.startGame();
  }
};
