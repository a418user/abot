const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Report extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "reports",
      description: "Gérer le système de reports",
      options: [
        {
          name: "configurer",
          description: "Configurer le système de reports",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Salon où seront postées les reports",
              type: 7,
              channel_types: [0, 5],
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le système de reports",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_report")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const channel = ctx.options.getChannel("salon");

      if (!base[0]) {
        await ctx.database.table("guild_report").insert({
          guild_id: ctx.guild.id,
          channel_id: channel.id,
        });

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système de **reports** a bien été créé !`,
        });
      } else {
        await ctx.database
          .table("guild_report")
          .update({ channel_id: channel.id })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le système de **reports** a bien été mise à jour !`,
        });
      }
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de **reports** n'est pas initialisé sur le serveur !`
        );

      await ctx.database
        .table("guild_report")
        .delete()
        .where("guild_id", ctx.guild.id);
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le système de **reports** a bien été supprimé !`,
      });
    }
  }
};
