const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class GuildMemberRemove extends Events {
  constructor(client) {
    super(client, "guildMemberRemove");
  }

  async handle(member) {
    // Get the guild invites config
    const invitesConfig = await this.database
      .table("guild_invite_config")
      .select()
      .where({ guild_id: member.guild.id });
    if (invitesConfig[0]) {
      await this.invitesManager.trackLeftMember(member.guild, member.user);
    }

    const baseWelcome = await this.database
      .table("guild_welcome")
      .select()
      .where("guild_id", member.guild.id);
    if (!baseWelcome[0]) return;

    const channel = member.guild.channels.cache.get(
      baseWelcome[0].channel_leave_id
    );
    if (!channel) return;

    if (!channel.guild.members.me.permissions.has("Administrator")) {
      if (!channel.viewable) return;
      if (
        !channel
          .permissionsFor(this.client.user.id)
          .any(["EmbedLinks", "SendMessages"])
      )
        return;
    }

    const members = await member.guild.members.fetch();
    const countMember = members.filter((member) => !member.user.bot).size;
    const countBot = members.filter((member) => member.user.bot).size;

    if (member.user.bot) {
      const botLabel =
        countBot > 1 ? this.translate`bots` : this.translate`bot`;
      const embed = new EmbedBuilder()
        .setTitle(this.translate`Bot retiré !`)
        .setDescription(
          this
            .translate`**${member.user.displayName}** vient d'être retirer du serveur ! Le serveur possède désormais **${countBot}** ${botLabel} !`
        )
        .setThumbnail(
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        )
        .setColor(this.colors.red)
        .setFooter({
          text: this.client.user.displayName,
          iconURL: this.client.user.displayAvatarURL(),
        });

      channel.send({ embeds: [embed] }).catch(() => null);
    } else {
      const msgLeave = baseWelcome[0].msg_leave;

      let finalMsg;
      if (msgLeave === null) {
        finalMsg = this
          .translate`${member.user.displayName} vient de quitter le serveur **${member.guild.name}** !`;
      } else {
        finalMsg = msgLeave
          .replace("{user.mention}", member.user.toString())
          .replace("{user.username}", member.user.username)
          .replace("{member.nickname}", member.displayName)
          .replace("{server}", member.guild.name);
      }

      const memberLabel =
        countMember > 1 ? this.translate`membres` : this.translate`membre`;

      const embed = new EmbedBuilder()
        .setTitle(this.translate`Départ d'un membre`)
        .setDescription(finalMsg)
        .setThumbnail(
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        )
        .setColor(this.colors.red)
        .setFooter({
          text: this
            .translate`${this.client.user.displayName} - ${countMember} ${memberLabel}`,
          iconURL: this.client.user.displayAvatarURL(),
        });

      channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
};
