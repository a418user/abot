const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class Suggest extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "suggestions",
      description: "Gérer les suggestions",
      options: [
        {
          name: "accept",
          description: "Accepter une suggestion",
          type: 1,
          options: [
            {
              name: "id",
              description: "Identifiant du message de la suggestion",
              type: 3,
              required: true,
            },
            {
              name: "reason",
              description:
                "Indiquer la raison de l'acceptation de la suggestion",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "refused",
          description: "Refuser une suggestion",
          type: 1,
          options: [
            {
              name: "id",
              description: "Identifiant du message de la suggestion",
              type: 3,
              required: true,
            },
            {
              name: "reason",
              description: "Indiquer la raison du refus de la suggestion",
              type: 3,
              required: false,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const messageId = ctx.options.getString("id");
    const reason = ctx.options.getString("reason") || null;

    const userSuggestion = await ctx.database
      .table("user_suggest")
      .where("messageId", messageId)
      .first();
    if (!userSuggestion)
      return ctx.error(ctx.translate`Cette suggestion n'existe pas !`);

    const subCommand = ctx.options.getSubcommand();

    const embed = new EmbedBuilder().setColor(ctx.colors.blue);

    const isAccepted = subCommand === "accept";
    const statusWord = isAccepted
      ? ctx.translate`acceptée`
      : ctx.translate`refusée`;
    const coloredEmoji = isAccepted ? ctx.emojiSuccess : ctx.emojiError;
    const reasonText = reason
      ? ctx.translate` pour la raison \`${reason}\``
      : "";

    if (isAccepted) {
      embed.setDescription(
        ctx.translate`${coloredEmoji} La suggestion \`${messageId}\` a été **${statusWord}**${reasonText}.`
      );
    } else {
      embed.setDescription(
        ctx.translate`${coloredEmoji} La suggestion \`${messageId}\` a été **${statusWord}**${reasonText}.`
      );
    }

    await ctx.send({ embeds: [embed] });

    // Get the channel
    const channel = ctx.getChannel(userSuggestion.channelId);
    if (!channel)
      return ctx.error(
        ctx.translate`Le salon de la suggestion est introuvable !`
      );

    // Get the message
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message || message.size > 1)
      return ctx.error(
        ctx.translate`Le message de la suggestion est introuvable !`
      );

    // Get the suggestion embed
    const baseDescription = message.embeds[0]?.description || "";
    const decisionLabel = isAccepted
      ? ctx.translate`Acceptée`
      : ctx.translate`Refusée`;
    let decisionDetails = ctx.translate`» ${decisionLabel} par ${ctx.user.username}`;
    if (reason) {
      decisionDetails += `\n${ctx.translate`Raison : ${reason}`}`;
    }

    const suggestionEmbed = EmbedBuilder.from(message.embeds[0])
      .setColor(isAccepted ? "Green" : "Red")
      .setDescription(`${baseDescription}\n\n${decisionDetails}`);

    // Count the votes
    const allVotes = JSON.parse(userSuggestion.votes);

    const buttonAccept = new ButtonBuilder()
      .setCustomId(`accept`)
      .setStyle(2)
      .setLabel(`${allVotes.accepted.length}`)
      .setEmoji(`${ctx.emojiSuccess}`)
      .setDisabled(true);

    const buttonNeutral = new ButtonBuilder()
      .setCustomId(`neutral`)
      .setStyle(2)
      .setLabel(`${allVotes.neutral.length}`)
      .setEmoji(`➖`)
      .setDisabled(true);

    const buttonRefused = new ButtonBuilder()
      .setCustomId(`refused`)
      .setStyle(2)
      .setLabel(`${allVotes.refused.length}`)
      .setEmoji(`${ctx.emojiError}`)
      .setDisabled(true);

    const actionRow = new ActionRowBuilder()
      .addComponents(buttonAccept)
      .addComponents(buttonNeutral)
      .addComponents(buttonRefused);

    await message.edit({ embeds: [suggestionEmbed], components: [actionRow] });

    // Archive the thread
    if (userSuggestion.threadId) {
      const thread = await channel.threads
        .fetch(userSuggestion.threadId)
        .catch(() => null);
      if (thread) {
        await thread.setArchived(true);
      }
    }

    // Delete the suggestion from the database
    await ctx.database
      .table("user_suggest")
      .delete()
      .where("messageId", messageId);
  }
};
