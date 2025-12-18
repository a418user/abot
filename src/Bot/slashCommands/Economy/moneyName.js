const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class MoneyName extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "money-name",
      description: "Changer le nom de la monnaie",
      options: [
        {
          name: "configurer",
          description: "Configurer un nom de monnaie",
          type: 1,
          options: [
            {
              name: "nom",
              description: "Le nom de la monnaie",
              type: 3,
              required: true,
              min_length: 1,
              max_length: 20,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le nom de la monnaie",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Economy,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const name = ctx.options.getString("nom");

      if (!base[0]) {
        await ctx.database.table("guild_money").insert({
          guild_id: ctx.guild.id,
          name,
        });

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le nom de la monnaie a bien été configuré sur **${name}** !`,
        });
      } else {
        await ctx.database
          .table("guild_money")
          .update({ name })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le nom de la monnaie a bien été mis à jour sur **${name}** !`,
        });
      }
    } else if (subCommand === "supprimer") {
      if (!base[0] || !base[0].name)
        return ctx.error(
          ctx.translate`Aucun nom personnalisé de monnaie n'est configuré !`
        );

      await ctx.database
        .table("guild_money")
        .update({
          name: null,
        })
        .where("guild_id", ctx.guild.id);
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le nom de la monnaie a bien été supprimé !`,
      });
    }
  }
};
