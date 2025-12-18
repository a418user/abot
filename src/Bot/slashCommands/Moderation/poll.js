const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");

module.exports = class Poll extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "sondage",
      description: "Créer un sondag",
      options: [
        {
          name: "salon",
          description: "Salon où envoyer le sondage",
          type: 7,
          channel_types: [0, 5, 10, 11],
          required: true,
        },
        {
          name: "question",
          description: "Question du sondage",
          type: 3,
          required: true,
        },
        {
          name: "thumbnail",
          description: "Ajouter un thumbnail",
          type: 11,
          required: false,
        },
        {
          name: "mention",
          description: "Mentionner un rôle quand le sondage est envoyé",
          type: 8,
          required: false,
        },
        {
          name: "multiple",
          description: "Autoriser les réponses multiples",
          type: 5,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["MentionEveryone", "EmbedLinks"],
    });
  }

  async run(ctx) {
    const channel = ctx.options.getChannel("salon");
    const question = ctx.options.getString("question");
    const thumbnail =
      ctx.options.getAttachment("thumbnail") !== null
        ? ctx.options.getAttachment("thumbnail").contentType.includes("image")
          ? ctx.options.getAttachment("thumbnail").url
          : null
        : null;
    const mention = ctx.options.getRole("mention") || null;
    const isMultiple = ctx.options.getBoolean("multiple") || false;
    const emoteNumber = [
      "1️⃣",
      "2️⃣",
      "3️⃣",
      "4️⃣",
      "5️⃣",
      "6️⃣",
      "7️⃣",
      "8️⃣",
      "9️⃣",
      "🔟",
    ];

    let embedBeforeEdit = new EmbedBuilder()
      .setTitle(ctx.translate`Sondage`)
      .setDescription(
        question.length > 4096
          ? `**${question.slice(0, 4089)}** ...`
          : `**${question}**`
      )
      .setThumbnail(thumbnail || ctx.client.user.displayAvatarURL())
      .setColor(ctx.colors.blue)
      .setFooter({
        text: `${ctx.user.displayName}`,
        iconURL: `${ctx.user.displayAvatarURL()}`,
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`poll`)
      .setPlaceholder(ctx.translate`Choisir une action`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: ctx.translate`Valider`,
          value: `validate`,
          description: ctx.translate`Valider le sondage`,
          emoji: `${ctx.emojiSuccess}`,
        },
        {
          label: ctx.translate`Ajouter une option`,
          value: `add`,
          description: ctx.translate`Ajouter une option au sondage`,
          emoji: `⬆️`,
        },
        {
          label: ctx.translate`Supprimer une option`,
          value: `remove`,
          description: ctx.translate`Supprimer une option du sondage`,
          emoji: `⬇️`,
        },
        {
          label: ctx.translate`Annuler`,
          value: `cancel`,
          description: ctx.translate`Annuler le sondage`,
          emoji: `${ctx.emojiError}`,
        },
        {
          label: ctx.translate`Ne rien faire`,
          value: "nothing",
          emoji: "💤",
        },
      ]);

    const actionRow = new ActionRowBuilder().addComponents(menu);

    const msgEmbedForEditing = await ctx.send({
      embeds: [embedBeforeEdit],
      components: [actionRow],
    });
    const instructionText = ctx.translate`:pencil2: Modifier le titre
    :speech_balloon: Modifier la description
    :crown: Modifier l'auteur
    :arrow_down_small: Modifier le footer
    :white_square_button: Modifier le thumbnail
    :clock10: Ajouter un timestamp
    :camera: Modifier l'image
    :globe_with_meridians: Modifier l'url
    :blue_circle: Modifier la couleur
    :arrow_left: Supprimer un field
    :arrow_right: Ajouter un field
    :white_check_mark: Envoyer l'embed`;
    const msgAwait = await ctx.send({
      content: instructionText,
      components: [buttonRow1, buttonRow2, buttonRow3],
    });

    const filter = (menu) => menu.user.id === ctx.user.id;
    const collector = msgEmbedForEditing.createMessageComponentCollector({
      filter,
      idle: 10 * 60 * 1000,
      componentType: 3,
    });

    collector.on("collect", async (menu) => {
      const choice = menu.values[0];

      if (choice === "validate") {
        await menu.deferUpdate();

        const embed = new EmbedBuilder()
          .setDescription(
            ctx.translate`:information_source: **Êtes-vous sur de vouloir envoyer le sondage dans le salon ${channel} ?**`
          )
          .setColor(ctx.colors.blue);

        const msgConfirm = await menu.followUp({
          embeds: [embed],
          components: ctx.messageFormatter.question(
            `yes`,
            `${ctx.emojiSuccess}`,
            `no`,
            `${ctx.emojiError}`
          ),
        });

        const collectorConfirmReset =
          msgConfirm.createMessageComponentCollector({
            filter,
            max: 1,
            time: 5 * 60 * 1000,
          });
        collectorConfirmReset.on("collect", async (buttonConfirm) => {
          await buttonConfirm.deferUpdate();
          collectorConfirmReset.stop();
          msgConfirm.delete().catch(() => null);

          if (buttonConfirm.customId === "no") return;
          if (
            embedBeforeEdit.data.fields === undefined ||
            embedBeforeEdit.data.fields.length === 0
          )
            return menu.followUp({
              content: `${
                ctx.emojiError
              } ${ctx.translate`Vous devez au moins ajouter 1 option !`}`,
              flags: 64,
            });

          const actionRow1 = new ActionRowBuilder();
          const actionRow2 = new ActionRowBuilder();
          const jsonVote = {};
          for (let i = 1; i <= embedBeforeEdit.data.fields.length; i++) {
            jsonVote[i] = {
              vote: 0,
              users: [],
            };

            if (i <= 5) {
              actionRow1.addComponents(
                new ButtonBuilder()
                  .setCustomId(`poll_${i}`)
                  .setStyle(2)
                  .setEmoji(emoteNumber[i - 1])
              );
            } else {
              actionRow2.addComponents(
                new ButtonBuilder()
                  .setCustomId(`poll_${i}`)
                  .setStyle(2)
                  .setEmoji(emoteNumber[i - 1])
              );
            }
          }

          const actionRow3 =
            actionRow2.components.length !== 0
              ? [actionRow1, actionRow2]
              : [actionRow1];

          const msgPoll = await channel.send({
            content: mention !== null ? `${mention}` : null,
            embeds: [embedBeforeEdit],
            components: actionRow3,
          });

          msgEmbedForEditing.delete().catch(() => null);
          collector.stop();

          await ctx.database.table("poll_number").insert({
            guild_id: ctx.guild.id,
            channel_id: channel.id,
            message_id: msgPoll.id,
            isMultiple: isMultiple,
            vote: JSON.stringify(jsonVote),
          });
        });

        collectorConfirmReset.on("end", (_, reason) => {
          if (reason === "time") {
            msgConfirm.delete().catch(() => null);
          }
        });
      } else if (choice === "cancel") {
        await menu.deferUpdate();
        msgEmbedForEditing.edit({ components: [] }).catch(() => null);
        collector.stop();
      } else if (choice === "nothing") {
        await menu.deferUpdate();
      } else if (choice === "add") {
        if (
          embedBeforeEdit.data.fields !== undefined &&
          embedBeforeEdit.data.fields.length >= 10
        ) {
          await menu.deferUpdate();
          return menu.followUp({
            content: `${
              ctx.emojiError
            } ${ctx.translate`Vous avez atteint la limite de 10 options !`}`,
            flags: 64,
          });
        }

        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_add_field_${date}`)
          .setTitle(ctx.translate`Option`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_add_field_name")
          .setStyle(2)
          .setLabel(ctx.translate`Quelle est l'option`)
          .setRequired(true)
          .setMaxLength(255);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        menu.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_add_field_${date}`;
        ctx.inter
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const name = modal.fields.getTextInputValue("modal_add_field_name");

            embedBeforeEdit.addFields([
              {
                name: `${
                  emoteNumber[
                    embedBeforeEdit.data.fields !== undefined
                      ? embedBeforeEdit.data.fields.length
                      : 0
                  ]
                } ${name}`,
                value: `${ctx.utils.progressBarPoll(0, 10, 10)} (0)`,
              },
            ]);

            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (choice === "remove") {
        await menu.deferUpdate();

        if (
          embedBeforeEdit.data.fields === undefined ||
          embedBeforeEdit.data.fields.length === 0
        )
          return menu.followUp({
            content: `${
              ctx.emojiError
            } ${ctx.translate`Il n'y a pas d'options à supprimer !`}`,
            flags: 64,
          });

        const displayEmbed = new EmbedBuilder()
          .setDescription(
            ctx.translate`**Quelle option souhaitez-vous supprimer ?**`
          )
          .setColor(ctx.colors.blue);

        const fields = [];
        embedBeforeEdit.data.fields.forEach((field) => {
          fields.push({
            name: field.name,
            id: embedBeforeEdit.data.fields.indexOf(field),
          });
        });

        const menuRemoveField = new StringSelectMenuBuilder()
          .setCustomId(`poll_remove`)
          .setPlaceholder(ctx.translate`Choisir une option`)
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: ctx.translate`Annuler`,
              value: `cancel_field`,
              description: ctx.translate`Annuler la suppression`,
              emoji: `${ctx.emojiError}`,
            },
          ]);

        for (const row of fields) {
          menuRemoveField.addOptions([
            {
              label: `${
                row.name.length > 100
                  ? row.name.substring(0, 97) + "..."
                  : row.name
              }`,
              value: `${row.id}`,
              emoji: "📌",
            },
          ]);
        }

        const actionRowRemove = new ActionRowBuilder().addComponents(
          menuRemoveField
        );

        const msgSend = await menu.channel.send({
          embeds: [displayEmbed],
          components: [actionRowRemove],
        });
        const collectorSendMenu = msgSend.createMessageComponentCollector({
          filter,
          time: 5 * 60 * 1000,
          componentType: 3,
        });

        collectorSendMenu.on("collect", async (menuSend) => {
          await menuSend.deferUpdate();
          collectorSendMenu.stop();
          const choice = menuSend.values[0];
          msgSend.delete().catch(() => null);

          if (choice !== "cancel_field") {
            const field = embedBeforeEdit.data.fields[choice].name;

            const embed = new EmbedBuilder()
              .setDescription(
                ctx.translate`:information_source: **Êtes-vous sur de vouloir supprimer l'option ${field} ?**`
              )
              .setColor(ctx.colors.blue);

            const msgConfirm = await menuSend.channel.send({
              embeds: [embed],
              components: ctx.messageFormatter.question(
                `yes`,
                `${ctx.emojiSuccess}`,
                `no`,
                `${ctx.emojiError}`
              ),
            });

            const collectorConfirmReset =
              msgConfirm.createMessageComponentCollector({
                filter,
                max: 1,
                time: 5 * 60 * 1000,
              });
            collectorConfirmReset.on("collect", async (buttonConfirm) => {
              await buttonConfirm.deferUpdate();
              collectorConfirmReset.stop();
              msgConfirm.delete().catch(() => null);

              if (buttonConfirm.customId === "no") return;
              embedBeforeEdit.data.fields.splice(choice, 1);
              await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
            });

            collectorConfirmReset.on("end", async (collected, reason) => {
              if (reason === "time") {
                msgConfirm.delete().catch(() => null);
              }
            });
          }
        });

        collectorSendMenu.on("end", async (collected, reason) => {
          if (reason === "time") {
            msgSend.delete().catch(() => null);
          }
        });
      }
    });
  }
};
