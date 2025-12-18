const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class SuggestionMessage {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.translate = event.translate.bind(event);
  }

  async handle(message) {
    if (!message.guild || message.author.bot) return;

    const guildSuggestion = await this.database
      .table("guild_suggest")
      .select()
      .where({ guildId: message.guild.id, channelId: message.channel.id })
      .first();
    if (!guildSuggestion || !guildSuggestion.isMessage) return;

    const rolesBypass = JSON.parse(guildSuggestion.rolesBypass);
    const rolesBlacklist = JSON.parse(guildSuggestion.rolesBlacklist);

    if (
      rolesBypass.length > 0 &&
      message.member.roles.cache.some((role) => rolesBypass.includes(role.id))
    )
      return;

    if (
      rolesBlacklist.length > 0 &&
      message.member.roles.cache.some((role) =>
        rolesBlacklist.includes(role.id)
      )
    )
      return message.delete().catch(() => null);

    let content = message.content || this.translate`Aucune description`;
    if (content.length > 4096) content = content.slice(0, 4093) + "...";

    await message.delete().catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(content)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });

    const buttonAccept = new ButtonBuilder()
      .setCustomId(`suggest_accepted`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`${this.client.emojiSuccess}`);

    const buttonNeutral = new ButtonBuilder()
      .setCustomId(`suggest_neutral`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`➖`);

    const buttonRefused = new ButtonBuilder()
      .setCustomId(`suggest_refused`)
      .setStyle(2)
      .setLabel(`0`)
      .setEmoji(`${this.client.emojiError}`);

    const actionRow = new ActionRowBuilder()
      .addComponents(buttonAccept)
      .addComponents(buttonNeutral)
      .addComponents(buttonRefused);

    const msg = await message.channel.send({
      embeds: [embed],
      components: [actionRow],
    });

    let thread = null;
    if (guildSuggestion.isThread) {
      const threadName = this
        .translate`Suggestion de ${message.author.username}`;
      thread = await message.channel.threads.create({
        name: threadName,
        startMessage: `${msg.id}`,
        autoArchiveDuration: 4320,
        reason: threadName,
      });

      await thread.members.add(message.author.id);
    }

    await this.database.table("user_suggest").insert({
      guildId: message.guild.id,
      channelId: message.channel.id,
      threadId: thread ? thread.id : null,
      messageId: msg.id,
      userId: message.author.id,
    });
  }
};
