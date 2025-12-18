const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Unlock extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "unlock",
      description: "Débloquer un salon",
      options: [
        {
          name: "visible",
          description: "Rendre visible un salon",
          type: 5,
          required: true,
        },
        {
          name: "messages",
          description: "Débloquer l'envoi de messages",
          type: 5,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageChannels"],
      bot_permissions: ["ManageChannels"],
    });
  }

  async run(ctx) {
    const show = ctx.options.getBoolean("visible");
    const messages = ctx.options.getBoolean("messages");

    if (!show && !messages)
      return ctx.send({
        content: `${
          ctx.emojiError
        } ${ctx.translate`Vous devez choisir au moins une option !`}`,
        flags: 64,
      });

    const permissionsChannel = {};
    if (show) {
      permissionsChannel["ViewChannel"] = true;
    }
    if (messages) {
      permissionsChannel["SendMessages"] = true;
    }

    try {
      await ctx.channel.permissionOverwrites.edit(
        ctx.guild.id,
        permissionsChannel
      );
      ctx.channel.permissionOverwrites.delete(ctx.user.id);

      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Le salon a bien été débloqué !`}`,
      });
    } catch (e) {
      return ctx.send({
        content: `${ctx.emojiError} ${ctx.translate`Une erreur est survenue !`}
${e}`,
        flags: 64,
      });
    }
  }
};
