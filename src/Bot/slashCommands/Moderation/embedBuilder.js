const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
} = require("discord.js");

module.exports = class Embed extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "embed",
      description: "Créer un embed",
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  displaySelectMenu(ctx, data) {
    const fields = [];

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`field_embed`)
      .setPlaceholder(ctx.translate`Choisir un field`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: ctx.translate`Annuler`,
          value: `cancel_field`,
          description: ctx.translate`Annuler l'action`,
          emoji: `${ctx.emojiError}`,
        },
      ]);

    for (const row of data) {
      fields.push({
        label: `${
          row.name.length > 100 ? row.name.substring(0, 97) + "..." : row.name
        }`,
        value: `${row.id}`,
        emoji: "📌",
      });
    }

    menu.addOptions(fields);

    return menu;
  }

  async run(ctx) {
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

    const button6 = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("🕙")
      .setCustomId("clock10");

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
      .addComponents(button6)
      .addComponents(button12)
      .addComponents(cancel);

    let msgEmbedForEditing = await ctx.send({ embeds: [embedBeforeEdit] });
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

    const regexUrl =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
    const regexImage =
      /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|svg)\??.*$/gim;
    const regexColor = /^#[0-9A-F]{6}$/i;

    const filter = (button) => button.user.id === ctx.user.id;
    const collector = msgAwait.createMessageComponentCollector({
      filter: filter,
      idle: 10 * 60 * 1000,
      componentType: 2,
    });

    collector.on("collect", async (button) => {
      if (button.customId === "pencil2") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_name_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

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
          modal.customId === `modal_name_embed_${date}`;
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
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_desc_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

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
          modal.customId === `modal_desc_embed_${date}`;
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
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_author_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_author_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est l'auteur ?`)
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
          modal.customId === `modal_author_embed_${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const author =
              modal.fields.getTextInputValue("modal_author_embed") || "\u200b";
            const authorLink =
              modal.fields.getTextInputValue("modal_author_link_embed") || null;

            if (authorLink !== null && !regexImage.test(authorLink))
              return modal.followUp({
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Le lien est invalide !`}`,
                flags: 64,
              });

            embedBeforeEdit.setAuthor({ name: author, iconURL: authorLink });
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "arrow_down_small") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_footer_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_footer_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est le footer ?`)
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
          modal.customId === `modal_footer_embed_${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const footer =
              modal.fields.getTextInputValue("modal_footer_embed") || "\u200b";
            const footerLink =
              modal.fields.getTextInputValue("modal_footer_link_embed") || null;

            if (footerLink !== null && !regexImage.test(footerLink))
              return modal.followUp({
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Le lien est invalide !`}`,
                flags: 64,
              });

            embedBeforeEdit.setFooter({ text: footer, iconURL: footerLink });
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "white_square_button") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_thumbnail_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_thumbnail_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est le lien du thumbnail ?`)
          .setRequired(false);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_thumbnail_embed_${date}`;
        button
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const thumbnail =
              modal.fields.getTextInputValue("modal_thumbnail_embed") || null;

            if (thumbnail !== null && !regexImage.test(thumbnail))
              return modal.followUp({
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Le lien est invalide !`}`,
                flags: 64,
              });

            embedBeforeEdit.setThumbnail(thumbnail);
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "clock10") {
        await button.deferUpdate();

        if (embedBeforeEdit.data.timestamp !== undefined) {
          embedBeforeEdit.setTimestamp(null);
        } else {
          embedBeforeEdit.setTimestamp();
        }
        await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
      } else if (button.customId === "camera") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_image_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_image_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est le lien de l'image ?`)
          .setRequired(false);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_image_embed_${date}`;
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
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Le lien est invalide !`}`,
                flags: 64,
              });

            embedBeforeEdit.setImage(image);
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "globe_with_meridians") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_link_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_link_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est le lien ?`)
          .setRequired(false);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_link_embed_${date}`;
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
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Le lien est invalide !`}`,
                flags: 64,
              });

            embedBeforeEdit.setURL(link);
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "blue_circle") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_color_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_color_embed")
          .setStyle(1)
          .setLabel(ctx.translate`Quelle est la couleur ?`)
          .setRequired(false);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_color_embed_${date}`;
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
                content: `${ctx.emojiError} La couleur est invalide !`,
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
            content: `${ctx.emojiError} Il n'y a aucun field à supprimer !`,
            flags: 64,
          });

        const displayEmbed = new EmbedBuilder()
          .setDescription(ctx.translate`**Quel field voulez-vous supprimer ?**`)
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
                components: [this.displaySelectMenu(ctx, data_list[page - 1])],
              },
            ],
          });
        } else {
          const component1 = ctx.messageFormatter.pages(
            `field_left`,
            `field_pages`,
            `field_right`,
            ctx.translate`Page {p1}/{p2}`
              .replace("{p1}", page)
              .replace("{p2}", data_list.length),
            page,
            data_list.length
          );
          const component2 = [
            {
              type: 1,
              components: [this.displaySelectMenu(ctx, data_list[page - 1])],
            },
          ];
          const components = component1.concat(component2);

          msgSend = await button.channel.send({
            embeds: [displayEmbed],
            components: components,
          });

          const collectorSendButton = msgSend.createMessageComponentCollector({
            filter: filter,
            time: 5 * 60 * 1000,
            componentType: 2,
          });

          collectorSendButton.on("collect", async (button) => {
            await button.deferUpdate();
            if (button.customId === "field_left") {
              page--;

              const component1 = ctx.messageFormatter.pages(
                `field_left`,
                `field_pages`,
                `field_right`,
                ctx.translate`Page {p1}/{p2}`
                  .replace("{p1}", page)
                  .replace("{p2}", data_list.length),
                page,
                data_list.length
              );
              const component2 = [
                {
                  type: 1,
                  components: [
                    this.displaySelectMenu(ctx, data_list[page - 1]),
                  ],
                },
              ];
              const components = component1.concat(component2);

              msgSend.edit({ components: components });
            } else if (button.customId === "channel_send_right") {
              page++;

              const component1 = ctx.messageFormatter.pages(
                `field_left`,
                `field_pages`,
                `field_right`,
                ctx.translate`Page {p1}/{p2}`
                  .replace("{p1}", page)
                  .replace("{p2}", data_list.length),
                page,
                data_list.length
              );
              const component2 = [
                {
                  type: 1,
                  components: [
                    this.displaySelectMenu(ctx, data_list[page - 1]),
                  ],
                },
              ];
              const components = component1.concat(component2);

              msgSend.edit({ components: components });
            }
          });
        }

        const collectorSendMenu = msgSend.createMessageComponentCollector({
          filter: filter,
          idle: 5 * 60 * 1000,
          componentType: 3,
        });

        collectorSendMenu.on("collect", async (menuSend) => {
          await menuSend.deferUpdate();
          collectorSendMenu.stop();
          const choice = menuSend.values[0];
          msgSend.delete().catch(() => null);

          if (choice !== "cancel_field") {
            embedBeforeEdit.data.fields.splice(choice, 1);
            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          }
        });

        collectorSendMenu.on("end", async (collected, reason) => {
          if (reason === "idle") {
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
            content: `${
              ctx.emojiError
            } ${ctx.translate`Vous avez atteint la limite de fields !`}`,
            flags: 64,
          });
        }

        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_add_field_embed_${date}`)
          .setTitle(ctx.translate`Embed Builder`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_add_field_name_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quel est le nom du field ?`)
          .setRequired(true)
          .setMaxLength(255);

        const textInput2 = new TextInputBuilder()
          .setCustomId("modal_add_field_value_embed")
          .setStyle(2)
          .setLabel(ctx.translate`Quelle est la valeur du field ?`)
          .setRequired(false)
          .setMaxLength(1023);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

        modal.addComponents(actionRow, actionRow2);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_add_field_embed_${date}`;
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
              modal.fields.getTextInputValue("modal_add_field_value_embed") ||
              "** **";

            embedBeforeEdit.addFields([{ name: name, value: value }]);

            await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
          });
      } else if (button.customId === "white_check_mark") {
        await button.deferUpdate();

        const displayEmbed = new EmbedBuilder()
          .setDescription(
            ctx.translate`Choisissez le salon où envoyer l'embed.`
          )
          .setColor(ctx.colors.blue);

        const channelSelectMenu = new ChannelSelectMenuBuilder()
          .setCustomId(`send_embed`)
          .setPlaceholder(ctx.translate`Choisir un salon`)
          .addChannelTypes(0)
          .addChannelTypes(5)
          .addChannelTypes(10)
          .addChannelTypes(11)
          .addChannelTypes(15)
          .setMinValues(1)
          .setMaxValues(1);

        const actionRow = new ActionRowBuilder().addComponents(
          channelSelectMenu
        );

        const msgSend = await button.channel.send({
          embeds: [displayEmbed],
          components: [actionRow],
        });

        const collectorSendMenu = msgSend.createMessageComponentCollector({
          filter,
          max: 1,
          idle: 5 * 60 * 1000,
          componentType: 8,
        });

        collectorSendMenu.on("collect", async (menuSend) => {
          await menuSend.deferUpdate();
          collectorSendMenu.stop();
          const choice = menuSend.values[0];
          msgSend.delete().catch(() => null);

          if (choice) {
            const channel = menuSend.guild.channels.cache.get(choice);
            await channel.send({ embeds: [embedBeforeEdit] }).catch(() => null);

            await msgAwait.delete().catch(() => null);
            await button.followUp({
              content: `${
                ctx.emojiSuccess
              } ${ctx.translate`L'embed a été envoyé dans le salon ${channel} !`}`,
            });
            collector.stop();
          }
        });

        collectorSendMenu.on("end", async (collected, reason) => {
          if (reason === "idle") {
            await msgSend.delete().catch(() => null);
          }
        });
      } else if (button.customId === "e_cancel") {
        await button.deferUpdate();

        await msgAwait.delete().catch(() => null);
        await msgEmbedForEditing.delete().catch(() => null);
        collector.stop();
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "idle") {
        msgAwait.edit({ components: [] }).catch(() => null);
      }
    });
  }
};
