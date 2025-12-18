const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class DailyConfig extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "daily-configurer",
      description: "Configurer les récompenses quotidiennes",
      options: [
        {
          name: "statut",
          description: "Activer ou désactiver les récompenses quotidiennes",
          type: 5,
          required: true,
        },
        {
          name: "type",
          description: "Le type de récompenses quotidiennes",
          type: 3,
          required: true,
          choices: [
            {
              name: "Aléatoire",
              value: "random",
            },
            {
              name: "Fixe",
              value: "fix",
            },
          ],
        },
        {
          name: "montant",
          description: "Le montant des récompenses quotidiennes",
          type: 4,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Economy,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const base = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);

    const status = ctx.options.getBoolean("statut");
    const type = ctx.options.getString("type");
    const amount = ctx.options.getInteger("montant") || 100;

    if (status) {
      if (!base[0]) {
        await ctx.database.table("guild_money").insert({
          guild_id: ctx.guild.id,
          daily: true,
          daily_fix: type === "fix",
          daily_amount: amount,
        });

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Les récompenses quotidiennes ont bien été activées avec un montant de **${amount}** !`,
        });
      } else {
        await ctx.database
          .table("guild_money")
          .update({
            daily: true,
            daily_fix: type === "fix",
            daily_amount: amount,
          })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Les récompenses quotidiennes ont été activées mises à jour avec un montant de **${amount}** !`,
        });
      }
    } else {
      if (!base[0] || base[0].daily === false)
        return ctx.error(
          ctx.translate`Les récompenses quotidiennes ne sont pas activées !`
        );

      await ctx.database
        .table("guild_money")
        .update({ daily: false })
        .where("guild_id", ctx.guild.id);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Les récompenses quotidiennes ont bien été désactivées !`,
      });
    }
  }
};
