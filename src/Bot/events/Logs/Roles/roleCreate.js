const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class RoleCreate extends Events {
  constructor(client) {
    super(client, "roleCreate");
  }

  async handle(role) {
    const channel = await this.verificationChannelLog(
      role,
      "update_server_id",
      role.guild.id
    );
    if (typeof channel === "boolean") return;

    const mentionableLabel = role.mentionable
      ? this.translate`Oui`
      : this.translate`Non`;

    const embed = new EmbedBuilder()
      .setAuthor({ name: this.translate`Rôle créé` })
      .setColor("#08F428")
      .addFields([
        { name: this.translate`:point_right: **Nom**`, value: `${role.name}` },
        { name: this.translate`:id: **Id**`, value: `\`${role.id}\`` },
        {
          name: this.translate`pushpin: **Couleur**`,
          value: `\`${role.hexColor}\``,
        },
        {
          name: this.translate`:detective: **Mentionable**`,
          value: `${mentionableLabel}`,
        },
        {
          name: this.translate`:unlock: **Permission**`,
          value: `\`${role.permissions.toArray().join(", ")}\``,
        },
      ]);

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
