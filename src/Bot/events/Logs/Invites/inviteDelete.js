const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class InviteDelete extends Events {
  constructor(client) {
    super(client, "inviteDelete");
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

      // Check if invite code exists in the cache
      if (cachedInvites && cachedInvites.get(invite.code)) {
        cachedInvites.get(invite.code).deletedTimestamp = Date.now();
      }
    }

    const channel = await this.verificationChannelLog(
      invite,
      "link_id",
      invite.guild.id
    );
    if (typeof channel === "boolean") return;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: this.translate`Lien d'invitation supprimé`,
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setThumbnail(
        invite.guild.iconURL() || this.client.user.displayAvatarURL()
      )
      .addFields([
        {
          name: this.translate`Suppression de l'invitation`,
          value: `discord.gg/${invite.code}`,
        },
      ])
      .setColor("#F40808");

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
