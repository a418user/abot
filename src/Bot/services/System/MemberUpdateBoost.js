const { EmbedBuilder } = require("discord.js");

module.exports = class MemberUpdateBoost {
  constructor(client) {
    this.client = client;
    this.database = client.database;
    this.colors = client.colors;
    this.translate = client.translate.bind(client);
  }

  async sendMessage(member, unBoost = false) {
    const baseBoost = await this.database
      .table("guild_boost")
      .select()
      .where("guild_id", member.guild.id);
    if (!baseBoost[0]) return;

    const channel = member.guild.channels.cache.get(baseBoost[0].channel_id);
    if (!channel) return;

    if (!member.guild.members.me.permissions.has("Administrator")) {
      if (!channel.viewable) return;
      if (
        !channel
          .permissionsFor(this.client.user.id)
          .any(["EmbedLinks", "SendMessages"])
      )
        return;
    }

    const mention = baseBoost[0].mention;
    const message = !unBoost
      ? baseBoost[0].message_add
      : baseBoost[0].message_remove;

    const boostCount = member.guild.premiumSubscriptionCount;
    const boostLabel =
      boostCount > 1 ? this.translate`boosts` : this.translate`boost`;

    const embed = new EmbedBuilder()
      .setColor(this.colors.blue)
      .setTitle(
        !unBoost
          ? this.translate`Un membre a boost`
          : this.translate`Un membre a arrêté de boost`
      )
      .setFooter({
        text: this
          .translate`Le serveur possède maintenant ${boostCount} ${boostLabel} !`,
        iconURL: member.guild.iconURL() || this.client.user.displayAvatarURL(),
      })
      .setDescription(
        message !== null
          ? message
              .replace("{username}", member.user.displayName)
              .replace("{server}", member.guild.name)
          : !unBoost
          ? this
              .translate`**${member.user.displayName}** a boost le serveur **${member.guild.name}** !`
          : this
              .translate`**${member.user.displayName}** a arrêté de boost le serveur **${member.guild.name}** !`
      );

    return channel.send({
      content: !unBoost ? (mention ? `${member.user}` : null) : null,
      embeds: [embed],
    });
  }

  async handle(oldMember, newMember) {
    if (!oldMember.premiumSinceTimestamp && newMember.premiumSinceTimestamp) {
      await this.sendMessage(newMember);
    } else if (
      oldMember.premiumSinceTimestamp &&
      !newMember.premiumSinceTimestamp
    ) {
      await this.sendMessage(newMember, true);
    } else if (
      oldMember.premiumSinceTimestamp &&
      newMember.premiumSinceTimestamp
    ) {
      if (oldMember.premiumSinceTimestamp !== newMember.premiumSinceTimestamp) {
        await this.sendMessage(newMember);
      }
    }
  }
};
