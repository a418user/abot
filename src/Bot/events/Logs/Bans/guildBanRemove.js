const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class GuildBanRemove extends Events {
  constructor(client) {
    super(client, "guildBanRemove");
  }

  async handle(member) {
    const channel = await this.verificationChannelLog(
      member,
      "update_member_id",
      member.guild.id
    );
    if (typeof channel === "boolean") return;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: this.translate`Membre débanni`,
        iconURL: `${
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        }`,
      })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: false }))
      .setDescription(
        this
          .translate`<@!${member.user.id}> ${member.user.displayName} a été débanni !`
      )
      .setFooter({ text: this.translate`Id : ${member.user.id}` })
      .setColor("#08F428");

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
