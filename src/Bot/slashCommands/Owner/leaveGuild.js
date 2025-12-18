const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class LeaveGuild extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "leave-guild",
      description: "Make the bot leave a guild",
      description_localizations: {
        fr: "Faire quitter le bot d'un serveur",
      },
      options: [
        {
          name: "server",
          name_localizations: {
            fr: "serveur",
          },
          description: "The server to leave the bot",
          description_localizations: {
            fr: "Le serveur que le bot doit quitter",
          },
          type: 3,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Owner,
      ownerOnly: true,
      user_permissions: ["Administrator"],
    });
  }

  async run(ctx) {
    const guild = ctx.getGuild(ctx.options.getString("server"));
    if (!guild)
      return ctx.error(ctx.translate`Le serveur n'a pas été trouvé !`);

    await ctx.send({
      content: ctx.translate`**${ctx.client.user.displayName}** a été retiré du serveur **${guild.name}** par **${ctx.user.displayName}** !`,
    });

    const channel = ctx.client.channels.cache.get(
      ctx.config["system"]["logCmdOwner"]
    );
    if (channel)
      channel.send({
        content: ctx.translate`${ctx.emojiSuccess} **${ctx.client.user.displayName}** a été retiré du serveur **${guild.name}** par **${ctx.user.displayName}** \`(${ctx.user.id})\` !`,
      });

    await guild.leave();
  }
};
