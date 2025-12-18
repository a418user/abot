const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class Absence extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "absence",
      description: "Afficher le message d'absence",
      category: SlashCommand.Categories.Pub,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Gestion des absences`)
      .setDescription(
        ctx.translate`> En tant que staff, nous vous demandons de nous signaler une absence de longue durée afin que nous ne nous inquiétons pas de ne pas vous voir.\n\n> Cela permettra également aux membres d'avoir un message d'absence lorsqu'ils vous mentionnent. Vous pouvez changer ce paramètre avec le bouton **Mention**.`
      )
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({
        text: ctx.guild.name,
        iconURL: ctx.guild.iconURL() || ctx.client.user.displayAvatarURL(),
      });

    const button = new ButtonBuilder()
      .setStyle(1)
      .setLabel(ctx.translate`Se mettre en absence`)
      .setCustomId("absence_on")
      .setEmoji("📅");

    const button2 = new ButtonBuilder()
      .setStyle(4)
      .setLabel(ctx.translate`Ne plus être en absence`)
      .setCustomId("absence_off")
      .setEmoji("📅");

    const button3 = new ButtonBuilder()
      .setStyle(2)
      .setLabel(ctx.translate`Mention`)
      .setCustomId("absence_mention")
      .setEmoji("📌");

    const actionRow = new ActionRowBuilder()
      .addComponents(button)
      .addComponents(button2)
      .addComponents(button3);

    await ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} Le message d'absence a bien été envoyé !`,
      flags: 64,
    });

    ctx.channel.send({
      embeds: [embed],
      components: [actionRow],
    });
  }
};
