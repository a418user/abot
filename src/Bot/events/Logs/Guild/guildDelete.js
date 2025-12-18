const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class GuildDelete extends Events {
  constructor(client) {
    super(client, "guildDelete");
  }

  async handle(guild) {
    if (!guild.available) return;

    /* Add Statistics for the Dashboard */
    await this.client.statistics.addLostServerPerDay();

    await this.database.deleteTable("guild_afk", { guild_id: guild.id });
    await this.database.deleteTable("guild_auto_role", { guild_id: guild.id });
    await this.database.deleteTable("guild_birthday", { guild_id: guild.id });
    await this.database.deleteTable("guild_boost", { guild_id: guild.id });
    await this.database.deleteTable("guild_easter_eggs", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_form", { guild_id: guild.id });
    await this.database.deleteTable("guild_ghost_ping", { guild_id: guild.id });
    await this.database.deleteTable("guild_ghost_ping_member", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_invite_config", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("user_invite", { guild_id: guild.id });
    await this.database.deleteTable("guild_levels", { guildId: guild.id });
    await this.database.deleteTable("guild_log", { guild_id: guild.id });
    await this.database.deleteTable("guild_money", { guild_id: guild.id });
    await this.database.deleteTable("guild_nickname", { guild_id: guild.id });
    await this.database.deleteTable("guild_prison", { guild_id: guild.id });
    await this.database.deleteTable("guild_private_channel", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_pub", { guild_id: guild.id });
    await this.database.deleteTable("guild_pub_channel", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_pub_statistics", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_reaction_role", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_reminder", { guild_id: guild.id });
    await this.database.deleteTable("guild_report", { guild_id: guild.id });
    await this.database.deleteTable("guild_rules", { guild_id: guild.id });
    await this.database.deleteTable("guild_shop", { guild_id: guild.id });
    await this.database.deleteTable("guild_statistics", { guild_id: guild.id });
    await this.database.deleteTable("guild_suggest", { guildId: guild.id });
    await this.database.deleteTable("guild_ticket", { guild_id: guild.id });
    await this.database.deleteTable("guild_ticket_menu", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("guild_voice_settings", {
      guildId: guild.id,
    });
    await this.database.deleteTable("guild_welcome", { guild_id: guild.id });
    await this.database.deleteTable("poll_number", { guild_id: guild.id });
    await this.database.deleteTable("user_levels", { guildId: guild.id });
    await this.database.deleteTable("user_money", { guild_id: guild.id });
    await this.database.deleteTable("user_prison", { guild_id: guild.id });
    await this.database.deleteTable("user_pub_statistics", {
      guild_id: guild.id,
    });
    await this.database.deleteTable("user_shop", { guild_id: guild.id });
    await this.database.deleteTable("user_suggest", { guildId: guild.id });
    await this.database.deleteTable("user_ticket", { guild_id: guild.id });
    await this.database.deleteTable("user_ticket_menu", { guild_id: guild.id });
    await this.database.deleteTable("user_vocal", { guildId: guild.id });

    /* Remove cache invites */
    this.invitesManager.resetInviteCache(guild.id);

    /* Get the log channel */
    const logChannel = this.client.channels.cache.get(
      this.config["system"]["logAddRemoveChannelId"]
    );
    if (!logChannel) return;

    /* Check bot permissions */
    if (!logChannel.guild.members.me.permissions.has("Administrator")) {
      if (!logChannel.viewable) return;
      if (
        !logChannel
          .permissionsFor(this.client.user.id)
          .any(["EmbedLinks", "SendMessages"])
      )
        return;
    }

    /* Get the owner */
    const owner = (await this.client.users
      .fetch(guild.ownerId)
      .catch(() => null))
      ? await this.client.users.fetch(guild.ownerId)
      : null;

    /* Create the embed */
    const embed = new EmbedBuilder()
      .setColor(this.colors.blue)
      .setAuthor({
        name: this.translate`Départ sur un serveur`,
        iconURL: guild.iconURL() || this.client.user.displayAvatarURL(),
      })
      .setDescription(
        this.translate`> ${this.emojis.bot} **Nom :** \`${guild.name}\`
> ${this.emojis.id} **Identifiant :**\`${guild.id}\`
> ${this.emojis.owner} **Propriétaire :** ${
          owner !== null ? owner.displayName : this.translate`Inconnu`
        }
> ${this.emojis.members} **Membres :** \`${guild.memberCount}\`
> ${this.emojis.giveaway} **Date de création :** <t:${Math.floor(
          guild.createdAt / 1000
        )}:F>
> ${this.emojis.arrow} **Serveur du bot :** \`${
          this.client.guilds.cache.size
        }\``
      )
      .setFooter({
        text: this.client.user.displayName,
        iconURL: this.client.user.displayAvatarURL(),
      });

    /* Send the embed */
    logChannel.send({ embeds: [embed] }).catch(() => null);
  }
};
