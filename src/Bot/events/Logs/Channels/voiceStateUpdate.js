const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

const VoiceXp = require("../../../services/Levels/VoiceXp");
const PrivateRoomSystem = require("../../../services/PrivateRoom/PrivateRoomSystem");
const PrivateRoomAnnounce = require("../../../services/PrivateRoom/PrivateRoomAnnounce");
const PrivateRoomWaiting = require("../../../services/PrivateRoom/PrivateRoomWaiting");

module.exports = class VoiceStateUpdate extends Events {
  constructor(client) {
    super(client, "voiceStateUpdate");
    this.voiceXp = new VoiceXp(this);
    this.privateRoomSystem = new PrivateRoomSystem(this);
    this.privateRoomAnnounce = new PrivateRoomAnnounce(this);
    this.privateRoomWaiting = new PrivateRoomWaiting(this);
  }

  async handle(oldState, newState) {
    /* VoiceXp */
    await this.voiceXp.handle(oldState, newState);

    /* Private Room System */
    await this.privateRoomSystem.handle(oldState, newState);

    /* Private Room Announce */
    await this.privateRoomAnnounce.handle(oldState, newState);

    /* Private Room Waiting */
    await this.privateRoomWaiting.handle(oldState, newState);

    const state = newState.channelId !== null ? newState : oldState;
    const userFetch = await this.client.users.fetch(state.id).catch(() => null);
    const user = userFetch ? userFetch : state.member.user;

    const channelSend = await this.verificationChannelLog(
      state,
      "voice_id",
      state.guild.id
    );
    if (typeof channelSend === "boolean") return;

    const sendVoiceLog = (description, color, footerAuthor = user.id) => {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${user.displayName}`,
          iconURL: `${
            user.displayAvatarURL() || this.client.user.displayAvatarURL()
          }`,
        })
        .setDescription(description)
        .setFooter({ text: this.translate`Auteur : ${footerAuthor}` })
        .setColor(color);

      channelSend.send({ embeds: [embed] }).catch(() => null);
    };

    if (!oldState.channelId) {
      sendVoiceLog(
        this.translate`${user} a rejoint le salon vocal : ${newState.channel}`,
        "#08F428"
      );
    } else if (!newState.channelId) {
      sendVoiceLog(
        this.translate`${user} a quitté le salon vocal : ${oldState.channel}`,
        "#F40808"
      );
    } else if (oldState.channelId !== newState.channelId) {
      sendVoiceLog(
        this
          .translate`${user} a changé de salon vocal : ${oldState.channel} -> ${newState.channel}`,
        "#BAF60B",
        newState.member.user.id
      );
    } else {
      const footerId = newState.member?.user?.id || user.id;

      if (oldState.serverDeaf === false && newState.serverDeaf === true) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a été rendu sourd dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (
        oldState.serverDeaf === true &&
        newState.serverDeaf === false
      ) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} n'est plus sourd dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (
        oldState.serverMute === false &&
        newState.serverMute === true
      ) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a été rendu muet dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (
        oldState.serverMute === true &&
        newState.serverMute === false
      ) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} n'est plus muet dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (oldState.streaming === false && newState.streaming === true) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a commencé un stream dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (oldState.streaming === true && newState.streaming === false) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a arrêté un stream dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (oldState.selfVideo === false && newState.selfVideo === true) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a mis sa caméra dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      } else if (oldState.selfVideo === true && newState.selfVideo === false) {
        sendVoiceLog(
          this
            .translate`${newState.member.user} a enlevé sa caméra dans le salon vocal : ${oldState.channel}`,
          "#BAF60B",
          footerId
        );
      }
    }
  }
};
