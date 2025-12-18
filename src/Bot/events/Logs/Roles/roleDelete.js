const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class RoleDelete extends Events {
  constructor(client) {
    super(client, "roleDelete");
  }

  async handle(role) {
    const channel = await this.verificationChannelLog(
      role,
      "update_server_id",
      role.guild.id
    );
    if (typeof channel === "boolean") return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: this.translate`Rôle supprimé` })
      .setColor("#F40808")
      .addFields([
        { name: this.translate`:point_right: **Nom**`, value: `${role.name}` },
        { name: this.translate`:id: **Id**`, value: `\`${role.id}\`` },
      ]);

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
