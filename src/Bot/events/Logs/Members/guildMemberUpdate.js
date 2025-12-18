const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

const MembersNicknameUpdate = require("../../../services/Nickname/MemberNicknameUpdate");
const MemberUpdateBoost = require("../../../services/System/MemberUpdateBoost");
const RolesRewardChecking = require("../../../services/Levels/RolesRewardChecking");

module.exports = class GuildMemberUpdate extends Events {
  constructor(client) {
    super(client, "guildMemberUpdate");
    this.membersNicknameUpdate = new MembersNicknameUpdate(this);
    this.memberUpdateBoost = new MemberUpdateBoost(this);
    this.rolesRewardChecking = new RolesRewardChecking(this);
  }

  async handle(oldMember, newMember) {
    // Boost system
    await this.memberUpdateBoost.handle(oldMember, newMember);

    // Nickname system
    await this.membersNicknameUpdate.handle(oldMember, newMember);

    // Level roles reward
    await this.rolesRewardChecking.handle(oldMember, newMember);

    const channel = await this.verificationChannelLog(
      newMember,
      "update_member_id",
      newMember.guild.id
    );
    if (typeof channel === "boolean") return;

    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      const embed = new EmbedBuilder()
        .setFooter({ text: this.translate`Auteur : ${oldMember.user.id}` })
        .setColor("#F40808")
        .setAuthor({
          name: `${oldMember.user.displayName}`,
          iconURL: `${
            oldMember.user.displayAvatarURL() ||
            this.client.user.displayAvatarURL()
          }`,
        });
      oldMember.roles.cache.forEach((role) => {
        if (!newMember.roles.cache.has(role.id)) {
          embed.setDescription(
            this.translate`Le rôle ${role} a été retiré à ${oldMember.user} !`
          );
        }
      });

      channel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldMember.roles.cache.size < newMember.roles.cache.size) {
      const embed = new EmbedBuilder()
        .setFooter({ text: this.translate`Auteur : ${oldMember.user.id}` })
        .setColor("#08F428")
        .setAuthor({
          name: `${newMember.user.displayName}`,
          iconURL: `${
            newMember.user.displayAvatarURL() ||
            this.client.user.displayAvatarURL()
          }`,
        });
      newMember.roles.cache.forEach((role) => {
        if (!oldMember.roles.cache.has(role.id)) {
          embed.setDescription(
            this.translate`Le rôle ${role} a été ajouté à ${oldMember.user} !`
          );
        }
      });

      channel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldMember.nickname === null && newMember.nickname) {
      const embed = new EmbedBuilder()
        .setFooter({ text: this.translate`Auteur : ${oldMember.user.id}` })
        .setDescription(
          this.translate`Le pseudo de ${oldMember.user} a été créé !`
        )
        .addFields(
          {
            name: this.translate`Avant`,
            value: this.translate`Aucun`,
          },
          {
            name: this.translate`Après`,
            value: newMember.nickname,
          }
        )
        .setAuthor({
          name: `${oldMember.user.displayName}`,
          iconURL: `${
            oldMember.user.displayAvatarURL() ||
            this.client.user.displayAvatarURL()
          }`,
        })
        .setColor("#08F428");

      channel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldMember.nickname && newMember.nickname === null) {
      const embed = new EmbedBuilder()
        .setFooter({ text: this.translate`Auteur : ${oldMember.user.id}` })
        .setDescription(
          this.translate`Le pseudo de ${oldMember.user} a été réinitialisé !`
        )
        .addFields(
          {
            name: this.translate`Avant`,
            value: oldMember.nickname,
          },
          {
            name: this.translate`Après`,
            value: this.translate`Aucun`,
          }
        )
        .setAuthor({
          name: `${oldMember.user.displayName}`,
          iconURL: `${
            oldMember.user.displayAvatarURL() ||
            this.client.user.displayAvatarURL()
          }`,
        })
        .setColor("#F40808");

      channel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setFooter({ text: this.translate`Auteur : ${oldMember.user.id}` })
        .setDescription(
          this.translate`Le pseudo de ${oldMember.user} a été changé !`
        )
        .addFields(
          {
            name: this.translate`Avant`,
            value: oldMember.nickname,
          },
          {
            name: this.translate`Après`,
            value: newMember.nickname,
          }
        )
        .setAuthor({
          name: `${oldMember.user.displayName}`,
          iconURL: `${
            oldMember.user.displayAvatarURL() ||
            this.client.user.displayAvatarURL()
          }`,
        })
        .setColor("#BAF60B");

      channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
};
