const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class XpReset extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-reset",
      description:
        "Réinitialiser l'xp de tous les membres du serveur ou d'un membre spécifique",
      options: [
        {
          type: 1,
          name: "membre",
          description: "Réinitialiser l'xp d'un membre spécifique",
          options: [
            {
              type: 6,
              name: "cible",
              description: "Le membre auquel l'xp doit être effacée",
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: "all",
          description: "Effacer de l'xp de tous les membres du serveur",
        },
      ],
      category: SlashCommand.Categories.Levels,
      user_permissions: ["Administrator"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "membre") {
      /* Get the member */
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(ctx.translate`Le membre n'est pas sur le serveur !`);

      /* Check that the member is not a bot */
      if (member.user.bot)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas supprimer l'xp d'un bot !`
        );

      /* Get the value of xp to add */
      const value = ctx.options.getInteger("xp");

      /* Get member's level */
      const level = await ctx.database
        .table("user_levels")
        .select()
        .where({ guildId: ctx.guild.id, userId: member.id });
      if (!level[0]) return ctx.error(ctx.translate`Le membre n'a pas d'xp !`);

      /* Clear the member's xp */
      await ctx.database
        .table("user_levels")
        .update({
          level: 0,
          xp: 0,
        })
        .where({ guildId: ctx.guild.id, userId: member.id });

      /* Send a success message */
      ctx.send({
        content: ctx.translate`L'xp de **${member.user.displayName}** a été réinitialisé !`,
      });
    } else if (subCommand === "tous") {
      /* Get all levels */
      const levels = await ctx.database
        .table("user_levels")
        .select()
        .where({ guildId: ctx.guild.id });

      /* Delete all levels */
      await ctx.database
        .table("user_levels")
        .delete()
        .where({ guildId: ctx.guild.id });

      /* Send a success message */
      const membersLabel =
        levels.length > 1 ? ctx.translate`membres` : ctx.translate`membre`;
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} L'xp de **${String(
          ctx.utils.numberWithSpaces(levels.length)
        )}** ${membersLabel} a été réinitialisé !`,
      });
    }
  }
};
