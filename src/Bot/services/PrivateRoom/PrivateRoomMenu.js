module.exports = class PrivateRoomMenu {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.privateRoom = event.privateRoom;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isMentionableSelectMenu()) return;

    if (inter.customId !== "room_mentionable") return;

    const userVoice = await this.database
      .table("user_voice")
      .select()
      .where({ channelId: inter.channel.id })
      .first();
    if (!userVoice) return;

    if (inter.user.id !== userVoice.ownerId) {
      return inter.reply({
        content: this
          .translate`${this.client.emojiError} Vous n'avez pas les **permisssions** nécessaires !`,
        flags: 64,
      });
    }

    await inter.deferUpdate();
    const members = inter.members.map((member) => member.id);
    const roles = inter.roles.map((role) => role.id);
    let countAdd = 0;
    let countRemove = 0;

    let mentionableMembers = JSON.parse(userVoice.mentionable).members;
    let mentionableRoles = JSON.parse(userVoice.mentionable).roles;

    for (const memberId of members) {
      if (mentionableMembers.includes(memberId)) {
        mentionableMembers = mentionableMembers.filter((id) => id !== memberId);
        countRemove++;

        // Remove permissions from the channel
        await inter.channel.permissionOverwrites
          .delete(memberId)
          .catch(() => null);
      } else {
        mentionableMembers.push(memberId);
        countAdd++;

        // Add permissions to the channel
        await inter.channel.permissionOverwrites
          .create(memberId, { ViewChannel: true, Connect: true })
          .catch(() => null);
      }
    }

    for (const roleId of roles) {
      if (mentionableRoles.includes(roleId)) {
        mentionableRoles = mentionableRoles.filter((id) => id !== roleId);
        countRemove++;

        // Remove permissions from the channel
        await inter.channel.permissionOverwrites
          .delete(roleId)
          .catch(() => null);
      } else {
        mentionableRoles.push(roleId);
        countAdd++;

        // Add permissions to the channel
        await inter.channel.permissionOverwrites
          .create(roleId, { ViewChannel: true, Connect: true })
          .catch(() => null);
      }
    }

    await this.database
      .table("user_voice")
      .update({
        mentionable: JSON.stringify({
          members: mentionableMembers,
          roles: mentionableRoles,
        }),
      })
      .where({ channelId: inter.channel.id });

    await inter.followUp({
      content: this
        .translate`${this.client.emojiSuccess} \`${countAdd}\` membres/rôles ont été **ajoutés** au salon et \`${countRemove}\` membres/rôles ont été **retirés** du salon.`,
    });

    await inter.message.edit({
      embeds: [
        this.privateRoom.displayEmbed(inter, {
          mentionable: { members: mentionableMembers, roles: mentionableRoles },
          membersAdmin: JSON.parse(userVoice.membersAdmin),
          membersBanned: JSON.parse(userVoice.membersBanned),
        }),
      ],
      components: [],
    });

    return inter.message.edit({
      components: this.privateRoom.displayButtons({
        isHidden: userVoice.isHidden,
        isPrivate: userVoice.isPrivate,
        isMute: userVoice.isMute,
      }),
    });
  }
};
