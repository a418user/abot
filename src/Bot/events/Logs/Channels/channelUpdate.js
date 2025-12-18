const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class ChannelUpdate extends Events {
  constructor(client) {
    super(client, "channelUpdate");
  }

  async handle(oldChannel, newChannel) {
    if (newChannel.type === 1) return;

    const channelSend = await this.verificationChannelLog(
      newChannel,
      "update_server_id",
      newChannel.guild.id
    );
    if (typeof channelSend === "boolean") return;

    const channelTypeLabels = {
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

    const getChannelType = (type) =>
      channelTypeLabels[type] || this.translate`Inconnu`;

    const sendDiffEmbed = (title, beforeValue, afterValue) => {
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${this.translate`Salon`} ${newChannel.name}` })
        .setDescription(title)
        .setFooter({ text: this.translate`CId : ${newChannel.id}` })
        .setColor("#BAF60B")
        .addFields([
          {
            name: this.translate`Type`,
            value: `${getChannelType(oldChannel.type)}`,
          },
          { name: this.translate`Avant`, value: `${beforeValue}` },
          { name: this.translate`Après`, value: `${afterValue}` },
        ]);

      channelSend.send({ embeds: [embed] }).catch(() => null);
    };

    if (oldChannel.name !== newChannel.name) {
      sendDiffEmbed(
        this.translate`**Nom modifié**`,
        `${oldChannel.name}`,
        `${newChannel.name}`
      );
    }
    if (oldChannel.topic !== newChannel.topic) {
      sendDiffEmbed(
        this.translate`**Description modifiée**`,
        `${oldChannel.topic || this.translate`Aucune`}`,
        `${newChannel.topic || this.translate`Aucune`}`
      );
    }
    if (oldChannel?.parent?.name !== newChannel?.parent?.name) {
      sendDiffEmbed(
        this.translate`**Catégorie modifiée**`,
        `${oldChannel?.parent?.name || this.translate`Aucune`}`,
        `${newChannel?.parent?.name || this.translate`Aucune`}`
      );
    }

    if (
      oldChannel.type === 0 ||
      oldChannel.type === 5 ||
      oldChannel.type === 15
    ) {
      if (oldChannel.nsfw !== newChannel.nsfw) {
        sendDiffEmbed(
          this.translate`**NSFW modifié**`,
          `${oldChannel.nsfw ? this.translate`Oui` : this.translate`Non`}`,
          `${newChannel.nsfw ? this.translate`Oui` : this.translate`Non`}`
        );
      }
      if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        sendDiffEmbed(
          this.translate`**Mode lent modifié**`,
          `${oldChannel.rateLimitPerUser ?? this.translate`Pas défini`}`,
          `${newChannel.rateLimitPerUser ?? this.translate`Pas défini`}`
        );
      }
      if (oldChannel.type !== newChannel.type) {
        sendDiffEmbed(
          this.translate`**Type modifié**`,
          `${getChannelType(oldChannel.type)}`,
          `${getChannelType(newChannel.type)}`
        );
      }
    } else if (oldChannel.type === 2) {
      if (oldChannel.userLimit !== newChannel.userLimit) {
        sendDiffEmbed(
          this.translate`**Limite de membres modifiée**`,
          `${oldChannel.userLimit}`,
          `${newChannel.userLimit}`
        );
      }
      if (oldChannel.bitrate !== newChannel.bitrate) {
        sendDiffEmbed(
          this.translate`**Bitrate modifié**`,
          `${oldChannel.bitrate}`,
          `${newChannel.bitrate}`
        );
      }
      if (oldChannel.videoQualityMode !== newChannel.videoQualityMode) {
        sendDiffEmbed(
          this.translate`**Qualité vidéo modifiée**`,
          `${oldChannel.videoQualityMode || this.translate`Automatique`}`,
          `${newChannel.videoQualityMode || this.translate`Automatique`}`
        );
      }
    }
  }
};
