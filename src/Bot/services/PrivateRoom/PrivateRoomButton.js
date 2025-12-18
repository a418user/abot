const {
  EmbedBuilder,
  ActionRowBuilder,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

module.exports = class PrivateRoomButton {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.privateRoom = event.privateRoom;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    if (
      inter.customId !== "room_visible" &&
      inter.customId !== "room_private" &&
      inter.customId !== "room_mute" &&
      inter.customId !== "room_rename" &&
      inter.customId !== "waiting_accept" &&
      inter.customId !== "waiting_refuse" &&
      inter.customId !== "waiting_ban"
    )
      return;

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

    if (
      (!inter.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
        !inter.guild.members.me.permissions.has(
          PermissionsBitField.Flags.ManageRoles
        ) ||
        !inter.guild.members.me.permissions.has(
          PermissionsBitField.Flags.MuteMembers
        )) &&
      !inter.guild.members.me.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return inter.reply({
        content: `${this.client.emojiError} ${this.translate(
          "J'ai besoin des permissions {0} !",
          "`ManageChannels`, `ManageRoles`, `MuteMembers`"
        )}`,
      });

    if (inter.customId === "room_visible") {
      await inter.deferUpdate();

      if (userVoice.isHidden) {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { ViewChannel: true }
        );

        await this.database
          .table("user_voice")
          .update({ isHidden: false })
          .where({ channelId: inter.channel.id });
      } else {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { ViewChannel: false }
        );

        await this.database
          .table("user_voice")
          .update({ isHidden: true })
          .where({ channelId: inter.channel.id });
      }

      const embed = new EmbedBuilder()
        .setColor(inter.guild.members.me.displayHexColor)
        .setDescription(
          this.translate`${
            this.client.emojiSuccess
          } Le salon vocal est désormais ${
            userVoice.isHidden
              ? this.translate`visible`
              : this.translate`invisible`
          } !`
        );

      return inter.followUp({ embeds: [embed] });
    } else if (inter.customId === "room_private") {
      await inter.deferUpdate();

      if (userVoice.isPrivate) {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { Connect: true }
        );

        const waitingChannel = inter.guild.channels.cache.get(
          userVoice.channelWaitingId
        );
        if (waitingChannel)
          await waitingChannel.permissionOverwrites.edit(
            inter.guild.roles.everyone,
            { ViewChannel: false }
          );

        await this.database
          .table("user_voice")
          .update({ isPrivate: false })
          .where({ channelId: inter.channel.id });
      } else {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { Connect: false }
        );

        const waitingChannel = inter.guild.channels.cache.get(
          userVoice.channelWaitingId
        );
        if (waitingChannel)
          await waitingChannel.permissionOverwrites.edit(
            inter.guild.roles.everyone,
            { ViewChannel: true }
          );

        await this.database
          .table("user_voice")
          .update({ isPrivate: true })
          .where({ channelId: inter.channel.id });
      }

      const embed = new EmbedBuilder()
        .setColor(inter.guild.members.me.displayHexColor)
        .setDescription(
          this.translate`${
            this.client.emojiSuccess
          } Le salon vocal est désormais ${
            userVoice.isPrivate ? this.translate`public` : this.translate`privé`
          } !`
        );

      return inter.followUp({ embeds: [embed] });
    } else if (inter.customId === "room_mute") {
      await inter.deferUpdate();

      if (userVoice.isMute) {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { Speak: true }
        );

        await this.database
          .table("user_voice")
          .update({ isMute: false })
          .where({ channelId: inter.channel.id });
      } else {
        await inter.channel.permissionOverwrites.edit(
          inter.guild.roles.everyone,
          { Speak: false }
        );

        await this.database
          .table("user_voice")
          .update({ isMute: true })
          .where({ channelId: inter.channel.id });
      }

      const embed = new EmbedBuilder()
        .setColor(inter.guild.members.me.displayHexColor)
        .setDescription(
          this.translate`${this.client.emojiSuccess} Le salon vocal a été ${
            userVoice.isMute ? this.translate`démuté` : this.translate`muté`
          } avec succès !`
        );

      return inter.followUp({ embeds: [embed] });
    } else if (inter.customId === "room_rename") {
      const date = Date.now();
      const modal = new ModalBuilder()
        .setCustomId(`name_${date}`)
        .setTitle(this.translate`Nom salon vocaux temporaires`);

      const textInput = new TextInputBuilder()
        .setCustomId("channelName")
        .setStyle(1)
        .setLabel(this.translate`» Salon vocal`)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(textInput);

      modal.addComponents(actionRow);

      inter.showModal(modal).catch(() => {});

      const filter = (modal) => modal.customId === `name_${date}`;
      inter
        .awaitModalSubmit({ filter, time: 5 * 60 * 1000 })
        .catch(() => {})
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);

          const name = modal.fields.getTextInputValue("channelName");

          const embed = new EmbedBuilder().setColor(
            inter.guild.members.me.displayHexColor
          );

          await inter.channel
            .setName(name)
            .then(() => {
              embed.setDescription(
                this
                  .translate`${this.client.emojiSuccess} Le salon vocal a été renommé avec succès !`
              );
              return inter.followUp({ embeds: [embed] });
            })
            .catch(() => {
              embed.setDescription(
                this
                  .translate`${this.client.emojiError} Une erreur est survenue lors du renommage du salon vocal !`
              );
              return inter.followUp({ embeds: [embed] });
            });
        });
    } else if (inter.customId === "waiting_accept") {
      await inter.deferUpdate();

      const userVoiceWaiting = await this.database
        .table("user_voice_waiting")
        .where("channelId", inter.channel.id)
        .first();
      if (!userVoiceWaiting) return;

      // Get the member
      const member = inter.guild.members.cache.get(userVoiceWaiting.userId);

      // Move the member to the channel
      await member.voice.setChannel(inter.channel).catch(() => null);

      // Delete the message
      await inter.channel.messages
        .fetch(userVoiceWaiting.messageId)
        .then((msg) => msg.delete().catch(() => null))
        .catch(() => null);

      // Delete the data
      await this.database
        .table("user_voice_waiting")
        .delete()
        .where("channelId", inter.channel.id);
    } else if (inter.customId === "waiting_refuse") {
      await inter.deferUpdate();

      const userVoiceWaiting = await this.database
        .table("user_voice_waiting")
        .where("channelId", inter.channel.id)
        .first();
      if (!userVoiceWaiting) return;

      // Delete the message
      await inter.channel.messages
        .fetch(userVoiceWaiting.messageId)
        .then((msg) => msg.delete().catch(() => null))
        .catch(() => null);

      // Delete the data
      await this.database
        .table("user_voice_waiting")
        .delete()
        .where("channelId", inter.channel.id);
    } else if (inter.customId === "waiting_ban") {
      await inter.deferUpdate();

      const userVoiceWaiting = await this.database
        .table("user_voice_waiting")
        .where("channelId", inter.channel.id)
        .first();
      if (!userVoiceWaiting) return;

      // Get the member
      const member = inter.guild.members.cache.get(userVoiceWaiting.userId);

      // Get the list of the members banned from the voice channel
      const voiceUser = await this.database
        .table("user_voice")
        .where("channelId", inter.channel.id)
        .first();

      // Get the list of the members banned from the voice channel
      const membersBanned = JSON.parse(voiceUser.membersBanned);
      const isBanned = membersBanned.includes(member.id);
      if (isBanned) return member.voice.disconnect().catch(() => null);

      // Add the member to the list of the members banned from the voice channel
      membersBanned.push(member.id);

      await this.database
        .table("user_voice")
        .update({ membersBanned: JSON.stringify(membersBanned) })
        .where({ channelId: inter.channel.id });

      // Kick the member from the voice waiting channel
      await member.voice.disconnect().catch(() => null);

      const embed = new EmbedBuilder().setColor(
        inter.guild.members.me.displayHexColor
      );

      // Ban the member from the voice channel
      await inter.channel.permissionOverwrites
        .edit(member, { Connect: false })
        .then(async () => {
          embed.setDescription(
            this
              .translate`${this.client.emojiSuccess} L'utilisateur ${member} a été banni du salon vocal !`
          );
          await inter.followUp({ embeds: [embed] });
        })
        .catch(async () => {
          embed.setDescription(
            this
              .translate`${this.client.emojiError} Une erreur est survenue lors du bannissement de ${member} du salon vocal !`
          );
          await inter.followUp({ embeds: [embed] });
        });

      // Get the waiting channel
      const waitingChannel = inter.guild.channels.cache.get(
        voiceUser.channelWaitingId
      );
      if (waitingChannel) {
        await waitingChannel.permissionOverwrites.edit(member, {
          Connect: false,
        });
      }

      // Edit the message
      const msg = await inter.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (!msg || msg.size > 1) return;

      await msg.edit({
        embeds: [
          this.privateRoom.displayEmbed(inter, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: JSON.parse(voiceUser.membersAdmin),
            membersBanned: membersBanned,
          }),
        ],
      });
    }
  }
};
