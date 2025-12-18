const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class Suggest extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "suggestion",
      description: "Envoyer une suggestion",
      options: [
        {
          name: "reason",
          description: "Indiquer votre suggestion",
          type: 3,
          required: true,
        },
        {
          name: "attachment",
          description: "Ajouter une pièce jointe",
          type: 11,
          required: false,
        },
      ],
      category: SlashCommand.Categories.General,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const guildSuggestion = await ctx.database
      .table("guild_suggest")
      .select()
      .where({ guildId: ctx.guild.id })
      .first();
    if (!guildSuggestion)
      return ctx.error(
        ctx.translate`Aucun système de suggestions n'a été configuré sur ce serveur !`
      );

    const channel = ctx.getChannel(guildSuggestion.channelId);
    if (!channel)
      return ctx.error(
        ctx.translate`Le salon de suggestions n'a pas été trouvé !`
      );
    const rolesBlacklist = JSON.parse(guildSuggestion.rolesBlacklist);

    if (
      rolesBlacklist.length > 0 &&
      ctx.member.roles.cache.some((role) => rolesBlacklist.includes(role.id))
    )
      return ctx.error(
        ctx.translate`Vous n'avez pas la permission d'envoyer une suggestion !`
      );

    const reason = ctx.options.getString("reason");
    const attachment = ctx.options.getAttachment("attachment")
      ? ctx.options.getAttachment("attachment").contentType.includes("image")
        ? ctx.options.getAttachment("attachment").url
        : null
      : null;

    await ctx.success(ctx.translate`Votre suggestion a bien été envoyée !`);

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setDescription(reason)
      .setAuthor({
        name: ctx.user.username,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setImage(attachment);

    const buttonAccept = new ButtonBuilder()
      .setCustomId(`suggest_accepted`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`${ctx.emojiSuccess}`);

    const buttonNeutral = new ButtonBuilder()
      .setCustomId(`suggest_neutral`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`➖`);

    const buttonRefused = new ButtonBuilder()
      .setCustomId(`suggest_refused`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`${ctx.emojiError}`);

    const actionRow = new ActionRowBuilder()
      .addComponents(buttonAccept)
      .addComponents(buttonNeutral)
      .addComponents(buttonRefused);

    const msg = await channel.send({
      embeds: [embed],
      components: [actionRow],
    });

    let thread = null;
    if (guildSuggestion.isThread) {
      thread = await channel.threads.create({
        name: ctx.translate`Suggestion de ${ctx.user.username}`,
        startMessage: `${msg.id}`,
        autoArchiveDuration: 4320,
        reason: ctx.translate`Suggestion de ${ctx.user.username}`,
      });

      await thread.members.add(ctx.user.id);
    }

    await ctx.database.table("user_suggest").insert({
      guildId: ctx.guild.id,
      channelId: channel.id,
      threadId: thread ? thread.id : null,
      messageId: msg.id,
      userId: ctx.user.id,
    });
  }
};
