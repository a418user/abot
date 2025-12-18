const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Daily extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "daily",
      description: "Récupérer sa récompense quotidienne",
      category: SlashCommand.Categories.Economy,
    });
  }

  async run(ctx) {
    const baseGuildMoney = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!baseGuildMoney[0] || baseGuildMoney[0].daily === false)
      return ctx.error(
        ctx.translate`Les récompenses quotidiennes ne sont pas activées !`
      );

    const name =
      baseGuildMoney[0] && baseGuildMoney[0].name
        ? baseGuildMoney[0].name
        : "coins";
    let amount = baseGuildMoney[0].daily_amount;
    const dailyFix = baseGuildMoney[0].daily_fix;
    if (!dailyFix)
      amount = ctx.utils.randomNumber(amount / 2, amount + amount / 2);

    const baseUserMoney = await ctx.database
      .table("user_money")
      .select()
      .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });

    if (!baseUserMoney[0]) {
      await ctx.database.table("user_money").insert({
        guild_id: ctx.guild.id,
        user_id: ctx.user.id,
        money: amount,
        last_daily: Date.now(),
      });
    } else {
      const currentDate = Date.now();
      const lastDate = baseUserMoney[0].last_daily;

      if (currentDate - lastDate < 86400000)
        return ctx.error(
          ctx.translate`Vous avez déjà récupéré votre récompense quotidienne !`
        );

      await ctx.database
        .table("user_money")
        .update({
          money: baseUserMoney[0].money + amount,
          last_daily: currentDate,
        })
        .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });
    }

    ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} Vous avez récupéré votre récompense quotidienne de **${amount} ${name}** !`,
    });
  }
};
