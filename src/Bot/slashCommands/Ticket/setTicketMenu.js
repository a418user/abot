const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  parseEmoji,
} = require("discord.js");
const { parse } = require("twemoji-parser");

module.exports = class TicketMenu extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "ticket-menu",
      description: "Gérer le système de tickets par menu",
      options: [
        {
          name: "config",
          description: "Configurer le système de tickets par menu",
          type: 1,
        },
        {
          name: "send-menu",
          description: "Envoyer l'embed pour ouvrir un ticket par menu",
          type: 1,
          options: [
            {
              name: "couleur",
              description: "Choisir la couleur du bouton",
              type: 3,
              required: true,
              choices: [
                { name: "Bleu", value: "1" },
                { name: "Gris", value: "2" },
                { name: "Vert", value: "3" },
                { name: "Rouge", value: "4" },
              ],
            },
            {
              name: "texte",
              description: "Choisir le texte du bouton",
              type: 3,
              required: false,
            },
            {
              name: "emoji",
              description: "Choisir l'emoji du bouton",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "customise",
          description:
            "Personnaliser l'emote et la description de chaque catégorie de tickets",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Ticket,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  displayEmbedAndComponents(ctx, allDatabase, ticketData) {
    let categoryChannelValue,
      categoryChannelCloseValue,
      nameTicketValue,
      roleTicketValue = [],
      rolesMentionValue = [],
      embedTicketValue,
      msgTicketValue,
      numberTicketValue,
      logTicketValue,
      archiveTicketValue,
      type;

    const menu = new StringSelectMenuBuilder()
      .setPlaceholder("Choisir une catégorie")
      .setMinValues(1)
      .setMaxValues(1)
      .setCustomId("choice_type");

    const category = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("1️⃣")
      .setCustomId("category");

    const nameTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("2️⃣")
      .setCustomId("name_ticket");

    const roleTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("3️⃣")
      .setCustomId("role_ticket");

    const logTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("4️⃣")
      .setCustomId("log_ticket");

    const archiveTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("5️⃣")
      .setCustomId("archive_ticket");

    const msgNewTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("6️⃣")
      .setCustomId("msg_new_ticket");

    const embedNewTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("7️⃣")
      .setCustomId("embed_new_ticket");

    const numberTicket = new ButtonBuilder()
      .setStyle(2)
      .setEmoji("8️⃣")
      .setCustomId("number_ticket");

    const reset = new ButtonBuilder()
      .setStyle(1)
      .setEmoji("🔄")
      .setCustomId("reset_ticket");

    const cancel = new ButtonBuilder()
      .setStyle(4)
      .setEmoji("🚪")
      .setCustomId("cancel_ticket");

    if (!ticketData) {
      categoryChannelValue = `Tickets ouverts ➣ ${ctx.emojiError}`;
      categoryChannelCloseValue = `Tickets fermés ➣ ${ctx.emojiError}`;
      nameTicketValue = `${ctx.emojiError}`;
      roleTicketValue = [`${ctx.emojiError}`];
      logTicketValue = `${ctx.emojiError}`;
      archiveTicketValue = `${ctx.emojiError}`;
      embedTicketValue = `${ctx.emojiError}`;
      msgTicketValue = `Mention ➣ ${ctx.emojiError}\nMessage ➣ ${ctx.emojiError}`;
      numberTicketValue = "`0`";
      type = `${ctx.emojiError}`;

      category.setDisabled(true);
      nameTicket.setDisabled(true);
      roleTicket.setDisabled(true);
      logTicket.setDisabled(true);
      archiveTicket.setDisabled(true);
      msgNewTicket.setDisabled(true);
      embedNewTicket.setDisabled(true);
      numberTicket.setDisabled(true);
      reset.setDisabled(true);
    } else {
      type = ctx.ticket.formatString(ticketData.choice_type);

      categoryChannelValue = ticketData.category_id
        ? ctx.getChannel(ticketData.category_id)
          ? `Tickets ouverts ➣ ${ctx
              .getChannel(ticketData.category_id)
              .name.toUpperCase()}`
          : `⚠️ Tickets ouverts ➣ \`${ticketData.category_id}\``
        : `Tickets ouverts ➣ ${ctx.emojiError}`;
      categoryChannelCloseValue = ticketData.category_close_id
        ? ctx.getChannel(ticketData.category_close_id)
          ? `Tickets fermés ➣ ${ctx
              .getChannel(ticketData.category_close_id)
              .name.toUpperCase()}`
          : `⚠️ Tickets fermés ➣ \`${ticketData.category_close_id}\``
        : `Tickets fermés ➣ ${ctx.emojiError}`;
      nameTicketValue = ticketData.name_ticket
        ? `\`${ticketData.name_ticket}\``
        : `${ctx.emojiError}`;

      for (const roleId of JSON.parse(ticketData.roles_access)) {
        const role = ctx.getRole(roleId);
        if (!role) roleTicketValue.push(`⚠️ \`${roleId}\``);
        else roleTicketValue.push(role);
      }

      if (roleTicketValue.length === 0)
        roleTicketValue.push(`${ctx.emojiError}`);

      logTicketValue = ticketData.log_id
        ? ctx.getChannel(ticketData.log_id)
          ? `${ctx.getChannel(ticketData.log_id)}`
          : `⚠️ \`${ticketData.log_id}\``
        : `${ctx.emojiError}`;
      archiveTicketValue = ticketData.archive_id
        ? ctx.getChannel(ticketData.archive_id)
          ? `${ctx.getChannel(ticketData.archive_id)}`
          : `⚠️ \`${ticketData.archive_id}\``
        : `${ctx.emojiError}`;
      embedTicketValue = ticketData.embed_ticket
        ? `${ctx.emojiSuccess}`
        : `${ctx.emojiError}`;

      const msgValue = ticketData.msg_ticket
        ? `\`${ticketData.msg_ticket}\``
        : `Message ➣ ${ctx.emojiError}`;
      if (ticketData.roles_mention) {
        for (const roleId of JSON.parse(ticketData.roles_mention)) {
          const role = ctx.getRole(roleId);

          if (rolesMentionValue.length === 0) {
            if (role) rolesMentionValue.push(`Mention ➣ ${role}`);
            else rolesMentionValue.push(`Mention ➣ ⚠️ \`${roleId}\``);
          } else {
            if (role) rolesMentionValue.push(role);
            else rolesMentionValue.push(`⚠️ \`${roleId}\``);
          }
        }
      }

      if (rolesMentionValue.length === 0)
        rolesMentionValue.push(`Mention ➣ ${ctx.emojiError}`);

      msgTicketValue = `${rolesMentionValue.join(", ")}\n${msgValue}`;

      numberTicketValue = ticketData.number_ticket
        ? `\`${ticketData.number_ticket}\``
        : "`0`";

      const getAllTypeTickets = ctx.ticket.getAllTypeTickets(
        ctx.inter,
        allDatabase
      );

      menu.addOptions(
        getAllTypeTickets.map((type) => {
          return {
            label: ctx.ticket.formatString(type.choice_type),
            description: type.description,
            emoji: type.emoji,
            value: type.choice_type,
          };
        })
      );

      if (Boolean(ticketData.first_type) === false)
        embedNewTicket.setDisabled(true);
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `\uD83C\uDFAB Configuration du système de tickets \uD83C\uDFAB`,
        iconURL: `${ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()}`,
      })
      .setColor(ctx.colors.blue)
      .setDescription(`Catégorie : ${type}`)
      .setFooter({
        text: `✅ Configuré | ⚠️ Problème détecté | ❌ Non configuré`,
      })
      .addFields([
        {
          name: "1️⃣ Catégories",
          value: `${categoryChannelValue}\n${categoryChannelCloseValue}`,
          inline: true,
        },
        { name: "2️⃣ Nom", value: `${nameTicketValue}`, inline: true },
        { name: `\u200b`, value: `\u200b`, inline: true },
        {
          name: "3️⃣ Rôles ayant accès aux tickets",
          value: `${roleTicketValue}`,
          inline: true,
        },
        { name: "4️⃣ Salon des logs", value: `${logTicketValue}`, inline: true },
        { name: `\u200b`, value: `\u200b`, inline: true },
        {
          name: "5️⃣ Salon des archives",
          value: `${archiveTicketValue}`,
          inline: true,
        },
        {
          name: "6️⃣ Message envoyé lors de l'ouverture d'un ticket",
          value: `${msgTicketValue}`,
          inline: true,
        },
        { name: `\u200b`, value: `\u200b`, inline: true },
        {
          name: "7️⃣ Embed pour ouvrir un ticket",
          value: `${embedTicketValue}`,
          inline: true,
        },
        {
          name: "8️⃣ Compteur des tickets",
          value: `${numberTicketValue}`,
          inline: true,
        },
      ]);

    menu
      .addOptions({
        label: "Nouvelle catégorie",
        emoji: "🆕",
        value: "new_type",
        description: "Créer une nouvelle catégorie",
      })
      .addOptions({
        label: "Supprimer catégorie",
        emoji: "🚨",
        value: "remove_type",
        description: "Supprimer une catégorie",
      })
      .addOptions({
        label: "Vide",
        emoji: "💤",
        value: "nothing_type",
        description: "Cliquer ici pour ne rien faire",
      });

    const actionRow1 = new ActionRowBuilder()
      .addComponents(category)
      .addComponents(nameTicket)
      .addComponents(roleTicket)
      .addComponents(logTicket)
      .addComponents(reset);

    const actionRow2 = new ActionRowBuilder()
      .addComponents(archiveTicket)
      .addComponents(msgNewTicket)
      .addComponents(embedNewTicket)
      .addComponents(numberTicket)
      .addComponents(cancel);

    const actionRowMenu = new ActionRowBuilder().addComponents(menu);

    return [embed, actionRow1, actionRow2, actionRowMenu];
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "config") {
      let baseTicket = await ctx.database
        .table("guild_ticket_menu")
        .select()
        .where({ guild_id: ctx.guild.id });
      let ticketData = baseTicket.find(
        (ticket) => Boolean(ticket.first_type) === true
      );

      const data = this.displayEmbedAndComponents(ctx, baseTicket, ticketData);
      const msg = await ctx.send({
        embeds: [data[0]],
        components: [data[1], data[2], data[3]],
      });

      const filter = (component) => component.user.id === ctx.user.id;
      const collectorMenu = msg.createMessageComponentCollector({
        filter,
        componentType: 3,
        idle: 10 * 60 * 1000,
      });
      const collector = msg.createMessageComponentCollector({
        filter,
        componentType: 2,
        idle: 10 * 60 * 1000,
      });

      collectorMenu.on("collect", async (menu) => {
        const choice = menu.values[0];
        if (choice === "new_type") {
          const date = Date.now();
          const modal = new ModalBuilder()
            .setCustomId(`modal_new_ticket_${date}`)
            .setTitle("Création d'une nouvelle catégorie");

          const textInput = new TextInputBuilder()
            .setCustomId("modal_new_ticket_name")
            .setStyle(1)
            .setLabel("Quel est le nom de la nouvelle catégorie ?")
            .setRequired(true)
            .setMaxLength(50);

          const actionRow = new ActionRowBuilder().addComponents(textInput);

          modal.addComponents(actionRow);

          menu.showModal(modal).catch(() => null);

          const filterModal = (modal) =>
            modal.customId === `modal_new_ticket_${date}`;
          ctx.inter
            .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
            .catch(() => null)
            .then(async (modal) => {
              if (modal === undefined || modal === null) return;
              await modal.deferUpdate().catch(() => null);
              const name = modal.fields.getTextInputValue(
                "modal_new_ticket_name"
              );

              for (let i = 0; i < baseTicket.length; i++) {
                if (baseTicket[i].choice_type === name.toLowerCase()) {
                  return modal.followUp({
                    content: `${ctx.emojiError} Le nom de catégorie **${name}** existe déjà !`,
                    flags: 64,
                  });
                }
              }

              if (baseTicket.length >= 20)
                return modal.followUp({
                  content: `${ctx.emojiError} Vous ne pouvez pas créer plus de catégorie !`,
                  flags: 64,
                });

              if (!baseTicket[0]) {
                await ctx.database
                  .table("guild_ticket_menu")
                  .insert({
                    guild_id: ctx.guild.id,
                    choice_type: name.toLowerCase(),
                    number_ticket: 0,
                    first_type: true,
                  });
              } else {
                await ctx.database
                  .table("guild_ticket_menu")
                  .insert({
                    guild_id: ctx.guild.id,
                    choice_type: name.toLowerCase(),
                    number_ticket: 0,
                  });
              }

              baseTicket = await ctx.database
                .table("guild_ticket_menu")
                .select()
                .where({ guild_id: ctx.guild.id });
              ticketData = baseTicket.find(
                (ticket) => ticket.choice_type === name.toLowerCase()
              );
              const data = this.displayEmbedAndComponents(
                ctx,
                baseTicket,
                ticketData
              );
              await msg.edit({
                embeds: [data[0]],
                components: [data[1], data[2], data[3]],
              });
            });
        } else if (choice === "remove_type") {
          await menu.deferUpdate();

          if (!baseTicket[0])
            return menu.followUp({
              content: `${ctx.emojiError} Il n'existe aucun catégorie !`,
              flags: 64,
            });

          const getAllTypeTickets = ctx.ticket.getAllTypeTickets(
            ctx.inter,
            baseTicket
          );

          const embed = new EmbedBuilder()
            .setDescription("**Quelle catégorie souhaitez-vous supprimer ?**")
            .setColor(ctx.colors.blue);

          const menuType = new StringSelectMenuBuilder()
            .setPlaceholder("Sélectionner une catégorie")
            .setMinValues(1)
            .setMaxValues(1)
            .setCustomId("delete_type")
            .addOptions(
              getAllTypeTickets.map((type) => {
                return {
                  label: ctx.ticket.formatString(type.choice_type),
                  description: type.description,
                  emoji: type.emoji,
                  value: type.choice_type.toLowerCase(),
                };
              })
            )
            .addOptions({
              label: "Annuler",
              emoji: `${ctx.emojiError}`,
              value: "cancel_delete_type",
              description: "Annuler l'action",
            });

          const actionRow = new ActionRowBuilder().addComponents(menuType);

          await msg.edit({ components: [] });
          const msgRemoveType = await menu.channel.send({
            embeds: [embed],
            components: [actionRow],
          });

          const collectorRemoveType =
            msgRemoveType.createMessageComponentCollector({
              filter,
              componentType: 3,
              idle: 5 * 60 * 1000,
            });
          collectorRemoveType.on("collect", async (menuType) => {
            await menuType.deferUpdate();
            collectorRemoveType.stop();
            const choiceType = menuType.values[0];

            if (choiceType !== "cancel_delete_type") {
              const checkIfHasTable = baseTicket.find(
                (ticket) => ticket.choice_type === choiceType.toLowerCase()
              );
              if (checkIfHasTable)
                await ctx.database
                  .table("guild_ticket_menu")
                  .delete()
                  .where({
                    guild_id: ctx.guild.id,
                    choice_type: choiceType.toLowerCase(),
                  });

              if (Boolean(checkIfHasTable.first_type) === true) {
                const tickets = baseTicket.filter(
                  (ticket) => ticket.choice_type !== choiceType.toLowerCase()
                );
                if (tickets[0])
                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ first_type: true })
                    .where({ id: tickets[0].id });
              }
            }

            msgRemoveType.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorRemoveType.on("end", (_, reason) => {
            if (reason === "idle") {
              msg.edit({ components: [data[1], data[2], data[3]] });
              return msgRemoveType.delete().catch(() => null);
            }
          });
        } else if (choice === "nothing_type") {
          await menu.deferUpdate();
        } else {
          await menu.deferUpdate();

          ticketData = baseTicket.find(
            (ticket) => ticket.choice_type === choice
          );
          const data = this.displayEmbedAndComponents(
            ctx,
            baseTicket,
            ticketData
          );
          await msg.edit({
            embeds: [data[0]],
            components: [data[1], data[2], data[3]],
          });
        }
      });
      collectorMenu.on("end", (_, reason) => {
        if (reason === "idle")
          if (msg.components.length > 0)
            return msg.edit({ components: [] }).catch(() => null);
      });

      collector.on("collect", async (button) => {
        if (button.customId === "category") {
          await button.deferUpdate();

          const embedChoice = new EmbedBuilder()
            .setDescription("**Quelle action souhaitez-vous effectuer ?**")
            .setColor(ctx.colors.blue);

          const buttonCategory = new ButtonBuilder()
            .setStyle(2)
            .setLabel("Tickets ouverts")
            .setCustomId("category_ticket")
            .setEmoji("📥");

          const buttonCategoryClose = new ButtonBuilder()
            .setStyle(2)
            .setLabel("Tickets fermés")
            .setCustomId("category_close_ticket")
            .setEmoji("📤");

          const buttonCategoryCancel = new ButtonBuilder()
            .setStyle(4)
            .setEmoji(`${ctx.emojiError}`)
            .setCustomId("cancel_category_ticket");

          const actionRowQuestion = new ActionRowBuilder()
            .addComponents(buttonCategory)
            .addComponents(buttonCategoryClose)
            .addComponents(buttonCategoryCancel);

          await msg.edit({ components: [] });
          const msgQuestion = await button.channel.send({
            embeds: [embedChoice],
            components: [actionRowQuestion],
          });

          const collectorQuestion = msgQuestion.createMessageComponentCollector(
            { filter, max: 1, componentType: 2, idle: 2 * 60 * 1000 }
          );

          collectorQuestion.on("collect", async (buttonQuestion) => {
            await buttonQuestion.deferUpdate();
            collectorQuestion.stop();
            msgQuestion.delete().catch(() => null);

            if (buttonQuestion.customId === "category_ticket") {
              const displayEmbed = new EmbedBuilder()
                .setDescription(
                  "**Choisir une catégorie où seront envoyés les tickets ouverts**"
                )
                .setColor(ctx.colors.blue);

              const channelSelectMenu = new ChannelSelectMenuBuilder()
                .setCustomId("category")
                .setPlaceholder("Catégorie du serveur")
                .addChannelTypes(4)
                .setMinValues(0)
                .setMaxValues(1);

              if (ticketData.category_id)
                channelSelectMenu.addDefaultChannels(ticketData.category_id);

              const actionRow = new ActionRowBuilder().addComponents(
                channelSelectMenu
              );

              const msgCategory = await buttonQuestion.channel.send({
                embeds: [displayEmbed],
                components: [actionRow],
              });

              const collectorCategoryMenu =
                msgCategory.createMessageComponentCollector({
                  filter,
                  max: 1,
                  idle: 5 * 60 * 1000,
                  componentType: 8,
                });

              collectorCategoryMenu.on("collect", async (menuCategory) => {
                await menuCategory.deferUpdate();
                collectorCategoryMenu.stop();
                const choice = menuCategory.values[0];

                if (!choice) {
                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ category_id: null })
                    .where({ id: ticketData.id });
                } else {
                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ category_id: choice })
                    .where({ id: ticketData.id });
                }

                msgCategory.delete().catch(() => null);

                baseTicket = await ctx.database
                  .table("guild_ticket_menu")
                  .select()
                  .where({ guild_id: ctx.guild.id });
                ticketData = baseTicket.find(
                  (ticket) => ticket.choice_type === ticketData.choice_type
                );
                const data = this.displayEmbedAndComponents(
                  ctx,
                  baseTicket,
                  ticketData
                );
                await msg.edit({
                  embeds: [data[0]],
                  components: [data[1], data[2], data[3]],
                });
              });
            } else if (buttonQuestion.customId === "category_close_ticket") {
              const displayEmbed = new EmbedBuilder()
                .setDescription(
                  "**Choisir une catégorie où seront envoyés les tickets fermés**"
                )
                .setColor(ctx.colors.blue);

              const channelSelectMenu = new ChannelSelectMenuBuilder()
                .setCustomId("category")
                .setPlaceholder("Salons du serveur")
                .addChannelTypes(4)
                .setMinValues(0)
                .setMaxValues(1);

              if (ticketData.category_close_id)
                channelSelectMenu.addDefaultChannels(
                  ticketData.category_close_id
                );

              const actionRow = new ActionRowBuilder().addComponents(
                channelSelectMenu
              );

              const msgCategoryClose = await buttonQuestion.channel.send({
                embeds: [displayEmbed],
                components: [actionRow],
              });

              const collectorCategoryCloseMenu =
                msgCategoryClose.createMessageComponentCollector({
                  filter,
                  max: 1,
                  idle: 5 * 60 * 1000,
                  componentType: 8,
                });

              collectorCategoryCloseMenu.on(
                "collect",
                async (menuCategoryClose) => {
                  await menuCategoryClose.deferUpdate();
                  collectorCategoryCloseMenu.stop();
                  const choice = menuCategoryClose.values[0];

                  if (!choice) {
                    await ctx.database
                      .table("guild_ticket_menu")
                      .update({ category_close_id: null })
                      .where({ id: ticketData.id });
                  } else {
                    await ctx.database
                      .table("guild_ticket_menu")
                      .update({ category_close_id: choice })
                      .where({ id: ticketData.id });
                  }

                  msgCategoryClose.delete().catch(() => null);

                  baseTicket = await ctx.database
                    .table("guild_ticket_menu")
                    .select()
                    .where({ guild_id: ctx.guild.id });
                  ticketData = baseTicket.find(
                    (ticket) => ticket.choice_type === ticketData.choice_type
                  );
                  const data = this.displayEmbedAndComponents(
                    ctx,
                    baseTicket,
                    ticketData
                  );
                  await msg.edit({
                    embeds: [data[0]],
                    components: [data[1], data[2], data[3]],
                  });
                }
              );
            } else if (buttonQuestion.customId === "cancel_category_ticket") {
              await msg.edit({
                embeds: [data[0]],
                components: [data[1], data[2], data[3]],
              });
            }
          });

          collectorQuestion.on("end", (_, reason) => {
            if (reason === "idle") {
              msg.edit({ components: [data[1], data[2], data[3]] });
              return msgQuestion.delete().catch(() => null);
            }
          });
        } else if (button.customId === "name_ticket") {
          const date = Date.now();
          const modal = new ModalBuilder()
            .setCustomId(`modal_name_ticket_${date}`)
            .setTitle("Choix du nom des tickets");

          const textInput = new TextInputBuilder()
            .setCustomId("modal_name_ticket")
            .setStyle(2)
            .setLabel("Quel est le nom donné aux tickets ?")
            .setPlaceholder(
              'Mettre "author" pour avoir le nom de l\'auteur du ticket'
            )
            .setRequired(false)
            .setMaxLength(90);

          const actionRow = new ActionRowBuilder().addComponents(textInput);

          modal.addComponents(actionRow);

          button.showModal(modal).catch(() => null);

          const filterModal = (modal) =>
            modal.customId === `modal_name_ticket_${date}`;
          ctx.inter
            .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
            .catch(() => null)
            .then(async (modal) => {
              if (modal === undefined || modal === null) return;
              await modal.deferUpdate().catch(() => null);
              const name = modal.fields.getTextInputValue("modal_name_ticket");

              await ctx.database
                .table("guild_ticket_menu")
                .update({ name_ticket: name })
                .where({ id: ticketData.id });

              baseTicket = await ctx.database
                .table("guild_ticket_menu")
                .select()
                .where({ guild_id: ctx.guild.id });
              ticketData = baseTicket.find(
                (ticket) => ticket.choice_type === ticketData.choice_type
              );
              const data = this.displayEmbedAndComponents(
                ctx,
                baseTicket,
                ticketData
              );
              await msg.edit({
                embeds: [data[0]],
                components: [data[1], data[2], data[3]],
              });
            });
        } else if (button.customId === "role_ticket") {
          await button.deferUpdate();

          const displayEmbed = new EmbedBuilder()
            .setDescription("**Choisir des roles à ajouter aux tickets**")
            .setColor(ctx.colors.blue);

          const roleSelectMenu = new RoleSelectMenuBuilder()
            .setCustomId("role_ticket")
            .setPlaceholder("Rôles du serveur")
            .setMinValues(0)
            .setMaxValues(10);

          if (JSON.parse(ticketData.roles_access)[0])
            roleSelectMenu.setDefaultRoles(JSON.parse(ticketData.roles_access));

          const actionRow = new ActionRowBuilder().addComponents(
            roleSelectMenu
          );

          await msg.edit({ components: [] });
          const msgRole = await button.channel.send({
            embeds: [displayEmbed],
            components: [actionRow],
          });

          const collectorRoleMenu = msgRole.createMessageComponentCollector({
            filter,
            max: 1,
            idle: 5 * 60 * 1000,
            componentType: 6,
          });

          collectorRoleMenu.on("collect", async (menuRole) => {
            await menuRole.deferUpdate();
            let rolesId = menuRole.values;

            if (!rolesId[0]) {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ roles_access: JSON.stringify([]) })
                .where({ id: ticketData.id });
            } else {
              for (const role of menuRole.roles) {
                if (role[1].managed)
                  rolesId = rolesId.filter((id) => id !== role[0]);
              }

              await ctx.database
                .table("guild_ticket_menu")
                .update({ roles_access: JSON.stringify(rolesId) })
                .where({ id: ticketData.id });
            }

            collectorRoleMenu.stop();
            msgRole.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorRoleMenu.on("end", async (collected, reason) => {
            if (reason === "idle") {
              msg.edit({ components: [data[1], data[2], data[3]] });
              return msgRole.delete().catch(() => null);
            }
          });
        } else if (button.customId === "log_ticket") {
          await button.deferUpdate();

          const displayEmbed = new EmbedBuilder()
            .setDescription(
              "**Choisir le salon où seront envoyés les logs des tickets**"
            )
            .setColor(ctx.colors.blue);

          const channelSelectMenu = new ChannelSelectMenuBuilder()
            .setCustomId("log_ticket")
            .setPlaceholder("Salons du serveur")
            .addChannelTypes(0)
            .setMinValues(0)
            .setMaxValues(1);

          if (ticketData.log_id)
            channelSelectMenu.addDefaultChannels(ticketData.log_id);

          const actionRow = new ActionRowBuilder().addComponents(
            channelSelectMenu
          );

          await msg.edit({ components: [] });
          const msgLog = await button.channel.send({
            embeds: [displayEmbed],
            components: [actionRow],
          });

          const collectorLogMenu = msgLog.createMessageComponentCollector({
            filter,
            max: 1,
            idle: 5 * 60 * 1000,
            componentType: 8,
          });

          collectorLogMenu.on("collect", async (menuLog) => {
            await menuLog.deferUpdate();
            collectorLogMenu.stop();
            const choice = menuLog.values[0];

            if (!choice) {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ log_id: null })
                .where({ id: ticketData.id });
            } else {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ log_id: choice })
                .where({ id: ticketData.id });
            }

            msgLog.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorLogMenu.on("end", async (collected, reason) => {
            if (reason === "idle") {
              await msg.edit({ components: [data[1], data[2], data[3]] });
              return msgLog.delete().catch(() => null);
            }
          });
        } else if (button.customId === "archive_ticket") {
          await button.deferUpdate();

          const displayEmbed = new EmbedBuilder()
            .setDescription(
              "**Choisir le salon où seront envoyés les archives des tickets**"
            )
            .setColor(ctx.colors.blue);

          const channelSelectMenu = new ChannelSelectMenuBuilder()
            .setCustomId("archive_ticket")
            .setPlaceholder("Salons du serveur")
            .addChannelTypes(0)
            .setMinValues(0)
            .setMaxValues(1);

          if (ticketData.archive_id)
            channelSelectMenu.addDefaultChannels(ticketData.archive_id);

          const actionRow = new ActionRowBuilder().addComponents(
            channelSelectMenu
          );

          await msg.edit({ components: [] });
          const msgArchive = await button.channel.send({
            embeds: [displayEmbed],
            components: [actionRow],
          });

          const collectorArchiveMenu =
            msgArchive.createMessageComponentCollector({
              filter,
              max: 1,
              idle: 5 * 60 * 1000,
              componentType: 8,
            });

          collectorArchiveMenu.on("collect", async (menuArchive) => {
            await menuArchive.deferUpdate();
            collectorArchiveMenu.stop();
            const choice = menuArchive.values[0];

            if (!choice) {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ archive_id: null })
                .where({ id: ticketData.id });
            } else {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ archive_id: choice })
                .where({ id: ticketData.id });
            }

            msgArchive.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorArchiveMenu.on("end", async (collected, reason) => {
            if (reason === "idle") {
              await msg.edit({ components: [data[1], data[2], data[3]] });
              msgArchive.delete().catch(() => null);
            }
          });
        } else if (button.customId === "msg_new_ticket") {
          await button.deferUpdate();

          const embedChoice = new EmbedBuilder()
            .setDescription("**Quelle action souhaitez-vous effectuer ?**")
            .setColor(ctx.colors.blue);

          const buttonMention = new ButtonBuilder()
            .setStyle(2)
            .setLabel("Mentionner des rôles")
            .setCustomId("mention_ticket")
            .setEmoji("📢");

          const buttonMessage = new ButtonBuilder()
            .setStyle(2)
            .setLabel("Écrire un message")
            .setCustomId("message_ticket")
            .setEmoji("✍️");

          const actionRowQuestion = new ActionRowBuilder()
            .addComponents(buttonMention)
            .addComponents(buttonMessage);

          await msg.edit({ components: [] });
          const msgQuestion = await button.channel.send({
            embeds: [embedChoice],
            components: [actionRowQuestion],
          });

          const collectorQuestion = msgQuestion.createMessageComponentCollector(
            { filter, max: 1, componentType: 2, idle: 2 * 60 * 1000 }
          );

          collectorQuestion.on("collect", async (buttonQuestion) => {
            collectorQuestion.stop();
            msgQuestion.delete().catch(() => null);

            if (buttonQuestion.customId === "message_ticket") {
              const date = Date.now();
              const modal = new ModalBuilder()
                .setCustomId(`modal_msg_ticket_${date}`)
                .setTitle("Message d'ouverture d'un ticket");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_msg_ticket")
                .setStyle(2)
                .setLabel("Quel message doit être envoyé ?")
                .setRequired(false)
                .setMaxLength(300);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              buttonQuestion.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_msg_ticket_${date}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const message =
                    modal.fields.getTextInputValue("modal_msg_ticket");

                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ msg_ticket: message })
                    .where({ id: ticketData.id });

                  baseTicket = await ctx.database
                    .table("guild_ticket_menu")
                    .select()
                    .where({ guild_id: ctx.guild.id });
                  ticketData = baseTicket.find(
                    (ticket) => ticket.choice_type === ticketData.choice_type
                  );
                  const data = this.displayEmbedAndComponents(
                    ctx,
                    baseTicket,
                    ticketData
                  );
                  await msg.edit({
                    embeds: [data[0]],
                    components: [data[1], data[2], data[3]],
                  });
                });
            } else if (buttonQuestion.customId === "mention_ticket") {
              await buttonQuestion.deferUpdate();
              const displayEmbed = new EmbedBuilder()
                .setDescription(
                  "**Choisir les rôles à mentionner lors de l'ouverture d'un ticket**"
                )
                .setColor(ctx.colors.blue);

              const roleSelectMenu = new RoleSelectMenuBuilder()
                .setCustomId("mention_ticket")
                .setPlaceholder("Rôles du serveur")
                .setMinValues(0)
                .setMaxValues(10);

              if (ticketData.roles_mention)
                roleSelectMenu.setDefaultRoles(
                  JSON.parse(ticketData.roles_mention)
                );

              const actionRow = new ActionRowBuilder().addComponents(
                roleSelectMenu
              );

              const msgRole = await button.channel.send({
                embeds: [displayEmbed],
                components: [actionRow],
              });

              const collectorRoleMenu = msgRole.createMessageComponentCollector(
                { filter, max: 1, idle: 5 * 60 * 1000, componentType: 6 }
              );

              collectorRoleMenu.on("collect", async (menuRole) => {
                await menuRole.deferUpdate();
                const choices = menuRole.values;

                if (!choices) {
                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ roles_mention: null })
                    .where({ id: ticketData.id });
                } else {
                  await ctx.database
                    .table("guild_ticket_menu")
                    .update({ roles_mention: JSON.stringify(choices) })
                    .where({ id: ticketData.id });
                }

                collectorRoleMenu.stop();
                msgRole.delete().catch(() => null);

                baseTicket = await ctx.database
                  .table("guild_ticket_menu")
                  .select()
                  .where({ guild_id: ctx.guild.id });
                ticketData = baseTicket.find(
                  (ticket) => ticket.choice_type === ticketData.choice_type
                );
                const data = this.displayEmbedAndComponents(
                  ctx,
                  baseTicket,
                  ticketData
                );
                await msg.edit({
                  embeds: [data[0]],
                  components: [data[1], data[2], data[3]],
                });
              });

              collectorRoleMenu.on("end", async (collected, reason) => {
                if (reason === "idle") {
                  await msg.edit({ components: [data[1], data[2], data[3]] });
                  return msgRole.delete().catch(() => null);
                }
              });
            }
          });

          collectorQuestion.on("end", async (collected, reason) => {
            if (reason === "idle") {
              await msg.edit({ components: [data[1], data[2], data[3]] });
              return msgQuestion.delete().catch(() => null);
            }
          });
        } else if (button.customId === "embed_new_ticket") {
          await button.deferUpdate();

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

          const reset = new ButtonBuilder()
            .setStyle(1)
            .setEmoji("🔄")
            .setCustomId("e_reset");

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
            .addComponents(reset)
            .addComponents(cancel);

          await msg.edit({ components: [] });
          let msgEmbedForEditing = await button.channel.send({
            embeds: [embedBeforeEdit],
          });
          const msgAwait = await button.channel.send({
            components: [buttonRow1, buttonRow2, buttonRow3],
            content:
              "\":pencil2: Modifier le titre\n:speech_balloon: Modifier la description\n:crown: Modifier l'auteur\n:arrow_down_small: Modifier le footer\n:white_square_button: Modifier le thumbnail\n:camera: Modifier l'image\n:globe_with_meridians: Modifier l'url\n:blue_circle: Modifier la couleur\n:arrow_left: Supprimer un field\n:arrow_right: Ajouter un field\n\uD83D\uDD04 Réinitialiser l'embed\n:white_check_mark: Envoyer l'embed",
          });

          const regexUrl =
            /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
          const regexImage =
            /^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|svg)\??.*$/gim;
          const regexColor = /^#[0-9A-F]{6}$/i;

          function displaySelectMenu(data, type) {
            const fields = [];

            const menu = new StringSelectMenuBuilder()
              .setCustomId(`${type}_ticket`)
              .setPlaceholder("Choisir un salon")
              .setMinValues(1)
              .setMaxValues(1)
              .addOptions([
                {
                  label: "Annuler",
                  value: `cancel_${type}`,
                  description: "Annuler l'action",
                  emoji: `${ctx.emojiError}`,
                },
              ]);

            if (type === "field") menu.setPlaceholder("Choisir un field");

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

          const filter = (button) => button.user.id === ctx.user.id;
          const collectorEmbed = msgAwait.createMessageComponentCollector({
            filter: filter,
            time: 20 * 60 * 1000,
            componentType: 2,
          });

          collectorEmbed.on("collect", async (button) => {
            if (button.customId === "pencil2") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_name_embed_${button.user.id}`)
                .setTitle("Titre");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_name_embed")
                .setStyle(2)
                .setLabel("Quel est le titre ?")
                .setRequired(false)
                .setMaxLength(255);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_name_embed_${button.user.id}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const name =
                    modal.fields.getTextInputValue("modal_name_embed") ||
                    "** **";

                  embedBeforeEdit.setTitle(name);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
            } else if (button.customId === "speech_balloon") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_desc_embed_${button.user.id}`)
                .setTitle("Description");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_desc_embed")
                .setStyle(2)
                .setLabel("Quelle est la description ?")
                .setRequired(false)
                .setMaxLength(4000);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_desc_embed_${button.user.id}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const description =
                    modal.fields.getTextInputValue("modal_desc_embed") ||
                    "** **";

                  embedBeforeEdit.setDescription(description);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
            } else if (button.customId === "crown") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_author_embed_${button.user.id}`)
                .setTitle("Auteur");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_author_embed")
                .setStyle(2)
                .setLabel("Quel est le nom de l'auteur ?")
                .setRequired(false)
                .setMaxLength(255);

              const textInput2 = new TextInputBuilder()
                .setCustomId("modal_author_link_embed")
                .setStyle(2)
                .setLabel("Quel est le lien de l'auteur ?")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              const actionRow2 = new ActionRowBuilder().addComponents(
                textInput2
              );

              modal.addComponents(actionRow, actionRow2);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_author_embed_${button.user.id}`;
              ctx.inter
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
                      content: `${ctx.emojiError} Le lien dinné est invalide !`,
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
                .setTitle("Footer");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_footer_embed")
                .setStyle(2)
                .setLabel("Quel est le texte du footer ?")
                .setRequired(false)
                .setMaxLength(2047);

              const textInput2 = new TextInputBuilder()
                .setCustomId("modal_footer_link_embed")
                .setStyle(2)
                .setLabel("Quel est le lien du footer ?")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              const actionRow2 = new ActionRowBuilder().addComponents(
                textInput2
              );

              modal.addComponents(actionRow, actionRow2);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_footer_embed_${button.user.id}`;
              ctx.inter
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
                      content: `${ctx.emojiError} Le lien donné est invalide !`,
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
                .setTitle("Thumbnail");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_thumbnail_embed")
                .setStyle(2)
                .setLabel("Quel est le lien du thumbnail ?")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_thumbnail_embed_${button.user.id}`;
              ctx.inter
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
                      content: `${ctx.emojiError} Le lien donné est invalide !`,
                      flags: 64,
                    });

                  embedBeforeEdit.setThumbnail(thumbnail);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
            } else if (button.customId === "camera") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_image_embed_${button.user.id}`)
                .setTitle("Image");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_image_embed")
                .setStyle(2)
                .setLabel("Quelle est le lien de l'image ?")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_image_embed_${button.user.id}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const image =
                    modal.fields.getTextInputValue("modal_image_embed") || null;

                  if (image !== null && !regexImage.test(image))
                    return modal.followUp({
                      content: `${ctx.emojiError} Le lien donné est invalide !`,
                      flags: 64,
                    });

                  embedBeforeEdit.setImage(image);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
            } else if (button.customId === "globe_with_meridians") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_link_embed_${button.user.id}`)
                .setTitle("Lien");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_link_embed")
                .setStyle(2)
                .setLabel("Quelle est l'url ?")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_link_embed_${button.user.id}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const link =
                    modal.fields.getTextInputValue("modal_link_embed") || null;

                  if (link !== null && !regexUrl.test(link))
                    return modal.followUp({
                      content: `${ctx.emojiError} Le lien donné est invalide !`,
                      flags: 64,
                    });

                  embedBeforeEdit.setURL(link);
                  await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
                });
            } else if (button.customId === "blue_circle") {
              const modal = new ModalBuilder()
                .setCustomId(`modal_color_embed_${button.user.id}`)
                .setTitle("Couleur");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_color_embed")
                .setStyle(1)
                .setLabel("Quelle est votre couleur ? (héxadécimal)")
                .setRequired(false);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              modal.addComponents(actionRow);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_color_embed_${button.user.id}`;
              ctx.inter
                .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
                .catch(() => null)
                .then(async (modal) => {
                  if (modal === undefined || modal === null) return;
                  await modal.deferUpdate().catch(() => null);
                  const color =
                    modal.fields.getTextInputValue("modal_color_embed") || null;

                  if (color !== null && !regexColor.test(color))
                    return modal.followUp({
                      content: `${ctx.emojiError} La couleur héxadécimale donnée est invalide !`,
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
                  content: `${ctx.emojiError} L'embed ne possède aucun field à supprimer !`,
                  flags: 64,
                });

              const displayEmbed = new EmbedBuilder()
                .setDescription("**Quel field souhaitez-vous supprimer ?**")
                .setColor(ctx.guild.members.me.displayHexColor);

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
                        displaySelectMenu(data_list[page - 1], "field"),
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
                      displaySelectMenu(data_list[page - 1], "field"),
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
                  await button.deferUpdate();
                  if (button.customId === "field_left") {
                    page--;

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
                          displaySelectMenu(data_list[page - 1], "field"),
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
                      `Page : ${page}/${data_list.length}`,
                      page,
                      data_list.length
                    );
                    const component2 = [
                      {
                        type: 1,
                        components: [
                          displaySelectMenu(data_list[page - 1], "field"),
                        ],
                      },
                    ];
                    const components = component1.concat(component2);

                    msgSend.edit({ components: components });
                  }
                });
              }

              const collectorSendMenu = msgSend.createMessageComponentCollector(
                { filter: filter, time: 5 * 60 * 1000, componentType: 3 }
              );

              collectorSendMenu.on("collect", async (menuSend) => {
                await menuSend.deferUpdate();
                collectorSendMenu.stop();
                const choice = menuSend.values[0];
                msgSend.delete().catch(() => null);

                if (choice !== "cancel_field") {
                  const field = embedBeforeEdit.data.fields[choice].name;

                  const embed = new EmbedBuilder()
                    .setDescription(
                      `**Êtes-vous sur de vouloir supprimer le field ${field} ?**`
                    )
                    .setColor(ctx.guild.members.me.displayHexColor);

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
                      filter: filter,
                      max: 1,
                      time: 5 * 60 * 1000,
                    });
                  collectorConfirmReset.on("collect", async (buttonConfirm) => {
                    await buttonConfirm.deferUpdate();
                    collectorConfirmReset.stop();
                    msgConfirm.delete().catch(() => null);

                    if (buttonConfirm.customId === "embed_field_no") return;
                    embedBeforeEdit.data.fields.splice(choice, 1);
                    await msgEmbedForEditing.edit({
                      embeds: [embedBeforeEdit],
                    });
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
                  content: `${ctx.emojiError} Vous avez atteint la limite de 25 fields !`,
                  flags: 64,
                });
              }

              const modal = new ModalBuilder()
                .setCustomId(`modal_add_field_embed_${button.user.id}`)
                .setTitle("Field");

              const textInput = new TextInputBuilder()
                .setCustomId("modal_add_field_name_embed")
                .setStyle(2)
                .setLabel("Quel est le nom ?")
                .setRequired(true)
                .setMaxLength(255);

              const textInput2 = new TextInputBuilder()
                .setCustomId("modal_add_field_value_embed")
                .setStyle(2)
                .setLabel("Quel est le contenu ?")
                .setRequired(false)
                .setMaxLength(1023);

              const actionRow = new ActionRowBuilder().addComponents(textInput);

              const actionRow2 = new ActionRowBuilder().addComponents(
                textInput2
              );

              modal.addComponents(actionRow, actionRow2);

              button.showModal(modal).catch(() => null);

              const filterModal = (modal) =>
                modal.customId === `modal_add_field_embed_${button.user.id}`;
              ctx.inter
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
                .setDescription("**Êtes-vous sur de finaliser l'embed ?**")
                .setColor(ctx.guild.members.me.displayHexColor);

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
                  filter: filter,
                  max: 1,
                  time: 5 * 60 * 1000,
                });
              collectorConfirmReset.on("collect", async (buttonConfirm) => {
                await buttonConfirm.deferUpdate();
                collectorConfirmReset.stop();
                msgConfirm.delete().catch(() => null);

                if (buttonConfirm.customId === "embed_send_no") return;

                await ctx.database
                  .table("guild_ticket_menu")
                  .update({
                    embed_ticket: true,
                    embed_data: JSON.stringify(embedBeforeEdit.toJSON()),
                  })
                  .where({ id: ticketData.id });

                await msgAwait.delete().catch(() => null);
                await msgEmbedForEditing.delete().catch(() => null);
                collectorEmbed.stop();

                baseTicket = await ctx.database
                  .table("guild_ticket_menu")
                  .select()
                  .where({ guild_id: ctx.guild.id });
                ticketData = baseTicket.find(
                  (ticket) => ticket.choice_type === ticketData.choice_type
                );
                const data = this.displayEmbedAndComponents(
                  ctx,
                  baseTicket,
                  ticketData
                );
                await msg.edit({
                  embeds: [data[0]],
                  components: [data[1], data[2], data[3]],
                });
              });
            } else if (button.customId === "e_cancel") {
              await button.deferUpdate();

              await msgAwait.delete().catch(() => null);
              await msgEmbedForEditing.delete().catch(() => null);
              collectorEmbed.stop();
            } else if (button.customId === "e_reset") {
              await button.deferUpdate();

              const embed = new EmbedBuilder()
                .setDescription(
                  "**Êtes-vous sur de vouloir réinitialiser l'embed ?**"
                )
                .setColor(ctx.guild.members.me.displayHexColor);

              const msgConfirm = await button.channel.send({
                embeds: [embed],
                components: ctx.messageFormatter.question(
                  `embed_reset_yes`,
                  `${ctx.emojiSuccess}`,
                  `embed_reset_no`,
                  `${ctx.emojiError}`
                ),
              });

              const collectorConfirmReset =
                msgConfirm.createMessageComponentCollector({
                  filter: filter,
                  max: 1,
                  time: 5 * 60 * 1000,
                });
              collectorConfirmReset.on("collect", async (buttonConfirm) => {
                await buttonConfirm.deferUpdate();
                collectorConfirmReset.stop();
                msgConfirm.delete().catch(() => null);

                if (buttonConfirm.customId === "embed_reset_no") return;

                await ctx.database
                  .table("guild_ticket_menu")
                  .update({ embed_ticket: false, embed_data: null })
                  .where({ id: ticketData.id });

                await msgAwait.delete().catch(() => null);
                await msgEmbedForEditing.delete().catch(() => null);
                collectorEmbed.stop();

                baseTicket = await ctx.database
                  .table("guild_ticket_menu")
                  .select()
                  .where({ guild_id: ctx.guild.id });
                ticketData = baseTicket.find(
                  (ticket) => ticket.choice_type === ticketData.choice_type
                );
                const data = this.displayEmbedAndComponents(
                  ctx,
                  baseTicket,
                  ticketData
                );
                await msg.edit({
                  embeds: [data[0]],
                  components: [data[1], data[2], data[3]],
                });
              });
            }
          });
        } else if (button.customId === "number_ticket") {
          await button.deferUpdate();

          if (
            ticketData.number_ticket === 0 ||
            ticketData.number_ticket === null
          )
            return button.followUp({
              content: `${ctx.emojiError} Le compteur de tickets est déjà à 0 !`,
              flags: 64,
            });

          const embed = new EmbedBuilder()
            .setDescription(
              "**Souhaitez-vous réinitialiser le compteur de tickets ?**"
            )
            .setColor(ctx.colors.blue);

          await msg.edit({ components: [] });
          const msgConfirmResetNumber = await button.channel.send({
            embeds: [embed],
            components: ctx.messageFormatter.question(
              `yes`,
              `${ctx.emojiSuccess}`,
              `no`,
              `${ctx.emojiError}`
            ),
          });

          const collectorConfirmReset =
            msgConfirmResetNumber.createMessageComponentCollector({
              filter,
              max: 1,
              idle: 5 * 60 * 1000,
            });
          collectorConfirmReset.on("collect", async (buttonConfirm) => {
            await buttonConfirm.deferUpdate();
            collectorConfirmReset.stop();

            if (buttonConfirm.customId === "no")
              return msgConfirmResetNumber.delete().catch(() => null);

            await ctx.database
              .table("guild_ticket_menu")
              .update({ number_ticket: 0 })
              .where({ id: ticketData.id });

            msgConfirmResetNumber.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorConfirmReset.on("end", async (collected, reason) => {
            if (reason === "idle") {
              await msg.edit({ components: [data[1], data[2], data[3]] });
              return msgConfirmResetNumber.delete().catch(() => null);
            }
          });
        } else if (button.customId === "reset_ticket") {
          await button.deferUpdate();

          const embed = new EmbedBuilder()
            .setDescription(
              "**Souhaitez-vous réinitialiser la catégorie ?**\n\n**Cela supprimera toutes les données concernant celle-ci.**"
            )
            .setColor(ctx.colors.blue);

          await msg.edit({ components: [] });
          const msgConfirmReset = await button.channel.send({
            embeds: [embed],
            components: ctx.messageFormatter.question(
              `yes`,
              `${ctx.emojiSuccess}`,
              `no`,
              `${ctx.emojiError}`
            ),
          });

          const collectorConfirmReset =
            msgConfirmReset.createMessageComponentCollector({
              filter,
              max: 1,
              idle: 5 * 60 * 1000,
            });

          collectorConfirmReset.on("collect", async (buttonConfirm) => {
            await buttonConfirm.deferUpdate();
            collectorConfirmReset.stop();

            if (buttonConfirm.customId === "yes") {
              await ctx.database
                .table("guild_ticket_menu")
                .update({
                  category_id: null,
                  category_close_id: null,
                  name_ticket: null,
                  roles_access: JSON.stringify([]),
                  log_id: null,
                  archive_id: null,
                  embed_ticket: null,
                  embed_data: null,
                  roles_mention: null,
                  msg_ticket: null,
                  number_ticket: 0,
                })
                .where({ id: ticketData.id });
            }

            msgConfirmReset.delete().catch(() => null);

            baseTicket = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            ticketData = baseTicket.find(
              (ticket) => ticket.choice_type === ticketData.choice_type
            );
            const data = this.displayEmbedAndComponents(
              ctx,
              baseTicket,
              ticketData
            );
            await msg.edit({
              embeds: [data[0]],
              components: [data[1], data[2], data[3]],
            });
          });

          collectorConfirmReset.on("end", async (collected, reason) => {
            if (reason === "idle") {
              await msg.edit({ components: [data[1], data[2], data[3]] });
              return msgConfirmReset.delete().catch(() => null);
            }
          });
        } else if (button.customId === "cancel_ticket") {
          await button.deferUpdate();

          msg.edit({ components: [] }).catch(() => null);
          collector.stop();
        }
      });
    } else if (subCommand === "send-menu") {
      const color = ctx.options.getString("couleur");
      const text = ctx.options.getString("texte") || null;
      const emoji = ctx.options.getString("emoji") || null;

      if (!text && !emoji)
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Vous devez renseigner un texte ou un emoji !`,
          flags: 64,
        });

      const baseTicket = await ctx.database
        .table("guild_ticket_menu")
        .select()
        .where({ guild_id: ctx.guild.id, first_type: true });
      if (!baseTicket[0] || !baseTicket[0].embed_ticket)
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Cette commande n'est pas disponible car non configuré !`,
          flags: 64,
        });

      const embedJson = JSON.parse(baseTicket[0].embed_data);

      const openTicket = new ButtonBuilder()
        .setStyle(Number(color))
        .setCustomId("create_ticket_menu");

      if (text) openTicket.setLabel(text);

      let emote = null;
      if (emoji) {
        const emojiDiscord = parseEmoji(emoji);
        if (emojiDiscord.id) {
          const guildEmoji = ctx.client.emojis.cache.get(emojiDiscord.id);
          if (!guildEmoji)
            return ctx.send({
              content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
              flags: 64,
            });

          emote = guildEmoji.toString();
        } else {
          const parsedEmoji = parse(emoji);
          if (!parsedEmoji[0])
            return ctx.send({
              content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
              flags: 64,
            });

          emote = emoji;
        }

        if (emote) openTicket.setEmoji(emote);
      }

      if (!text && !emote)
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Vous devez renseigner un texte ou un emoji !`,
          flags: 64,
        });

      const buttonRow = new ActionRowBuilder().addComponents(openTicket);

      await ctx
        .send({ content: ":eyes:", flags: 64 })
        .then(async (msg) => ctx.inter.deleteReply(msg.id))
        .catch(() => null);

      ctx.channel.send({ embeds: [embedJson], components: [buttonRow] });
    } else if (subCommand === "customise") {
      const baseTicket = await ctx.database
        .table("guild_ticket_menu")
        .select("choice_type", "emoji", "description")
        .where({ guild_id: ctx.guild.id });
      if (!baseTicket[0])
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Cette commande n'est pas disponible car non configuré !`,
          flags: 64,
        });

      function displayMenu(allDatabase) {
        const getAllTypeTickets = ctx.ticket.getAllTypeTickets(
          ctx.inter,
          allDatabase,
          ctx
        );

        const menu = new StringSelectMenuBuilder()
          .setPlaceholder(ctx.translate`Choisir une catégorie`)
          .setMinValues(1)
          .setMaxValues(1)
          .setCustomId("choice_type")
          .addOptions([
            {
              label: ctx.translate`Annuler`,
              description: ctx.translate`Annuler l'action`,
              emoji: `${ctx.emojiError}`,
              value: "cancel_customise",
            },
          ])
          .addOptions(
            getAllTypeTickets.map((type) => {
              return {
                label: ctx.ticket.formatString(type.choice_type),
                description: type.description,
                emoji: type.emoji,
                value: type.choice_type,
              };
            })
          );

        return new ActionRowBuilder().addComponents(menu);
      }

      function displaySelectMenuPages(data) {
        return new StringSelectMenuBuilder()
          .setCustomId("choice_emoji")
          .setPlaceholder(ctx.translate`Choisir un emoji`)
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: ctx.translate`Fermer`,
              description: ctx.translate`Fermer le menu`,
              emoji: `${ctx.emojiError}`,
              value: "cancel_emoji",
            },
          ])
          .addOptions(data);
      }

      const buttonEmoji = new ButtonBuilder()
        .setCustomId("t_emote")
        .setLabel(ctx.translate`Emoji`)
        .setStyle(2);

      const buttonDesc = new ButtonBuilder()
        .setCustomId("t_description")
        .setLabel(ctx.translate`Description`)
        .setStyle(2);

      const buttonStop = new ButtonBuilder()
        .setCustomId("t_stop")
        .setLabel(ctx.translate`Fermer`)
        .setStyle(4);

      const actionRowButton = new ActionRowBuilder()
        .addComponents(buttonEmoji)
        .addComponents(buttonDesc)
        .addComponents(buttonStop);

      const embed = new EmbedBuilder()
        .setDescription(
          ctx.translate`**Veuillez choisir une catégorie à modifier**`
        )
        .setColor(ctx.colors.blue);

      const msg = await ctx.send({
        embeds: [embed],
        components: [displayMenu(baseTicket)],
      });

      const filter = (component) => component.user.id === ctx.user.id;
      const collectorMenu = msg.createMessageComponentCollector({
        filter,
        componentType: 3,
        idle: 10 * 60 * 1000,
      });
      const collectorButton = msg.createMessageComponentCollector({
        filter,
        componentType: 2,
        idle: 10 * 60 * 1000,
      });

      let choiceType;

      collectorMenu.on("collect", async (menu) => {
        await menu.deferUpdate();
        if (menu.customId !== "choice_type") return;
        const choice = menu.values[0];

        if (choice === "cancel_customise") {
          msg.edit({ components: [] }).catch(() => null);
          return collectorMenu.stop();
        }
        choiceType = choice;

        const embedEdited = new EmbedBuilder()
          .setDescription(
            ctx.translate`**Veuillez choisir une option à modifier**`
          )
          .setColor(ctx.colors.blue);

        msg.edit({ embeds: [embedEdited], components: [actionRowButton] });
      });

      collectorButton.on("collect", async (button) => {
        if (button.customId === "t_description") {
          const date = Date.now();
          const modal = new ModalBuilder()
            .setCustomId(`modal_customize_description_${date}`)
            .setTitle(ctx.translate`Description`);

          const textInput = new TextInputBuilder()
            .setCustomId("modal_customize_description")
            .setStyle(2)
            .setLabel(ctx.translate`Quelle est la description ?`)
            .setRequired(false)
            .setMaxLength(98);

          const actionRow = new ActionRowBuilder().addComponents(textInput);

          modal.addComponents(actionRow);

          button.showModal(modal).catch(() => null);

          const filterModal = (modal) =>
            modal.customId === `modal_customize_description_${date}`;
          ctx.inter
            .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
            .catch(() => null)
            .then(async (modal) => {
              if (modal === undefined || modal === null) return false;
              await modal.deferUpdate().catch(() => null);
              const description =
                modal.fields.getTextInputValue("modal_customize_description") ||
                null;

              await ctx.database
                .table("guild_ticket_menu")
                .update({ description: description })
                .where({ guild_id: ctx.guild.id, choice_type: choiceType });

              await button.followUp({
                content: ctx.translate`${ctx.emojiSuccess} La description a bien été modifiée !`,
                flags: 64,
              });

              const baseTicketEdited = await ctx.database
                .table("guild_ticket_menu")
                .select()
                .where({ guild_id: ctx.guild.id });
              await msg.edit({
                embeds: [embed],
                components: [displayMenu(baseTicketEdited)],
              });
            });
        } else if (button.customId === "t_emote") {
          await button.deferUpdate();
          msg.edit({ components: [] }).catch(() => null);

          const getAllEmojis = ctx.guild.emojis.cache.map((emoji) => {
            return {
              emoji: `<:${emoji.name}:${emoji.id}>`,
              label: emoji.name,
              value: emoji.id,
            };
          });

          if (getAllEmojis.length === 0)
            return button.followUp({
              content: ctx.translate`${ctx.emojiError} Il n'y a aucun emoji sur le serveur !`,
              flags: 64,
            });

          const embedEmoji = new EmbedBuilder()
            .setDescription(ctx.translate`**Veuillez choisir un emoji**`)
            .setColor(ctx.colors.blue);

          const data_list = ctx.utils.getNumberPacket(getAllEmojis, 20);
          let page = 1;
          let msgEmote;

          if (data_list.length === 1) {
            msgEmote = await button.channel.send({
              embeds: [embedEmoji],
              components: [
                {
                  type: 1,
                  components: [displaySelectMenuPages(data_list[page - 1])],
                },
              ],
            });
          } else {
            const component1 = ctx.messageFormatter.pages(
              "left",
              "middle",
              "right",
              ctx.translate`Page ${page}/${data_list.length}`,
              page,
              data_list.length
            );
            const component2 = [
              {
                type: 1,
                components: [displaySelectMenuPages(data_list[page - 1])],
              },
            ];
            const components = component1.concat(component2);

            msgEmote = await button.channel.send({
              embeds: [embedEmoji],
              components: components,
            });

            const collectorCategoryButton =
              msgEmote.createMessageComponentCollector({
                filter,
                time: 5 * 60 * 1000,
                componentType: 2,
              });

            collectorCategoryButton.on("collect", async (button) => {
              if (!["left", "right"].includes(button.customId)) return;
              await button.deferUpdate();

              button.customId === "left" ? page-- : page++;

              const component1 = ctx.messageFormatter.pages(
                "left",
                "middle",
                "right",
                ctx.translate`Page ${page}/${data_list.length}`,
                page,
                data_list.length
              );
              const component2 = [
                {
                  type: 1,
                  components: [displaySelectMenuPages(data_list[page - 1])],
                },
              ];
              const components = component1.concat(component2);

              msgEmote.edit({ components: components });
            });
          }

          const collectorEmoji = msgEmote.createMessageComponentCollector({
            filter,
            componentType: 3,
            time: 10 * 60 * 1000,
          });

          collectorEmoji.on("collect", async (menuEmoji) => {
            await menuEmoji.deferUpdate();
            if (menuEmoji.customId !== "choice_emoji") return;
            const choice = menuEmoji.values[0];

            if (choice !== "cancel_emoji") {
              await ctx.database
                .table("guild_ticket_menu")
                .update({ emoji: choice })
                .where({
                  guild_id: ctx.guild.id,
                  choice_type: choiceType,
                });

              await button.followUp({
                content: ctx.translate`${ctx.emojiSuccess} L'emoji a bien été modifié !`,
                flags: 64,
              });
            }

            msgEmote.delete().catch(() => null);
            const baseTicketEdited = await ctx.database
              .table("guild_ticket_menu")
              .select()
              .where({ guild_id: ctx.guild.id });
            msg.edit({
              embeds: [embed],
              components: [displayMenu(baseTicketEdited)],
            });
            collectorEmoji.stop();
          });
        } else if (button.customId === "t_stop") {
          await button.deferUpdate();

          msg.edit({ components: [] }).catch(() => null);
          collectorMenu.stop();
          collectorButton.stop();
        }
      });

      collectorMenu.on("end", (_, reason) => {
        if (reason === "idle")
          if (msg.components.length > 0)
            return msg.edit({ components: [] }).catch(() => null);
      });
    }
  }
};
