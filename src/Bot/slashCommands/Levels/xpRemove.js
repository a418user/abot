const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class XpRemove extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-remove",
      description: "Supprimer de l'xp d'un membre",
      options: [
        {
          type: 6,
          name: "membre",
          description: "Le membre auquel l'xp doit être supprimée ou effacée",
          required: true,
        },
        {
          type: 4,
          name: "xp",
          description: "Le nombre d'xp que vous voulez supprimer du membre",
          min_value: 1,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Levels,
      user_permissions: ["Administrator"],
    });
  }

  async run(ctx) {
    /* Get the member */
    const member = ctx.options.getMember("membre");
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

    /* Clear, or remove the member's xp */
    if (level[0].xp <= value) {
      await ctx.database
        .table("user_levels")
        .update({
          level: 0,
          xp: 0,
        })
        .where({ guildId: ctx.guild.id, userId: member.id });
    } else {
      const xp = level[0].xp - value;

      await ctx.database
        .table("user_levels")
        .update({
          level: ctx.utils.getLevelWithXp(xp),
          xp,
        })
        .where({ guildId: ctx.guild.id, userId: member.id });
    }

    /* Send a success message */
    const xpRemoved = ctx.utils.numberWithSpaces(value);
    const memberName = member.user.displayName;
    const remainingXp = ctx.utils.numberWithSpaces(
      Math.max(level[0].xp - value, 0)
    );

    ctx.send({
      content:
        level[0].xp <= value
          ? ctx.translate`L'xp de **${memberName}** a été réinitialisé !`
          : ctx.translate`**${xpRemoved}** xp ont été retiré à **${memberName}** ! **${memberName}** a maintenant **${remainingXp}** xp !`,
    });
  }
};
