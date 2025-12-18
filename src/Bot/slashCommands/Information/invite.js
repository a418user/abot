const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class Invite extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite",
      description: "Afficher les liens du bot",
      category: SlashCommand.Categories.Information,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const invite = new ButtonBuilder()
      .setStyle(5)
      .setURL(ctx.config["system"]["linkInviteBot"])
      .setLabel(ctx.translate`Inviter le bot`);

    const server = new ButtonBuilder()
      .setStyle(5)
      .setURL(ctx.config["system"]["serverSupport"])
      .setLabel(ctx.translate`Support`);

    const dashboard = new ButtonBuilder()
      .setStyle(5)
      .setURL(ctx.config["dashboard"]["link"])
      .setLabel(ctx.translate`Dashboard`);

    const actionRow = new ActionRowBuilder()
      .addComponents(invite)
      .addComponents(server)
      .addComponents(dashboard);

    ctx.send({ components: [actionRow] });
  }
};
