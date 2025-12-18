const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class InviteCreate extends Events {
  constructor(client) {
    super(client, "inviteCreate");
  }

  async handle(invite) {
    // Invitation system
    const invitesConfig = await this.database
      .table("guild_invite_config")
      .select()
      .where({ guild_id: invite.guild.id });
    if (invitesConfig[0]) {
      // Add the invite to the cache
      const cachedInvites = this.invitesManager.getInviteCache(invite?.guild);

      if (cachedInvites) {
        cachedInvites.set(
          invite.code,
          this.invitesManager.cacheInvite(invite, false)
        );
      }
    }

    const channel = await this.verificationChannelLog(
      invite,
      "link_id",
      invite.guild.id
    );
    if (typeof channel === "boolean") return;

    const statusLabel = invite.temporary
      ? this.translate`Oui`
      : this.translate`Non`;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: this.translate`Lien d'invitation créé`,
        iconURL: `${
          invite?.inviter?.displayAvatarURL() ||
          this.client.user.displayAvatarURL()
        }`,
      })
      .setThumbnail(
        invite.guild.iconURL() || this.client.user.displayAvatarURL()
      )
      .addFields([
        {
          name: this.translate`Inviteur`,
          value: `${invite?.inviter?.displayName} (\`${invite?.inviter?.id}\`)`,
        },
        {
          name: this.translate`Lien`,
          value: `[discord.gg/${invite.code}](https://discord.gg/${invite.code})`,
        },
        { name: this.translate`Temporaire`, value: `${statusLabel}` },
        {
          name: this.translate`Nombre maximum d'utilisations`,
          value: `${invite.maxUses || this.translate`Illimité`}`,
        },
        {
          name: this.translate`Expiration`,
          value: invite.expiresTimestamp
            ? `<t:${`${Math.floor(invite.expiresTimestamp / 1000)}:R>`}`
            : this.translate`Illimité`,
        },
        {
          name: this.translate`Salon de l'invitation`,
          value: `${invite.channel}`,
        },
      ])
      .setColor("#08F428");

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
