const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

const NewMemberInvite = require("../../../services/Invite/NewMember");
const MemberNicknameAdd = require("../../../services/Nickname/MemberNicknameAdd");
const MemberAddPrison = require("../../../services/System/MemberAddPrison");
const MemberGhostPing = require("../../../services/System/MemberGhostPing");

module.exports = class GuildMemberAdd extends Events {
  constructor(client) {
    super(client, "guildMemberAdd");
    this.newMemberInvite = new NewMemberInvite(this);
    this.memberNicknameAdd = new MemberNicknameAdd(this);
    this.memberAddPrison = new MemberAddPrison(this);
    this.memberGhostPing = new MemberGhostPing(this);
  }

  async handle(member) {
    // Auto-role
    const baseAutoRole = await this.database
      .table("guild_auto_role")
      .select()
      .where("guild_id", member.guild.id);
    const baseUserPrison = await this.database
      .table("user_prison")
      .select()
      .where({ guild_id: member.guild.id, user_id: member.id });

    if (baseAutoRole[0] && !baseUserPrison[0]) {
      const roles = JSON.parse(baseAutoRole[0].roles);

      const roleList = [];
      for (const role of roles) {
        const roleGuild = member.guild.roles.cache.get(role.roleId);
        if (!roleGuild) continue;

        if (
          member.user.bot &&
          role.type === "bot" &&
          !member.roles.cache.get(role.roleId)
        ) {
          roleList.push(role.roleId);
        } else if (
          !member.user.bot &&
          role.type === "user" &&
          !member.roles.cache.get(role.roleId)
        ) {
          roleList.push(role.roleId);
        }
      }

      if (roleList.length > 0) {
        await member.roles.add(roleList, "Auto role").catch(() => null);
      }
    }

    // Invitation system
    await this.newMemberInvite.handle(member);

    // Nickname system
    await this.memberNicknameAdd.handle(member);

    // Prison system
    await this.memberAddPrison.handle(member);

    // Ghost ping system
    await this.memberGhostPing.handle(member);

    // Log new member
    const baseWelcome = await this.database
      .table("guild_welcome")
      .select()
      .where("guild_id", member.guild.id);
    if (!baseWelcome[0]) return;

    const channel = member.guild.channels.cache.get(
      baseWelcome[0].channel_welcome_id
    );
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

    const members = await member.guild.members.fetch();
    const countMember = members.filter((member) => !member.user.bot).size;
    const countBot = members.filter((member) => member.user.bot).size;

    if (member.user.bot) {
      const botLabel =
        countBot > 1 ? this.translate`bots` : this.translate`bot`;
      const embed = new EmbedBuilder()
        .setTitle(this.translate`Bot ajouté !`)
        .setThumbnail(
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        )
        .setColor(this.colors.green)
        .setDescription(
          this
            .translate`**${member.user.displayName}** vient d'arriver sur le serveur ! Le serveur possède désormais **${countBot}** ${botLabel} !`
        )
        .setFooter({
          text: this.client.user.displayName,
          iconURL: this.client.user.displayAvatarURL(),
        });

      channel.send({ embeds: [embed] }).catch(() => null);
    } else {
      const msgBvn = baseWelcome[0].msg_bvn;
      const mention = baseWelcome[0].mention;

      let finalMsg;
      if (msgBvn === null) {
        finalMsg = this
          .translate`Bienvenue sur le serveur **${member.guild.name}** ${member.user} !`;
      } else {
        finalMsg = msgBvn
          .replace("{user.mention}", member.user.toString())
          .replace("{user.username}", member.user.username)
          .replace("{member.nickname}", member.displayName)
          .replace("{server}", member.guild.name);
      }

      const memberLabel =
        countMember > 1 ? this.translate`membres` : this.translate`membre`;

      const embed = new EmbedBuilder()
        .setTitle(this.translate`Arrivé d'un membre !`)
        .setDescription(finalMsg)
        .setThumbnail(
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        )
        .setColor(this.colors.green)
        .setFooter({
          text: this
            .translate`${this.client.user.displayName} - ${countMember} ${memberLabel}`,
          iconURL: this.client.user.displayAvatarURL(),
        });

      channel
        .send({
          content: mention ? `${member.user}` : null,
          embeds: [embed],
        })
        .catch(() => null);
    }
  }
};
