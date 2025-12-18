const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class setBirthday extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "birthday-config",
      description: "Gérer le salon des anniversaires",
      options: [
        {
          name: "configurer",
          description: "Configurer les anniversaires",
          type: 1,
          options: [
            {
              name: "salon",
              description:
                "Salon où seront postées les messages d'anniversaire",
              type: 7,
              channel_types: [0],
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le salon des anniversaires",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_birthday")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const channel = ctx.options.getChannel("salon");

      if (!base[0]) {
        await ctx.database.table("guild_birthday").insert({
          guild_id: ctx.guild.id,
          channel_id: channel.id,
        });

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le salon des anniversaires a été configuré !`,
        });
      } else {
        await ctx.database
          .table("guild_birthday")
          .update({
            channel_id: channel.id,
          })
          .where("guild_id", ctx.guild.id);

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le salon des anniversaires a été mis à jour !`,
        });
      }
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Le salon des anniversaires n'est pas configuré !`
        );

      await ctx.database
        .table("guild_birthday")
        .delete()
        .where("guild_id", ctx.guild.id);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le salon des anniversaires a été supprimé !`,
      });
    }
  }
};
