const SlashCommand = require("../../managers/structures/SlashCommands.js");
const Games = require("discord-gamecord");

module.exports = class Power4 extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "puissance4",
      description: "Jouer au puissance 4",
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
    const user = ctx.options.getUser("utilisateur");

    if (user.bot)
      return ctx.error(ctx.translate`Vous ne pouvez pas jouer contre un bot !`);
    if (user.id === ctx.user.id)
      return ctx.error(
        ctx.translate`Vous ne pouvez pas vous affronter vous-même !`
      );

    const game = new Games.Connect4({
      message: ctx.inter,
      isSlashGame: true,
      opponent: user,
      embed: {
        title: ctx.translate`Puissance 4`,
        statusTitle: ctx.translate`Statut de la partie`,
        color: ctx.colors.blue,
      },
      emojis: {
        board: "⚪",
        player1: "🔴",
        player2: "🟡",
      },
      mentionUser: true,
      timeoutTime: 60000,
      turnMessage: ctx.translate`{emoji} | Au tour de **{player}** !`,
      winMessage: ctx.translate`{emoji} | **{winner}** remporte la partie !`,
      tieMessage: ctx.translate`La partie est nulle, aucun gagnant.`,
      timeoutMessage: ctx.translate`Partie terminée faute de réponse, aucun gagnant.`,
      playerOnlyMessage: ctx.translate`Seuls {player} et {opponent} peuvent interagir avec ces boutons.`,
    });

    await game.startGame();
  }
};
