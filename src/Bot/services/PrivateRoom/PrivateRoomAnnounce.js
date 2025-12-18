const { EmbedBuilder } = require("discord.js");

module.exports = class PrivateRoomAnnounce {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.privateRoom = event.privateRoom;
    this.translate = event.translate.bind(event);
  }

  async handle(oldState, newState) {
    const state = newState.channelId !== null ? newState : oldState;

    const voiceUser = await this.database
      .table("user_voice")
      .where("channelId", state.channelId)
      .first();
    if (
      !voiceUser ||
      !voiceUser.isAnnounce ||
      voiceUser.ownerId === state.member.id
    )
      return;

    // Join channel
    if (
      (!oldState.channelId && newState.channelId) ||
      (oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId)
    ) {
      const embed = new EmbedBuilder()
        .setColor(state.guild.members.me.displayHexColor)
        .setDescription(
          this
            .translate`🟢 \`${state.member.user.username}\` a **rejoint** le salon vocal.`
        );

      state.channel.send({ embeds: [embed] });
    }
    // Leave channel
    else if (
      (!newState.channelId && oldState.channelId) ||
      (oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId)
    ) {
      const embed = new EmbedBuilder()
        .setColor(state.guild.members.me.displayHexColor)
        .setDescription(
          this
            .translate`🔴 \`${state.member.user.username}\` a **quitté** le salon vocal.`
        );

      state.channel.send({ embeds: [embed] });
    }
  }
};
