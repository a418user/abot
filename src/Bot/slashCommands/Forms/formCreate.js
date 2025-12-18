const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

module.exports = class FormCreate extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid-créer",
      description: "Créer un nouveau formulaire de candidature",
      options: [
        {
          name: "nom",
          description: "Nom du formulaire",
          type: 3,
          max_length: 30,
          required: true,
        },
        {
          name: "salon",
          description: "Salon où le formulaire sera envoyé",
          type: 7,
          channel_types: [0],
          required: true,
        },
      ],
      category: SlashCommand.Categories.Forms,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    const baseGuildForm = await ctx.database
      .table("guild_form")
      .select("guild_id")
      .where("guild_id", ctx.guild.id);
    if (baseGuildForm.length >= 10)
      return ctx.error(
        ctx.translate`Vous avez atteint le nombre maximum de formulaire par serveur ! (10)`
      );

    const formName = ctx.options.getString("nom");
    const formChannel = ctx.options.getChannel("salon");
    let formDescription = null;

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Création du formulaire ${formName}`)
      .setColor(ctx.colors.blue)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .setDescription(
        ctx.translate`Votre formulaire ne possède aucune question pour le moment.`
      );

    const buttonDescription = new ButtonBuilder()
      .setCustomId("description")
      .setLabel(ctx.translate`Modifier la description`)
      .setStyle(1)
      .setEmoji("📝");

    const buttonAddQuestion = new ButtonBuilder()
      .setCustomId("addQuestion")
      .setLabel(ctx.translate`Ajouter une question`)
      .setStyle(1)
      .setEmoji("➕");

    const buttonRemoveQuestion = new ButtonBuilder()
      .setCustomId("removeQuestion")
      .setLabel(ctx.translate`Supprimer une question`)
      .setDisabled(true)
      .setStyle(2)
      .setEmoji("➖");

    const buttonFinish = new ButtonBuilder()
      .setCustomId("finish")
      .setLabel(ctx.translate`Terminer`)
      .setStyle(3)
      .setEmoji(`${ctx.emojiSuccess}`);

    const buttonCancel = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel(ctx.translate`Annuler`)
      .setStyle(4)
      .setEmoji(`${ctx.emojiError}`);

    let row = new ActionRowBuilder()
      .addComponents(buttonDescription)
      .addComponents(buttonAddQuestion)
      .addComponents(buttonRemoveQuestion);

    const row2 = new ActionRowBuilder()
      .addComponents(buttonFinish)
      .addComponents(buttonCancel);

    const msg = await ctx.send({ embeds: [embed], components: [row, row2] });

    const filter = (interaction) => interaction.user.id === ctx.user.id;
    const collectorButton = msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
      componentType: 2,
    });

    const questions = [];

    collectorButton.on("collect", async (button) => {
      if (button.customId === "description") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setTitle(ctx.translate`Ajouter une description`)
          .setCustomId(`description${date}`);

        const inputQuestion = new TextInputBuilder()
          .setCustomId(`description`)
          .setLabel(ctx.translate`Quelle est votre description ?`)
          .setStyle(2)
          .setMaxLength(500)
          .setRequired(true);

        const rowQuestion = new ActionRowBuilder().addComponents(inputQuestion);

        modal.addComponents(rowQuestion);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `description${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            formDescription = modal.fields.getTextInputValue("description");

            return modal.followUp({
              content: ctx.translate`La description a bien été ajoutée :\n> ${formDescription}`,
              flags: 64,
            });
          });
      } else if (button.customId === "addQuestion") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setTitle(ctx.translate`Ajouter une question`)
          .setCustomId(`addQuestion_${date}`);

        const inputQuestion = new TextInputBuilder()
          .setCustomId(`question`)
          .setLabel(ctx.translate`Quelle est votre question ?`)
          .setStyle(2)
          .setMaxLength(40)
          .setRequired(true);

        const rowQuestion = new ActionRowBuilder().addComponents(inputQuestion);

        modal.addComponents(rowQuestion);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `addQuestion_${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const question = modal.fields.getTextInputValue("question");

            // Add the question to the array
            questions.push(question);

            // Enable the remove button
            buttonRemoveQuestion.setDisabled(false);

            // Verify if we reach the maximum of question
            if (questions.length >= 10) {
              buttonAddQuestion.setDisabled(true);
            }

            row = new ActionRowBuilder()
              .addComponents(buttonDescription)
              .addComponents(buttonAddQuestion)
              .addComponents(buttonRemoveQuestion);

            embed.setDescription(
              questions
                .map((question, index) => `**\`${index + 1}.\`** ${question}`)
                .join("\n")
            );

            button.message
              .edit({ embeds: [embed], components: [row, row2] })
              .catch(() => null);
          });
      } else if (button.customId === "removeQuestion") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setTitle(ctx.translate`Supprimer une question`)
          .setCustomId(`removeQuestion_${date}`);

        const inputNumber = new TextInputBuilder()
          .setCustomId(`number`)
          .setLabel(ctx.translate`Quelle est le numéro de la question ?`)
          .setStyle(1)
          .setRequired(true);

        const rowNumber = new ActionRowBuilder().addComponents(inputNumber);

        modal.addComponents(rowNumber);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `removeQuestion_${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const number = Number(modal.fields.getTextInputValue("number"));

            // Verify if the number is a number
            if (isNaN(number) || typeof number !== "number") {
              return modal.followUp({
                content: ctx.translate`${ctx.emojiError} Le numéro de la question doit être un nombre entier !`,
                flags: 64,
              });
            }

            // Verify if this question exist
            if (!questions[number - 1]) {
              return modal.followUp({
                content: ctx.translate`${ctx.emojiError} Cette question n'existe pas !`,
                flags: 64,
              });
            }

            // Remove the question
            questions.splice(number - 1, 1);

            // Verify if there is at least one question
            if (questions.length === 0) {
              buttonRemoveQuestion.setDisabled(true);
            }

            // Enable the add button
            buttonAddQuestion.setDisabled(false);

            row = new ActionRowBuilder()
              .addComponents(buttonDescription)
              .addComponents(buttonAddQuestion)
              .addComponents(buttonRemoveQuestion);

            if (questions.length > 0) {
              embed.setDescription(
                questions
                  .map((question, index) => `**\`${index + 1}.\`** ${question}`)
                  .join("\n")
              );
            } else {
              embed.setDescription(
                ctx.translate`Votre formulaire ne possède aucune question pour le moment.`
              );
            }

            button.message
              .edit({ embeds: [embed], components: [row, row2] })
              .catch(() => null);
          });
      } else if (button.customId === "finish") {
        await button.deferUpdate();

        // Verify if there is at least one question
        if (questions.length === 0) {
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Votre formulaire ne possède aucune question !`,
            flags: 64,
          });
        }

        // Verify if there is a description
        if (!formDescription) {
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Votre formulaire ne possède aucune description !`,
            flags: 64,
          });
        }

        const embedConfirm = new EmbedBuilder()
          .setDescription(
            ctx.translate`**Êtes-vous sur de vouloir finaliser ce formulaire ?**`
          )
          .setColor(ctx.colors.blue);

        const msgConfirm = await button.followUp({
          embeds: [embedConfirm],
          components: ctx.messageFormatter.question(
            `yes`,
            `${ctx.emojiSuccess}`,
            `no`,
            `${ctx.emojiError}`
          ),
        });

        const collectorConfirm = msgConfirm.createMessageComponentCollector({
          filter,
          max: 1,
          idle: 5 * 60 * 1000,
        });

        collectorConfirm.on("collect", async (buttonConfirm) => {
          await buttonConfirm.deferUpdate();
          collectorConfirm.stop();
          msgConfirm.delete().catch(() => null);

          if (buttonConfirm.customId === "no") return;

          collectorButton.stop();

          // Add to the database the form
          await ctx.database.table("guild_form").insert({
            guild_id: ctx.guild.id,
            form_name: formName,
            form_description: formDescription,
            channel_id: formChannel.id,
            questions: JSON.stringify(questions),
          });

          // Send the message
          await button.followUp({
            content: ctx.translate`${ctx.emojiSuccess} Votre formulaire a bien été créé !`,
            flags: 64,
          });

          // Edit the components
          return msg.edit({ components: [] }).catch(() => null);
        });

        collectorConfirm.on("end", (collected, reason) => {
          if (reason === "idle") return msgConfirm.delete().catch(() => null);
        });
      } else if (button.customId === "cancel") {
        await button.deferUpdate();

        collectorButton.stop();
        return msg.edit({ components: [] }).catch(() => null);
      }
    });

    collectorButton.on("end", async (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
