const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  TextInputBuilder,
  ModalBuilder,
} = require("discord.js");

module.exports = class FeedbackMenu {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.colors = event.colors;
    this.config = event.config;
    this.translate = event.translate.bind(event);
  }

  getResponse() {
    return {
      support: this.translate`Support du bot`,
      website: this.translate`Site web`,
      topgg: this.translate`Top.gg`,
      disboard: this.translate`Disboard`,
      other: this.translate`Autres`,
    };
  }

  async handle(inter) {
    if (!inter.isStringSelectMenu()) return;
    if (!inter.customId.includes("feedback")) return;

    /* Check if the user is an administrator */
    if (
      inter.user.id !== inter.guild.ownerId &&
      !inter.member.permissions.has("Administrator")
    )
      return inter.reply({
        content: this
          .translate`Seul un administrateur du serveur peut répondre à ce sondage.`,
        flags: 64,
      });

    /* Get the response */
    const guildId = inter.customId.split("_")[1];
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return;

    const response = inter.values[0];

    let question = null;
    if (response === "other") {
      const date = Date.now();
      const modal = new ModalBuilder()
        .setTitle(this.translate`Autres`)
        .setCustomId(`feedback_${date}`);

      const inputQuestion = new TextInputBuilder()
        .setCustomId(`question`)
        .setLabel(this.translate`Comment nous avez-vous connu ?`)
        .setStyle(2)
        .setMaxLength(45)
        .setRequired(true);

      const rowQuestion = new ActionRowBuilder().addComponents(inputQuestion);

      modal.addComponents(rowQuestion);

      inter.showModal(modal).catch(() => null);

      const filterModal = (modal) => modal.customId === `feedback_${date}`;
      const modalResponse = await inter.awaitModalSubmit({
        filter: filterModal,
        time: 10 * 60 * 1000,
      });

      if (modalResponse === undefined || modalResponse === null) return;
      await modalResponse.deferUpdate().catch(() => null);

      question = modalResponse.fields.getTextInputValue("question");
    } else {
      await inter.deferUpdate();
    }

    /* Edit the component */
    const actionRow = new ActionRowBuilder().addComponents(
      StringSelectMenuBuilder.from(
        inter.message.components[0].components[0]
      ).setDisabled(true)
    );

    await inter.message.edit({ components: [actionRow] }).catch(() => null);

    /* Insert the feedback */
    await this.database.table("feedback").insert({
      guildId: guild.id,
      userId: inter.user.id,
      choice: response,
      response: question,
    });

    /* Send a message on the support channel */
    const channel = this.client.channels.cache.get(
      this.config["system"]["feedbackChannelId"]
    );
    if (!channel) return;

    const descriptionLines = [
      this.translate`> **Serveur :** ${guild.name} (\`${guild.id}\`)`,
      this
        .translate`> **Propriétaire :** ${inter.user.username} (\`${inter.user.id}\`)`,
      `${this.translate`> **Réponse :** \`${this.getResponse()[response]}\``}${
        response === "other" && question ? this.translate` : ${question}` : ""
      }`,
    ];

    const embed = new EmbedBuilder()
      .setColor(this.colors.blue)
      .setAuthor({
        name: this.translate`Nouveau feedback`,
        iconURL:
          inter.user.displayAvatarURL() || this.client.user.displayAvatarURL(),
      })
      .setDescription(descriptionLines.join("\n"))
      .setFooter({
        text: `${this.client.user.displayName}`,
        iconURL: this.client.user.displayAvatarURL(),
      });

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
