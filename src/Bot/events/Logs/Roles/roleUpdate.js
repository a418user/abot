const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class RoleUpdate extends Events {
  constructor(client) {
    super(client, "roleUpdate");
  }

  async handle(oldRole, newRole) {
    const channel = await this.verificationChannelLog(
      newRole,
      "update_server_id",
      newRole.guild.id
    );
    if (typeof channel === "boolean") return;

    const statusLabel = (value) =>
      value ? this.translate`Oui` : this.translate`Non`;

    const sendDiffEmbed = (title, before, after) => {
      const embed = new EmbedBuilder()
        .setAuthor({ name: this.translate`Rôle ${newRole.name}` })
        .setDescription(`${title}`)
        .setFooter({ text: this.translate`Id du rôle : ${newRole.id}` })
        .setColor("#BAF60B")
        .addFields([
          { name: this.translate`Avant`, value: `${before}` },
          { name: this.translate`Après`, value: `${after}` },
        ]);

      channel.send({ embeds: [embed] }).catch(() => null);
    };

    if (oldRole.name !== newRole.name) {
      sendDiffEmbed(
        this.translate`**Nom modifié**`,
        `${oldRole.name}`,
        `${newRole.name}`
      );
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      sendDiffEmbed(
        this.translate`**Couleur modifiée**`,
        `${oldRole.hexColor || this.translate`Pas défini`}`,
        `${newRole.hexColor || this.translate`Pas défini`}`
      );
    }
    if (oldRole.mentionable !== newRole.mentionable) {
      sendDiffEmbed(
        this.translate`**Mention du rôle modifiée**`,
        `${statusLabel(oldRole.mentionable)}`,
        `${statusLabel(newRole.mentionable)}`
      );
    }
    if (oldRole.hoist !== newRole.hoist) {
      sendDiffEmbed(
        this.translate`**Hoist du rôle modifiée**`,
        `${statusLabel(oldRole.hoist)}`,
        `${statusLabel(newRole.hoist)}`
      );
    }
    if (oldRole.icon !== newRole.icon) {
      sendDiffEmbed(
        this.translate`**Icône du rôle modifiée**`,
        `${oldRole.icon || this.translate`Pas défini`}`,
        `${newRole.icon || this.translate`Pas défini`}`
      );
    }
    if (
      oldRole.permissions
        .toArray()
        .sort(function (a, b) {
          return a.localeCompare(b);
        })
        .join() !==
      newRole.permissions
        .toArray()
        .sort(function (a, b) {
          return a.localeCompare(b);
        })
        .join()
    ) {
      let oldPerms = [];
      let newPerms = [];

      oldRole.permissions.toArray().map((perm) => {
        if (!newRole.permissions.toArray().includes(perm)) oldPerms.push(perm);
      });

      newRole.permissions.toArray().map((perm) => {
        if (!oldRole.permissions.toArray().includes(perm)) newPerms.push(perm);
      });

      sendDiffEmbed(
        this.translate`**Permissions du rôle modifiées**`,
        `${
          oldPerms.length !== 0
            ? oldPerms.join(", ")
            : this.translate`Aucune permission enlevée`
        }`,
        `${
          newPerms.length !== 0
            ? newPerms.join(", ")
            : this.translate`Aucune permission ajoutée`
        }`
      );
    }
  }
};
