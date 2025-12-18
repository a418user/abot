module.exports = class NewMemberInvite {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.invitesManager = event.invitesManager;
    this.translate = event.translate.bind(event);
  }

  async handle(member) {
    // Get the guild invites config
    const invitesConfig = await this.database
      .table("guild_invite_config")
      .select()
      .where({ guild_id: member.guild.id });

    // If the guild is not in the database, return
    if (!invitesConfig[0]) return;

    // Get the invite used
    const inviterData = await this.invitesManager.trackJoinedMember(member);

    // Get the log channel
    const logChannel = member.guild.channels.cache.get(
      invitesConfig[0].channel_id
    );
    if (!logChannel) return;

    const inviteData = {};

    const inviterId = inviterData.member_id || "NA";
    if (inviterId !== "VANITY" && inviterId !== "NA") {
      try {
        inviteData.inviter = await member.guild.members.fetch(inviterId);
      } catch {
        inviteData.inviter = "NA";
      }
    } else if (member.user.bot) {
      inviteData.inviter = "OAuth";
    } else {
      inviteData.inviter = inviterId;
    }

    // Send the message
    if (inviteData.inviter === "NA")
      return logChannel.send(
        this
          .translate`**${member.user.displayName}** a rejoint mais je ne sais pas avec quelle invitation.`
      );
    if (inviteData.inviter === "VANITY")
      return logChannel.send(
        this
          .translate`**${member.user.displayName}** a rejoint via le lien d'invitation personnalisé.`
      );
    if (inviteData.inviter === "OAuth")
      return logChannel.send(
        this.translate`**${member.user.displayName}** a rejoint via l'OAuth2.`
      );
    if (inviteData.inviter.user.bot)
      return logChannel.send(
        this
          .translate`**${member.user.displayName}** vient de rejoindre le serveur. Il a été invité par un bot.`
      );

    const invitesCount = this.invitesManager.getEffectiveInvites(inviterData);
    const invitesWord = this.translate(
      invitesCount > 1 ? "invitations" : "invitation"
    );
    logChannel.send(
      this
        .translate`**${member.user.displayName}** vient de rejoindre le serveur. Il a été invité par **${inviteData.inviter.displayName}** qui a désormais **${invitesCount} ${invitesWord}** !`
    );
  }
};
