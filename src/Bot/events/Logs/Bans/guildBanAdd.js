const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class GuildBanAdd extends Events {
  constructor(client) {
    super(client, "guildBanAdd");
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
        name: this.translate`Membre banni`,
        iconURL: `${
          member.user.displayAvatarURL() || this.client.user.displayAvatarURL()
        }`,
      })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: false }))
      .setDescription(
        this
          .translate`<@!${member.user.id}> ${member.user.displayName} a été banni !`
      )
      .setFooter({ text: this.translate`Id : ${member.user.id}` })
      .setColor("#F40808");

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
