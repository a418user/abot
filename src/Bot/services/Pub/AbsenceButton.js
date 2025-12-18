const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = class AbsenceButton {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
    this.event = event;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    if (
      inter.customId !== "absence_on" &&
      inter.customId !== "absence_off" &&
      inter.customId !== "absence_mention"
    )
      return;

    const base = await this.database.table("guild_afk").select().where({
      member_id: inter.user.id,
      guild_id: inter.guild.id,
    });

    if (inter.customId === "absence_on") {
      if (base[0]) {
        return inter.reply({
          content: this
            .translate`${this.client.emojiError} Vous êtes déjà absent !\nRaison : ${base[0].reason}`,
          flags: 64,
        });
      }

      const dateModal = Date.now();
      const modal = new ModalBuilder()
        .setCustomId(`modal_absence__request_${dateModal}`)
        .setTitle(this.translate`Nouvelle absence`);

      const textInput = new TextInputBuilder()
        .setCustomId("modal_reason")
        .setStyle(2)
        .setMinLength(10)
        .setMaxLength(1000)
        .setLabel(this.translate`Quelle est la raison de votre absence ?`)
        .setRequired(true);

      const textInput2 = new TextInputBuilder()
        .setCustomId("modal_time")
        .setStyle(1)
        .setLabel(this.translate`Quelle est la durée de votre absence ?`)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(textInput);
      const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

      modal.addComponents([actionRow2]).addComponents([actionRow]);

      inter.showModal(modal).catch(() => {});

      const filter = (modal) =>
        modal.customId === `modal_absence__request_${dateModal}`;
      inter
        .awaitModalSubmit({ filter, time: 5 * 60 * 1000 })
        .catch(() => {})
        .then(async (modal) => {
          if (!modal) return;
          await modal.deferUpdate().catch(() => null);

          const reason = modal.fields.getTextInputValue("modal_reason");
          const time = modal.fields.getTextInputValue("modal_time");

          await inter.followUp({
            content: this
              .translate`${this.client.emojiSuccess} Vous êtes maintenant absent pour une durée de **${time}**, avec la raison suivante : ${reason}`,
            flags: 64,
          });

          const embed = new EmbedBuilder()
            .setTitle(this.translate`Nouvelle absence`)
            .setDescription(
              this
                .translate`**Membre :** ${inter.member} ${inter.member.displayName} (\`${inter.member.id}\`)
** Durée : ** ${time}
**Raison :** ${reason}`
            )
            .setColor(this.event.colors.blue)
            .setThumbnail(
              inter.user.displayAvatarURL() ||
                inter.client.user.displayAvatarURL()
            )
            .setFooter({
              text: inter.guild.name,
              iconURL:
                inter.guild.iconURL() || inter.client.user.displayAvatarURL(),
            });

          const message = await inter.channel.send({ embeds: [embed] });

          await this.database.table("guild_afk").insert({
            guild_id: inter.guild.id,
            member_id: inter.user.id,
            message_id: message ? message.id : null,
            reason,
          });
        });
    } else if (inter.customId === "absence_off") {
      await inter.deferUpdate();

      if (!base[0]) {
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'êtes pas absent !`,
          flags: 64,
        });
      }

      await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} Vous n'êtes désormais plus absent !`,
        flags: 64,
      });

      const message = await inter.channel.messages
        .fetch(base[0].message_id)
        .catch(() => null);
      if (message) message.delete().catch(() => null);

      await this.database.table("guild_afk").delete().where({
        guild_id: inter.guild.id,
        member_id: inter.user.id,
      });
    } else if (inter.customId === "absence_mention") {
      await inter.deferUpdate();

      if (!base[0]) {
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'êtes pas absent !`,
          flags: 64,
        });
      }

      await this.database
        .table("guild_afk")
        .update({
          inPause: !base[0].inPause,
        })
        .where({
          guild_id: inter.guild.id,
          member_id: inter.user.id,
        });

      await inter.followUp({
        content: this.translate`${
          this.client.emojiSuccess
        } Vous êtes désormais ${
          base[0].inPause
            ? this.translate`mentionnable`
            : this.translate`non mentionnable`
        } !`,
        flags: 64,
      });
    }
  }
};
