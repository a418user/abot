const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = class Rules extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "règles",
      description: "Gérer le système de règles",
      options: [
        {
          name: "configurer",
          description: "Configurer le système de règles",
          type: 1,
          options: [
            {
              name: "rôle",
              description: "Le rôle à ajouter",
              type: 8,
              required: true,
            },
            {
              name: "embed",
              description: "Modifier le règlement",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le système de règles",
          type: 1,
        },
        {
          name: "envoyer",
          description: "Envoyer le règlement",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Le salon où envoyer le règlement",
              type: 7,
              channel_types: [0, 5],
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_rules")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const role = ctx.options.getRole("rôle");
      const embed = ctx.options.getBoolean("embed");

      if (role.position >= ctx.me.roles.highest.position)
        return ctx.error(ctx.translate`Le rôle est au dessus de mon rôle !`);
      if (role.managed)
        return ctx.error(ctx.translate`Le rôle est géré par un bot !`);

      if (!embed) {
        if (!base[0] || !base[0].embed_data)
          return ctx.error(
            ctx.translate`Le système de **règles** n'est pas initialisé sur le serveur ! Veuillez configurer un message.`
          );

        await ctx.database
          .table("guild_rules")
          .update({ role_id: role.id })
          .where("guild_id", ctx.guild.id);
        await ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le rôle du système de **règles** a bien été mise à jour !`,
        });
      } else {
        let embedBeforeEdit = new EmbedBuilder().setTitle("** **");

        const button1 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("✏️")
          .setCustomId("pencil2");

        const button2 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("💬")
          .setCustomId("speech_balloon");

        const button3 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("👑")
          .setCustomId("crown");

        const button4 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("🔽")
          .setCustomId("arrow_down_small");

        const button5 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("🔳")
          .setCustomId("white_square_button");

        const button7 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("📷")
          .setCustomId("camera");

        const button8 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("🌐")
          .setCustomId("globe_with_meridians");

        const button9 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("🔵")
          .setCustomId("blue_circle");

        const button10 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("⬅️")
          .setCustomId("arrow_left");

        const button11 = new ButtonBuilder()
          .setStyle(2)
          .setEmoji("➡️")
          .setCustomId("arrow_right");

        const button12 = new ButtonBuilder()
          .setStyle(3)
          .setEmoji(`${ctx.emojiSuccess}`)
          .setCustomId("white_check_mark");

        const cancel = new ButtonBuilder()
          .setStyle(4)
          .setEmoji(`${ctx.emojiError}`)
          .setCustomId("e_cancel");

        const buttonRow1 = new ActionRowBuilder()
          .addComponents(button1)
          .addComponents(button2)
          .addComponents(button3)
          .addComponents(button4)
          .addComponents(button5);

        const buttonRow2 = new ActionRowBuilder()
          .addComponents(button7)
          .addComponents(button8)
          .addComponents(button9)
          .addComponents(button10)
          .addComponents(button11);

        const buttonRow3 = new ActionRowBuilder()
          .addComponents(button12)
          .addComponents(cancel);

        let msgEmbedForEditing = await ctx.send({ embeds: [embedBeforeEdit] });
        const msgAwait = await ctx.channel.send({
          components: [buttonRow1, buttonRow2, buttonRow3],
          content: ctx.translate(
            ":pencil2: Modifier le titre\n:speech_balloon: Modifier la description\n:crown: Modifier l'auteur\n:arrow_down_small: Modifier le footer\n:white_square_button: Modifier le thumbnail\n:camera: Modifier l'image\n:globe_with_meridians: Modifier l'url\n:blue_circle: Modifier la couleur\n:arrow_left: Supprimer un field\n:arrow_right: Ajouter un field\n:white_check_mark: Envoyer l'embed"
          ),
        });

        const regexUrl =
          /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
        const regexImage =
          /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|svg)\??.*$/gim;
        const regexColor = /^#[0-9A-F]{6}$/i;

        function displaySelectMenu2(data, type) {
          const fields = [];

          const menu = new StringSelectMenuBuilder()
            .setCustomId(`${type}_ticket`)
            .setPlaceholder(ctx.translate`Choisir un salon`)
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
              {
                label: ctx.translate`Annuler`,
                value: `cancel_${type}`,
                description: ctx.translate`Annuler l'action`,
                emoji: `${ctx.emojiError}`,
              },
            ]);

          if (type === "field")
            menu.setPlaceholder(ctx.translate`Choisir un field`);

          for (const row of data) {
            fields.push({
              label: `${
                row.name.length > 100
                  ? row.name.substring(0, 97) + "..."
                  : row.name
              }`,
              value: `${row.id}`,
              emoji: "📌",
            });
          }

          menu.addOptions(fields);

          return menu;
        }

        const filter = (button) => button.user.id === ctx.inter.user.id;
        const collectorEmbed = msgAwait.createMessageComponentCollector({
          filter,
          time: 20 * 60 * 1000,
          componentType: 2,
        });

        collectorEmbed.on("collect", async (button) => {
          if (button.customId === "pencil2") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_name_embed_${button.user.id}`)
              .setTitle(ctx.translate`Titre`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_name_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le titre ?`)
              .setRequired(false)
              .setMaxLength(255);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_name_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const name =
                  modal.fields.getTextInputValue("modal_name_embed") || "** **";

                embedBeforeEdit.setTitle(name);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "speech_balloon") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_desc_embed_${button.user.id}`)
              .setTitle(ctx.translate`Description`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_desc_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quelle est la description ?`)
              .setRequired(false)
              .setMaxLength(4000);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_desc_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const description =
                  modal.fields.getTextInputValue("modal_desc_embed") || "** **";

                embedBeforeEdit.setDescription(description);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "crown") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_author_embed_${button.user.id}`)
              .setTitle(ctx.translate`Auteur`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_author_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le nom de l'auteur ?`)
              .setRequired(false)
              .setMaxLength(255);

            const textInput2 = new TextInputBuilder()
              .setCustomId("modal_author_link_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le lien de l'auteur ?`)
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

            modal.addComponents(actionRow, actionRow2);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_author_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const author =
                  modal.fields.getTextInputValue("modal_author_embed") ||
                  "\u200b";
                const authorLink =
                  modal.fields.getTextInputValue("modal_author_link_embed") ||
                  null;

                if (authorLink !== null && !regexImage.test(authorLink))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} Le lien donné est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setAuthor({
                  name: author,
                  iconURL: authorLink,
                });
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "arrow_down_small") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_footer_embed_${button.user.id}`)
              .setTitle(ctx.translate`Footer`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_footer_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le texte du footer ?`)
              .setRequired(false)
              .setMaxLength(2047);

            const textInput2 = new TextInputBuilder()
              .setCustomId("modal_footer_link_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le lien du footer ?`)
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

            modal.addComponents(actionRow, actionRow2);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_footer_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const footer =
                  modal.fields.getTextInputValue("modal_footer_embed") ||
                  "\u200b";
                const footerLink =
                  modal.fields.getTextInputValue("modal_footer_link_embed") ||
                  null;

                if (footerLink !== null && !regexImage.test(footerLink))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} Le lien donné est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setFooter({
                  text: footer,
                  iconURL: footerLink,
                });
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "white_square_button") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_thumbnail_embed_${button.user.id}`)
              .setTitle(ctx.translate`Thumbnail`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_thumbnail_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le lien du thumbnail ?`)
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_thumbnail_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const thumbnail =
                  modal.fields.getTextInputValue("modal_thumbnail_embed") ||
                  null;

                if (thumbnail !== null && !regexImage.test(thumbnail))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} Le lien donné est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setThumbnail(thumbnail);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "camera") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_image_embed_${button.user.id}`)
              .setTitle(ctx.translate`Image`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_image_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quelle est le lien de l'image ?`)
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_image_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const image =
                  modal.fields.getTextInputValue("modal_image_embed") || null;

                if (image !== null && !regexImage.test(image))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} Le lien donné est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setImage(image);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "globe_with_meridians") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_link_embed_${button.user.id}`)
              .setTitle(ctx.translate`Lien`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_link_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quelle est l'url ?`)
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_link_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const link =
                  modal.fields.getTextInputValue("modal_link_embed") || null;

                if (link !== null && !regexUrl.test(link))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} Le lien donné est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setURL(link);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "blue_circle") {
            const modal = new ModalBuilder()
              .setCustomId(`modal_color_embed_${button.user.id}`)
              .setTitle(ctx.translate`Couleur`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_color_embed")
              .setStyle(1)
              .setLabel(ctx.translate`Quelle est votre couleur ? (hexadécimal)`)
              .setPlaceholder("#0000ff")
              .setRequired(false);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            modal.addComponents(actionRow);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_color_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const color =
                  modal.fields.getTextInputValue("modal_color_embed") || null;

                if (color !== null && !regexColor.test(color))
                  return modal.followUp({
                    content: ctx.translate`${ctx.emojiError} La couleur hexadécimale donnée est invalide !`,
                    flags: 64,
                  });

                embedBeforeEdit.setColor(color);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "arrow_left") {
            await button.deferUpdate();

            if (
              embedBeforeEdit.data.fields === undefined ||
              embedBeforeEdit.data.fields.length === 0
            )
              return button.followUp({
                content: ctx.translate`${ctx.emojiError} L'embed ne possède aucun field à supprimer !`,
                flags: 64,
              });

            const displayEmbed = new EmbedBuilder()
              .setDescription(
                ctx.translate`**Quel field souhaitez-vous supprimer ?**`
              )
              .setColor(ctx.colors.blue);

            const fields = [];
            embedBeforeEdit.data.fields.forEach((field) => {
              fields.push({
                name: field.name,
                id: embedBeforeEdit.data.fields.indexOf(field),
              });
            });

            const data_list = ctx.utils.getNumberPacket(fields, 20);
            let page = 1;
            let msgSend;

            if (data_list.length === 1) {
              msgSend = await button.channel.send({
                embeds: [displayEmbed],
                components: [
                  {
                    type: 1,
                    components: [
                      displaySelectMenu2(data_list[page - 1], "field"),
                    ],
                  },
                ],
              });
            } else {
              const component1 = ctx.messageFormatter.pages(
                `field_left`,
                `field_pages`,
                `field_right`,
                `Page : ${page}/${data_list.length}`,
                page,
                data_list.length
              );
              const component2 = [
                {
                  type: 1,
                  components: [
                    displaySelectMenu2(data_list[page - 1], "field"),
                  ],
                },
              ];
              const components = component1.concat(component2);

              msgSend = await button.channel.send({
                embeds: [displayEmbed],
                components: components,
              });

              const collectorSendButton =
                msgSend.createMessageComponentCollector({
                  filter: filter,
                  time: 5 * 60 * 1000,
                  componentType: 2,
                });

              collectorSendButton.on("collect", async (button) => {
                if (!["field_left", "field_right"].includes(button.customId))
                  return;
                await button.deferUpdate();

                button.customId === "field_left" ? page-- : page++;

                const component1 = ctx.messageFormatter.pages(
                  `field_left`,
                  `field_pages`,
                  `field_right`,
                  `Page : ${page}/${data_list.length}`,
                  page,
                  data_list.length
                );
                const component2 = [
                  {
                    type: 1,
                    components: [
                      displaySelectMenu2(data_list[page - 1], "field"),
                    ],
                  },
                ];
                const components = component1.concat(component2);

                msgSend.edit({ components: components });
              });
            }

            const collectorSendMenu = msgSend.createMessageComponentCollector({
              filter: filter,
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
                    ctx.translate`**Êtes-vous sur de vouloir supprimer le field ${field} ?**`
                  )
                  .setColor(ctx.colors.blue);

                const msgConfirm = await button.channel.send({
                  embeds: [embed],
                  components: ctx.messageFormatter.question(
                    `embed_field_yes`,
                    `${ctx.emojiSuccess}`,
                    `embed_field_no`,
                    `${ctx.emojiError}`
                  ),
                });

                const collectorConfirmReset =
                  msgConfirm.createMessageComponentCollector({
                    filter,
                    max: 1,
                    idle: 5 * 60 * 1000,
                  });
                collectorConfirmReset.on("collect", async (buttonConfirm) => {
                  await buttonConfirm.deferUpdate();
                  collectorConfirmReset.stop();
                  msgConfirm.delete().catch(() => null);

                  if (buttonConfirm.customId === "embed_field_no") return;
                  embedBeforeEdit.data.fields.splice(choice, 1);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
              }
            });

            collectorSendMenu.on("end", async (collected, reason) => {
              if (reason === "time") {
                msgSend.delete().catch(() => null);
              }
            });
          } else if (button.customId === "arrow_right") {
            if (
              embedBeforeEdit.data.fields !== undefined &&
              embedBeforeEdit.data.fields.length > 24
            ) {
              await button.deferUpdate();
              return button.followUp({
                content: ctx.translate`${ctx.emojiError} Vous avez atteint la limite de 25 fields !`,
                flags: 64,
              });
            }

            const modal = new ModalBuilder()
              .setCustomId(`modal_add_field_embed_${button.user.id}`)
              .setTitle(ctx.translate`Field`);

            const textInput = new TextInputBuilder()
              .setCustomId("modal_add_field_name_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le nom ?`)
              .setRequired(true)
              .setMaxLength(255);

            const textInput2 = new TextInputBuilder()
              .setCustomId("modal_add_field_value_embed")
              .setStyle(2)
              .setLabel(ctx.translate`Quel est le contenu ?`)
              .setRequired(false)
              .setMaxLength(1023);

            const actionRow = new ActionRowBuilder().addComponents(textInput);

            const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

            modal.addComponents(actionRow, actionRow2);

            button.showModal(modal).catch(() => null);

            const filterModal = (modal) =>
              modal.customId === `modal_add_field_embed_${button.user.id}`;
            button
              .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
              .catch(() => null)
              .then(async (modal) => {
                if (modal === undefined || modal === null) return;
                await modal.deferUpdate().catch(() => null);
                const name = modal.fields.getTextInputValue(
                  "modal_add_field_name_embed"
                );
                const value =
                  modal.fields.getTextInputValue(
                    "modal_add_field_value_embed"
                  ) || "** **";

                embedBeforeEdit.addFields([{ name: name, value: value }]);

                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });
          } else if (button.customId === "white_check_mark") {
            await button.deferUpdate();

            const embed = new EmbedBuilder()
              .setDescription(
                ctx.translate`**Êtes-vous sur de finaliser l'embed ?**`
              )
              .setColor(ctx.colors.blue);

            const msgConfirm = await button.channel.send({
              embeds: [embed],
              components: ctx.messageFormatter.question(
                `embed_send_yes`,
                `${ctx.emojiSuccess}`,
                `embed_send_no`,
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

              if (buttonConfirm.customId === "embed_send_no") return;

              const embedJson = {
                title: embedBeforeEdit.data.title
                  ? embedBeforeEdit.data.title
                  : null,
                description: embedBeforeEdit.data.description
                  ? embedBeforeEdit.data.description
                  : null,
                url: embedBeforeEdit.data.url ? embedBeforeEdit.data.url : null,
                color: embedBeforeEdit.data.color
                  ? embedBeforeEdit.data.color
                  : null,
                footer: embedBeforeEdit.data.footer
                  ? embedBeforeEdit.data.footer
                  : null,
                image: embedBeforeEdit.data.image
                  ? embedBeforeEdit.data.image
                  : null,
                thumbnail: embedBeforeEdit.data.thumbnail
                  ? embedBeforeEdit.data.thumbnail
                  : null,
                author: embedBeforeEdit.data.author
                  ? embedBeforeEdit.data.author
                  : null,
                fields: embedBeforeEdit.data.fields
                  ? embedBeforeEdit.data.fields
                  : null,
              };

              if (base[0]) {
                await ctx.database
                  .table("guild_rules")
                  .update({
                    embed_data: JSON.stringify(embedJson),
                    role_id: role.id,
                  })
                  .where({ guild_id: ctx.guild.id });
              } else {
                await ctx.database.table("guild_rules").insert({
                  guild_id: ctx.guild.id,
                  embed_data: JSON.stringify(embedJson),
                  role_id: role.id,
                });
              }

              await msgAwait.delete().catch(() => null);
              await msgEmbedForEditing
                .edit({
                  content: ctx.translate`${ctx.emojiSuccess} Le règlement a bien été modifié !`,
                })
                .catch(() => null);

              collectorEmbed.stop();
            });
          } else if (button.customId === "e_cancel") {
            await button.deferUpdate();

            await msgAwait.delete().catch(() => null);
            await msgEmbedForEditing.delete().catch(() => null);
            collectorEmbed.stop();
          }
        });
      }
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de **règles** n'est pas initialisé sur le serveur !`
        );

      await ctx.database
        .table("guild_rules")
        .delete()
        .where("guild_id", ctx.guild.id);
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le système de **règles** a bien été supprimé !`,
      });
    } else if (subCommand === "envoyer") {
      const channel = ctx.options.getChannel("salon");

      if (!base[0])
        return ctx.error(
          ctx.translate`Le système de **règles** n'est pas initialisé sur le serveur !`
        );

      const embed = JSON.parse(base[0].embed_data);

      const button = new ButtonBuilder()
        .setCustomId("rules_accept")
        .setLabel(ctx.translate`Accepter le règlement`)
        .setStyle(3)
        .setEmoji(`${ctx.emojiSuccess}`);

      const actionRow = new ActionRowBuilder().addComponents(button);

      channel.send({
        embeds: [embed],
        components: [actionRow],
      }); //.catch(() => null);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le règlement a bien été envoyé dans le salon ${channel} !`,
      });
    }
  }
};
