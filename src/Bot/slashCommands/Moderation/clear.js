const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Clear extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "clear",
      description: "Supprimer un nombre de messages",
      options: [
        {
          name: "nombre",
          description: "Le nombre de messages que vous voulez supprimer",
          type: 4,
          required: true,
        },
        {
          name: "membre",
          description: `Supprimer les messages d'un membre spécifique`,
          type: 6,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["ManageMessages"],
    });
  }

  async run(ctx) {
    const deleteAmount = ctx.options.getInteger("nombre");
    const target = ctx.options.getUser("membre");

    if (deleteAmount === 0 || deleteAmount > 100)
      return ctx.error(
        ctx.translate`Le nombre de messages à supprimer doit être compris entre 1 et 100 !`
      );

    if (target) {
      const Messages = await ctx.channel.messages.fetch();

      let i = 0;
      const filtered = [];

      (await Messages).filter((m) => {
        if (m.author.id === target.id && deleteAmount > i) {
          filtered.push(m);
          i++;
        }
      });
      try {
        await ctx.channel.bulkDelete(filtered, true).then(async (messages) => {
          const label =
            messages.size > 1
              ? ctx.translate`messages`
              : ctx.translate`message`;
          const msg = await ctx.send({
            content: ctx.translate`️🗑️ Suppression de ${messages.size} ${label} !`,
          });

          setTimeout(() => {
            msg.delete().catch(() => null);
          }, 3000);
        });
      } catch {
        ctx.error(
          ctx.translate`Une erreur s'est produite lors de la suppression des messages !`
        );
      }
    }

    try {
      await ctx.channel
        .bulkDelete(deleteAmount, true)
        .then(async (messages) => {
          const label =
            messages.size > 1
              ? ctx.translate`messages`
              : ctx.translate`message`;
          const msg = await ctx.send({
            content: ctx.translate`️🗑️ Suppression de ${messages.size} ${label} !`,
          });

          setTimeout(() => {
            msg.delete().catch(() => null);
          }, 3000);
        });
    } catch {
      ctx.error(
        ctx.translate`Une erreur s'est produite lors de la suppression des messages !`
      );
    }
  }
};
