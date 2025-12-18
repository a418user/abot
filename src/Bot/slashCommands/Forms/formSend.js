const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = class FormSend extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid",
      description: "Répondre à un formulaire de candidature",
      category: SlashCommand.Categories.Forms,
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    let baseGuildForm = await ctx.database
      .table("guild_form")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!baseGuildForm[0])
      return ctx.error(
        ctx.translate`Il n'y a aucun formulaire de candidature sur ce serveur !`
      );

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Formulaire de candidature`)
      .setDescription(
        ctx.translate`Veuillez choisir quel formulaire vous souhaitez remplir.`
      )
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    const embedQuestion = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    // Keep only forms where user have access
    for (const form of baseGuildForm) {
      if (!ctx.member.roles.cache.has(form.role_access_id)) {
        baseGuildForm.splice(baseGuildForm.indexOf(form), 1);
      }
    }

    if (!baseGuildForm[0])
      return ctx.error(
        ctx.translate`Vous n'avez accès à aucun formulaire de candidature !`
      );

    const buttonFinish = new ButtonBuilder()
      .setCustomId("formFinish")
      .setLabel(ctx.translate`Terminer`)
      .setStyle(3)
      .setEmoji(`${ctx.emojiSuccess}`);

    const buttonCancel = new ButtonBuilder()
      .setCustomId("formCancel")
      .setLabel(ctx.translate`Annuler`)
      .setStyle(4)
      .setEmoji(`${ctx.emojiError}`);

    const actionRowButton = new ActionRowBuilder()
      .addComponents(buttonFinish)
      .addComponents(buttonCancel);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("formSelect")
      .setPlaceholder(ctx.translate`Choisir un formulaire`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        baseGuildForm.map((form) => {
          return {
            label: form.form_name,
            value: String(form.id),
          };
        })
      );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await ctx.send({
      embeds: [embed],
      components: [actionRow],
      flags: 64,
    });

    let data = [];
    let formId = null;

    const collectorMenu = msg.createMessageComponentCollector({
      idle: 45 * 60 * 1000,
      componentType: 3,
    });
    const collectorButton = msg.createMessageComponentCollector({
      idle: 45 * 60 * 1000,
      componentType: 2,
    });

    collectorMenu.on("collect", async (menu) => {
      if (menu.customId === "formSelect") {
        await menu.deferUpdate();
        formId = Number(menu.values[0]);

        // Verify if the form exists
        const form = baseGuildForm.find((form) => form.id === formId);
        if (!form)
          return menu.followUp({
            content: ctx.translate`Ce formulaire n'existe pas !`,
            flags: 64,
          });

        // Get the form questions
        const formQuestions = JSON.parse(form.questions);

        for (const question of formQuestions) {
          data.push({
            question: question,
            answer: null,
          });
        }

        embedQuestion
          .setTitle(
            ctx.translate`Formulaire de candidature : ${form.form_name}`
          )
          .setDescription(
            ctx.translate`Veuillez répondre aux questions suivantes :\n${data
              .map(
                (question) =>
                  `- **${question.question}**\n - ${
                    question.answer !== null
                      ? question.answer
                      : ctx.translate`\`Aucune réponse\``
                  }`
              )
              .join("\n")}`
          );

        const selectMenuQuestion = new StringSelectMenuBuilder()
          .setCustomId("formSelectQuestion")
          .setPlaceholder(ctx.translate`Choisir une question`)
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            data.map((question, index) => {
              return {
                label: question.question,
                value: String(index),
              };
            })
          );

        const actionRowQuestion = new ActionRowBuilder().addComponents(
          selectMenuQuestion
        );

        return menu
          .editReply({
            embeds: [embedQuestion],
            components: [actionRowButton, actionRowQuestion],
          })
          .catch(() => null);
      } else if (menu.customId === "formSelectQuestion") {
        const questionId = menu.values[0];

        // Verify if the question exists
        if (!data[questionId])
          return menu.followUp({
            content: ctx.translate`Cette question n'existe pas !`,
            flags: 64,
          });

        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`formAnswer_${date}`)
          .setTitle(ctx.translate`Question n°${Number(questionId) + 1}`);

        const textInput = new TextInputBuilder()
          .setCustomId("formAnswer")
          .setLabel(data[questionId].question)
          .setPlaceholder(ctx.translate`Réponse`)
          .setStyle(2)
          .setMinLength(1)
          .setMaxLength(350)
          .setRequired(true);

        const actionRowModal = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRowModal);

        menu.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `formAnswer_${date}`;
        menu
          .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            // Add the answer to the data
            data[questionId].answer =
              modal.fields.getTextInputValue("formAnswer");

            // Update the embed
            embedQuestion.setDescription(
              ctx.translate`Veuillez répondre aux questions suivantes :\n${data
                .map(
                  (question) =>
                    `- **${question.question}**\n - ${
                      question.answer !== null
                        ? question.answer
                        : ctx.translate`\`Aucune réponse\``
                    }`
                )
                .join("\n")}`
            );

            menu
              .editReply({
                embeds: [embedQuestion],
                components: [...menu.message.components],
              })
              .catch(() => null);
          });
      }
    });

    collectorButton.on("collect", async (button) => {
      await button.deferUpdate();
      if (button.customId === "formFinish") {
        // Verify if the user has answered all the questions
        if (data.some((question) => question.answer === null))
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Vous devez répondre à toutes les questions !`,
            flags: 64,
          });

        // Send the answers to the channel
        const form = baseGuildForm.find((form) => form.id === formId);
        const channel = ctx.guild.channels.cache.get(form.channel_id);
        if (!channel)
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Le salon de réponse n'existe pas !`,
            flags: 64,
          });
        if (!channel.viewable)
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Je n'ai pas la permission de voir le salon de réponse !`,
            flags: 64,
          });

        const embedConfirm = new EmbedBuilder()
          .setDescription(
            ctx.translate`**Êtes-vous sur de vouloir envoyer ce formulaire ?**`
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
          flags: 64,
        });

        const collectorConfirm = msgConfirm.createMessageComponentCollector({
          max: 1,
          idle: 5 * 60 * 1000,
        });

        collectorConfirm.on("collect", async (buttonConfirm) => {
          await buttonConfirm.deferUpdate();
          collectorConfirm.stop();
          buttonConfirm.deleteReply().catch(() => null);

          if (buttonConfirm.customId === "no") return;

          collectorMenu.stop();
          collectorButton.stop();

          channel
            .send({
              content: ctx.translate`**Formulaire de candidature :** ${form.form_name}\n**Membre :** ${ctx.user} (\`${ctx.user.id}\`)`,
              embeds: [embedQuestion],
            })
            .catch(() => null);

          return button
            .editReply({
              content: ctx.translate`${ctx.emojiSuccess} Votre candidature a bien été envoyée !`,
              embeds: [],
              components: [],
            })
            .catch(() => null);
        });

        collectorConfirm.on("end", (collected, reason) => {
          if (reason === "idle") return msgConfirm.delete().catch(() => null);
        });
      } else if (button.customId === "formCancel") {
        collectorMenu.stop();
        collectorButton.stop();

        return msg.edit({ components: [] }).catch(() => null);
      }
    });

    collectorMenu.on("end", async (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
