const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class ChannelDelete extends Events {
  constructor(client) {
    super(client, "channelDelete");
  }

  async handle(channel) {
    if (channel.type === 1) return;

    const channelSend = await this.verificationChannelLog(
      channel,
      "update_server_id",
      channel.guild.id
    );
    if (typeof channelSend === "boolean") return;

    const channelType = {
      0: this.translate`Textuel`,
      2: this.translate`Vocal`,
      4: this.translate`Catégorie`,
      5: this.translate`Annonce`,
      13: this.translate`Stage`,
      11: this.translate`Thread public`,
      12: this.translate`Thread privé`,
      10: this.translate`Thread annonce`,
      15: this.translate`Forum`,
    };
    const cType = channelType[channel.type] || this.translate`Inconnu`;

    const embed = new EmbedBuilder()
      .setAuthor({ name: this.translate`Salon supprimé` })
      .setColor("#F40808")
      .addFields([
        {
          name: this.translate`:point_right: **Nom**`,
          value: `${channel.name}`,
        },
        { name: this.translate`:id: **Id**`, value: `\`${channel.id}\`` },
        { name: this.translate`:pushpin: **Type**`, value: `\`${cType}\`` },
      ]);

    channelSend.send({ embeds: [embed] }).catch(() => null);
  }
};
