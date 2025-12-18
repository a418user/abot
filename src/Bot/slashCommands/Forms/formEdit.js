const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ChannelSelectMenuBuilder,
} = require("discord.js");

module.exports = class FormEdit extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid-modifier",
      description: "Modifier un formulaire de candidature",
      options: [
        {
          name: "id",
          description: "L'id du formulaire de candidature",
          type: 4,
          required: true,
          min_value: 1,
        },
      ],
      category: SlashCommand.Categories.Forms,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    const id = ctx.options.getInteger("id");
    const baseGuildForm = await ctx.database
      .table("guild_form")
      .select()
      .where({ guild_id: ctx.guild.id, id });
    if (!baseGuildForm[0])
      return ctx.send({
        content: ctx.translate`${ctx.emojiError} Ce formulaire n'existe pas !`,
        flags: 64,
      });

    let formName = baseGuildForm[0].form_name;
    let formChannel = ctx.getChannel(baseGuildForm[0].channel_id)
      ? ctx.getChannel(baseGuildForm[0].channel_id)
      : null;
    let formDescription = baseGuildForm[0].form_description;
    const questions = JSON.parse(baseGuildForm[0].questions) || [];

    const embed = new EmbedBuilder()
      .setTitle(
        ctx.translate`Création du formulaire ${formName} dans le salon ${
          formChannel ? formChannel.toString() : "`Non défini`"
        }`
      )
      .setColor(ctx.colors.blue)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .setDescription(
        questions
          .map((question, index) => `**\`${index + 1}.\`** ${question}`)
          .join("\n")
      );

    const buttonChannel = new ButtonBuilder()
      .setCustomId("channel")
      .setLabel(ctx.translate`Modifier le salon`)
      .setStyle(1)
      .setEmoji("⚙️");

    const buttonName = new ButtonBuilder()
      .setCustomId("name")
      .setLabel(ctx.translate`Modifier le nom`)
      .setStyle(1)
      .setEmoji("✏️");

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
      .setDisabled(false)
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
      .addComponents(buttonChannel)
      .addComponents(buttonName)
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

    collectorButton.on("collect", async (button) => {
      if (button.customId === "name") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setTitle(ctx.translate`Modifier le nom`)
          .setCustomId(`name${date}`);

        const inputName = new TextInputBuilder()
          .setCustomId(`name`)
          .setLabel(ctx.translate`Quelle est le nom ?`)
          .setStyle(2)
          .setMaxLength(40)
          .setRequired(true);

        if (formName) inputName.setValue(formName);

        const rowName = new ActionRowBuilder().addComponents(inputName);

        modal.addComponents(rowName);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `name${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            formName = modal.fields.getTextInputValue("name");

            embed.setTitle(
              ctx.translate`Création du formulaire ${formName} dans le salon ${
                formChannel ? formChannel.toString() : "`Non défini`"
              }`
            );

            await button.message
              .edit({ embeds: [embed], components: [row, row2] })
              .catch(() => null);

            return modal.followUp({
              content: ctx.translate`Le nom a bien été modifié :\n> ${formName}`,
              flags: 64,
            });
          });
      } else if (button.customId === "description") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setTitle(ctx.translate`Modifier la description`)
          .setCustomId(`description${date}`);

        const inputQuestion = new TextInputBuilder()
          .setCustomId(`description`)
          .setLabel(ctx.translate`Quelle est votre description ?`)
          .setStyle(2)
          .setMaxLength(500)
          .setRequired(true);

        if (formDescription) inputQuestion.setValue(formDescription);

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
              content: ctx.translate`La description a bien été modifiée :\n> ${formDescription}`,
              flags: 64,
            });
          });
      } else if (button.customId === "channel") {
        await button.deferUpdate();

        const displayEmbed = new EmbedBuilder()
          .setDescription(
            ctx.translate`Veuillez sélectionner le salon où le formulaire sera envoyé.`
          )
          .setColor(ctx.colors.blue);

        const channelSelectMenu = new ChannelSelectMenuBuilder()
          .setCustomId("channel")
          .setPlaceholder(ctx.translate`Sélectionner un salon`)
          .addChannelTypes(0)
          .setMinValues(1)
          .setMaxValues(1);

        if (formChannel) channelSelectMenu.addDefaultChannels(formChannel.id);

        const actionRow = new ActionRowBuilder().addComponents(
          channelSelectMenu
        );

        await button.message.edit({
          embeds: [displayEmbed],
          components: [actionRow],
        });

        const collectorCategoryMenu = msg.createMessageComponentCollector({
          filter,
          max: 1,
          idle: 5 * 60 * 1000,
          componentType: 8,
        });

        collectorCategoryMenu.on("collect", async (menuChannel) => {
          await menuChannel.deferUpdate();
          collectorCategoryMenu.stop();
          const choice = menuChannel.values[0];

          formChannel = ctx.getChannel(choice);

          embed.setTitle(
            ctx.translate`Création du formulaire ${formName} dans le salon ${
              formChannel ? formChannel.toString() : "`Non défini`"
            }`
          );

          return button.message.edit({
            embeds: [embed],
            components: [row, row2],
          }); //.catch(() => null);
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
          await ctx.database
            .table("guild_form")
            .update({
              form_name: formName,
              form_description: formDescription,
              channel_id: formChannel.id,
              questions: JSON.stringify(questions),
            })
            .where({ guild_id: ctx.guild.id, id });

          // Send the message
          await button.followUp({
            content: ctx.translate`${ctx.emojiSuccess} Votre formulaire a bien été modifié !`,
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
