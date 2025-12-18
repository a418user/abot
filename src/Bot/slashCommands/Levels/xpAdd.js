const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class XpAdd extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-add",
      description: "Ajouter de l'xp à un membre",
      options: [
        {
          type: 6,
          name: "membre",
          description: "Le membre auquel vous souhaitez ajouter de l'xp",
          required: true,
        },
        {
          type: 4,
          name: "xp",
          description: "Le nombre d'xp à ajouter",
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
        ctx.translate`Vous ne pouvez pas ajouter d'xp à un bot !`
      );

    /* Get the value of xp to add */
    const value = ctx.options.getInteger("xp");

    /* Get member's level */
    const level = await ctx.database
      .table("user_levels")
      .select()
      .where({ guildId: ctx.guild.id, userId: member.id });

    if (!level[0]) {
      await ctx.database.table("user_levels").insert({
        guildId: ctx.guild.id,
        userId: member.id,
        level: ctx.utils.getLevelWithXp(value),
        xp: value,
      });
    } else {
      await ctx.database
        .table("user_levels")
        .update({
          level: ctx.utils.getLevelWithXp(level[0].xp + value),
          xp: level[0].xp + value,
        })
        .where({ guildId: ctx.guild.id, userId: member.id });
    }

    /* Send a success message */
    const xpAdded = ctx.utils.numberWithSpaces(value);
    const memberName = member.user.displayName;
    const totalXp = ctx.utils.numberWithSpaces(
      level[0] ? level[0].xp + value : value
    );

    ctx.send({
      content: ctx.translate`**${xpAdded}** xp ont été ajoutés à **${memberName}** ! **${memberName}** possède maintenant **${totalXp}** xp !`,
    });
  }
};
