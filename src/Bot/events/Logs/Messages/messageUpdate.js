const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class ServerMessageUpdate extends Events {
  constructor(client) {
    super(client, "messageUpdate");
  }

  async handle(oldMessage, newMessage) {
    if (oldMessage.channel.type === 1) return;
    if (!oldMessage.guild) return;

    const channel = await this.verificationChannelLog(
      newMessage,
      "message_id",
      newMessage.guild.id
    );
    if (typeof channel === "boolean") return;

    // No embed in log messages
    if (newMessage.embeds.length > 0) return;
    if (oldMessage.content === null) return;
    if (oldMessage.content === newMessage.content) return;

    const link = `https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.id}`;
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${newMessage.author.displayName}`,
        iconURL: `${
          newMessage.author.displayAvatarURL() ||
          this.client.user.displayAvatarURL()
        }`,
      })
      .setDescription(
        this.translate`Message édité dans ${
          newMessage.channel
        } **[[Jump](${link})]**\n**${this.translate`Avant`}** :\n${
          oldMessage || this.translate`Inconnu`
        }\n **${this.translate`Après`}** :\n${
          newMessage || this.translate`Inconnu`
        }`
      )
      .setFooter({ text: this.translate`Auteur : ${newMessage.author.id}` })
      .setColor("#BAF60B");

    // Check the limit of the description
    if (embed.data.description.length > 2048) {
      embed.setDescription(
        this
          .translate`Message édité dans ${newMessage.channel} **[[Jump](${link})]**`
      );
      embed.addFields([
        // Keep only the first 2k characters
        {
          name: this.translate`Avant`,
          value: `${
            oldMessage.content.substr(0, 1000) || this.translate`Inconnu`
          }`,
        },
        {
          name: this.translate`Après`,
          value: `${
            newMessage.content.substr(0, 1000) || this.translate`Inconnu`
          }`,
        },
      ]);
    }

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
