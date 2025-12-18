const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Lock extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "lock",
      description: "Bloquer un salon",
      options: [
        {
          name: "cacher",
          description: "Cacher un salon",
          type: 5,
          required: true,
        },
        {
          name: "messages",
          description: "Bloquer l'envoi de messages",
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
    const hide = ctx.options.getBoolean("cacher");
    const messages = ctx.options.getBoolean("messages");

    if (!hide && !messages)
      return ctx.send({
        content: `${
          ctx.emojiError
        } ${ctx.translate`Vous devez choisir au moins une option !`}`,
        flags: 64,
      });

    const permissionsChannel = {};
    const permissionsUser = {};
    if (hide) {
      permissionsChannel["ViewChannel"] = false;
      permissionsUser["ViewChannel"] = true;
    }
    if (messages) {
      permissionsChannel["SendMessages"] = false;
      permissionsUser["SendMessages"] = true;
    }

    try {
      await ctx.channel.permissionOverwrites.edit(
        ctx.guild.id,
        permissionsChannel
      );
      await ctx.channel.permissionOverwrites.edit(ctx.user.id, permissionsUser);

      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Le salon est bien bloqué !`}`,
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
