const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Nuke extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "nuke",
      description: "Recréer un salon",
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageChannels"],
      bot_permissions: ["ManageChannels"],
    });
  }

  async run(ctx) {
    ctx.channel
      .clone({ position: ctx.channel.rawPosition })
      .then(async (ch) => {
        ch.send({ content: ctx.translate`Le salon a bien été recrée.` });
      });

    await ctx.channel.delete().catch(() => null);
  }
};
