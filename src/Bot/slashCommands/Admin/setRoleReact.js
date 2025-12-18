const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  RoleSelectMenuBuilder,
} = require("discord.js");
const { parse } = require("twemoji-parser");
const axios = require("axios");

module.exports = class SetRoleReact extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "role-react",
      description: "Gérer le système de role reaction",
      options: [
        {
          name: "configurer",
          description: "Configurer le système de role reaction",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer complètement le système de role reaction",
          type: 1,
        },
        {
          name: "afficher",
          description: "Afficher le système de role reaction",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const database = await ctx.database
      .table("guild_reaction_role")
      .select()
      .where({ guild_id: ctx.guild.id });

    if (subCommand === "configurer") {
      let embedBeforeEdit;
      let rolesChosen = [];

      if (!database[0]) {
        embedBeforeEdit = new EmbedBuilder()
          .setTitle(ctx.translate`Aucun titre paramétré`)
          .setThumbnail(ctx.client.user.displayAvatarURL())
          .setColor(ctx.colors.blue)
          .setFooter({
            text: "abot",
            iconURL: ctx.client.user.displayAvatarURL(),
          });
      } else {
        const embedData = JSON.parse(database[0].embed_data);
        embedBeforeEdit = EmbedBuilder.from(embedData);
        rolesChosen = JSON.parse(database[0].roles_id);
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`reaction_role`)
        .setPlaceholder(ctx.translate`Choisir une action`)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: ctx.translate`Valider`,
            value: `validate`,
            description: ctx.translate`Valider le reaction role`,
            emoji: `${ctx.emojiSuccess}`,
          },
          {
            label: ctx.translate`Annuler`,
            value: `cancel`,
            description: ctx.translate`Annuler le reaction role`,
            emoji: `${ctx.emojiError}`,
          },
          {
            label: ctx.translate`Titre`,
            value: `title`,
            description: ctx.translate`Modifier le titre`,
            emoji: `🔑`,
          },
          {
            label: ctx.translate`Ajouter`,
            value: `add`,
            description: ctx.translate`Ajouter un rôle`,
            emoji: `⬆️`,
          },
          {
            label: ctx.translate`Supprimer`,
            value: `remove`,
            description: ctx.translate`Supprimer un rôle`,
            emoji: `⬇️`,
          },
          {
            label: ctx.translate`Cliquer ici pour ne rien faire`,
            value: "nothing",
            emoji: "💤",
          },
        ]);

      const actionRow = new ActionRowBuilder().addComponents(menu);

      const msgEmbedForEditing = await ctx.send({
        embeds: [embedBeforeEdit],
        components: [actionRow],
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
              ctx.translate`**Êtes-vous sur de vouloir sauvegarder les modifications ?**`
            )
            .setColor(ctx.colors.blue);

          const msgConfirm = await menu.followUp({
            embeds: [embed],
            components: ctx.messageFormatter.question(
              `reaction_save_yes`,
              `${ctx.emojiSuccess}`,
              `reaction_save_no`,
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

            if (buttonConfirm.customId === "reaction_save_no") return;
            if (rolesChosen.length === 0)
              return menu.followUp({
                content: ctx.translate`${ctx.emojiError} Vous devez ajouter au moins un rôle !`,
                flags: 64,
              });

            const embedData = JSON.stringify(embedBeforeEdit);
            const rolesId = JSON.stringify(rolesChosen);

            if (!database[0]) {
              await ctx.database.table("guild_reaction_role").insert({
                guild_id: ctx.guild.id,
                embed_data: embedData,
                roles_id: rolesId,
              });
            } else {
              await ctx.database
                .table("guild_reaction_role")
                .update({
                  embed_data: embedData,
                  roles_id: rolesId,
                })
                .where({ guild_id: ctx.guild.id });
            }
            msgEmbedForEditing.delete().catch(() => null);
            await menu.channel.send({
              content: ctx.translate`${ctx.emojiSuccess} Le reaction role a bien été sauvegardé !`,
            });
            collector.stop();
          });

          collectorConfirmReset.on("end", (collected, reason) => {
            if (reason === "idle") {
              msgConfirm.delete().catch(() => null);
            }
          });
        } else if (choice === "cancel") {
          await menu.deferUpdate();
          msgEmbedForEditing.edit({ components: [] }).catch(() => null);
          collector.stop();
        } else if (choice === "title") {
          const modal = new ModalBuilder()
            .setCustomId(`modal_title_${menu.user.id}`)
            .setTitle(ctx.translate`Titre du reaction role`);

          const textInput = new TextInputBuilder()
            .setCustomId("modal_title")
            .setStyle(2)
            .setLabel(ctx.translate`Titre du reaction role`)
            .setRequired(true)
            .setMaxLength(255);

          const actionRow = new ActionRowBuilder().addComponents(textInput);

          modal.addComponents(actionRow);

          menu.showModal(modal).catch(() => null);

          const filterModal = (modal) =>
            modal.customId === `modal_title_${menu.user.id}`;
          menu
            .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
            .catch(() => null)
            .then(async (modal) => {
              if (modal === undefined || modal === null) return;
              await modal.deferUpdate().catch(() => null);
              const name = modal.fields.getTextInputValue("modal_title");

              embedBeforeEdit.setTitle(name);

              await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
            });
        } else if (choice === "add") {
          if (
            embedBeforeEdit.data.fields !== undefined &&
            embedBeforeEdit.data.fields.length >= 25
          ) {
            await menu.deferUpdate();
            return menu.followUp({
              content: ctx.translate`${ctx.emojiError} Vous avez atteint le nombre de rôles maximum autorisé !`,
              flags: 64,
            });
          }

          const dateRole = Date.now();
          const modal = new ModalBuilder()
            .setCustomId(`modal_add_field_${dateRole}`)
            .setTitle(ctx.translate`Description du field`);

          const textInput = new TextInputBuilder()
            .setCustomId("modal_add_field_value")
            .setStyle(2)
            .setLabel(ctx.translate`Description du field`)
            .setRequired(false)
            .setMaxLength(1023);

          const actionRow = new ActionRowBuilder().addComponents(textInput);

          modal.addComponents(actionRow);

          menu.showModal(modal).catch(() => null);

          const filterModal = (modal) =>
            modal.customId === `modal_add_field_${dateRole}`;
          menu
            .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
            .catch(() => null)
            .then(async (modal) => {
              if (modal === undefined || modal === null) return;
              await modal.deferUpdate().catch(() => null);
              const value =
                modal.fields.getTextInputValue("modal_add_field_value") || null;

              const embed = new EmbedBuilder()
                .setTitle(ctx.translate`Rôle à ajouter`)
                .setDescription(
                  ctx.translate`Quelle rôle souhaitez-vous ajouter ?`
                )
                .setColor(ctx.colors.blue);

              const roleSelectMenu = new RoleSelectMenuBuilder()
                .setCustomId("role_reaction")
                .setPlaceholder(ctx.translate`Choisir un rôle`)
                .setMinValues(1)
                .setMaxValues(1);

              const actionRow = new ActionRowBuilder().addComponents(
                roleSelectMenu
              );

              const msgRole = await modal.followUp({
                embeds: [embed],
                components: [actionRow],
              });

              const collectorRoleMenu = msgRole.createMessageComponentCollector(
                { filter, time: 5 * 60 * 1000, componentType: 6 }
              );

              collectorRoleMenu.on("collect", async (menuRole) => {
                const roles = menuRole.roles;
                if (roles.size === 0) {
                  await menuRole.deferUpdate();
                  collectorRoleMenu.stop();
                  msgRole.delete().catch(() => null);
                } else {
                  const rolesFiltered = roles
                    .map((role) => role)
                    .filter(
                      (role) =>
                        role.id !== ctx.guild.id &&
                        role.managed === false &&
                        role.position <
                          ctx.guild.members.me.roles.highest.position
                    );

                  if (rolesFiltered.length === 0)
                    return menuRole
                      .reply({
                        content: ctx.translate`${ctx.emojiError} Vous devez sélectionner un rôle qui n\'est pas géré par un bot, et qui est en dessous de mon rôle le plus haut !`,
                        flags: 64,
                      })
                      .catch(() => null);
                  rolesChosen.push(rolesFiltered[0].id);

                  const date = Date.now();
                  const modalEmoji = new ModalBuilder()
                    .setCustomId(`modal_emoji_${date}`)
                    .setTitle(ctx.translate`Ajouter un emoji`);

                  const textInputEmoji = new TextInputBuilder()
                    .setCustomId("modal_emoji")
                    .setStyle(1)
                    .setLabel(
                      ctx.translate`Quel emoji souhaitez-vous utiliser ?`
                    )
                    .setRequired(false);

                  const actionRowEmoji = new ActionRowBuilder().addComponents(
                    textInputEmoji
                  );

                  modalEmoji.addComponents(actionRowEmoji);

                  await menuRole.showModal(modalEmoji).catch(() => null);

                  const filterModal2 = (modalEmoji) =>
                    modalEmoji.customId === `modal_emoji_${date}`;
                  menuRole
                    .awaitModalSubmit({
                      filter: filterModal2,
                      time: 5 * 60 * 1000,
                    })
                    .catch(() => null)
                    .then(async (modalEmoji) => {
                      if (modalEmoji === undefined || modalEmoji === null)
                        return;
                      await modalEmoji.deferUpdate().catch(() => null);
                      const emoji =
                        modalEmoji.fields.getTextInputValue("modal_emoji");

                      if (emoji) {
                        /* Check if the emoji is valid */
                        const regexNumber = /\d+/g;
                        const emojiId = emoji.match(regexNumber);

                        /* Is a custom emoji */
                        if (emojiId) {
                          const guildEmoji = ctx.guild.emojis.cache.get(
                            emojiId[0]
                          );
                          if (!guildEmoji) {
                            return modalEmoji.followUp({
                              content: ctx.translate`${ctx.emojiError} L'emoji donné est incorrect !`,
                              flags: 64,
                            });
                          }
                        } else {
                          const parsedEmoji = parse(emoji);
                          if (!parsedEmoji[0]) {
                            return modalEmoji.followUp({
                              content: ctx.translate`${ctx.emojiError} L'emoji donné est incorrect !`,
                              flags: 64,
                            });
                          }

                          // Get only the id of the emoji in the url : https://twemoji.maxcdn.com/v/latest/svg/id.svg
                          const emojiIdUrl = parsedEmoji[0].url
                            .split("/")
                            .pop()
                            .split(".")[0];

                          /* Check if the url is valid with an axios request */
                          await axios
                            .get(
                              `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emojiIdUrl}.svg`
                            )
                            .then((res) => {
                              /* If the status code is not 200, it means that the url is not valid */
                              if (res.status !== 200) {
                                return modalEmoji.followUp({
                                  content: ctx.translate`${ctx.emojiError} L'emoji donné est incorrect !`,
                                  flags: 64,
                                });
                              }
                            })
                            .catch(() => {
                              return modalEmoji.followUp({
                                content: ctx.translate`${ctx.emojiError} L'emoji donné est incorrect !`,
                                flags: 64,
                              });
                            });
                        }
                      }

                      embedBeforeEdit.addFields([
                        {
                          name: `${emoji ? `${emoji} ` : ""}${
                            rolesFiltered[0].name
                          }`,
                          value: value !== null ? value : "\u200b",
                          inline: true,
                        },
                      ]);

                      await msgEmbedForEditing.edit({
                        embeds: [embedBeforeEdit],
                      });

                      msgRole.delete().catch(() => null);
                      collectorRoleMenu.stop();
                    });
                }
              });

              collectorRoleMenu.on("end", async (collected, reason) => {
                if (reason === "time") {
                  msgRole.delete().catch(() => null);
                }
              });
            });
        } else if (choice === "remove") {
          await menu.deferUpdate();

          if (
            embedBeforeEdit.data.fields === undefined ||
            embedBeforeEdit.data.fields.length === 0
          )
            return menu.followUp({
              content: ctx.translate`${ctx.emojiError} Il n\'y a aucun rôle à supprimer !`,
              flags: 64,
            });

          const displayEmbed = new EmbedBuilder()
            .setDescription(
              ctx.translate`**Quel rôle souhaitez-vous supprimer ?**`
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
            .setCustomId(`reaction_role_remove`)
            .setPlaceholder(ctx.translate`Choisir un rôle`)
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
              {
                label: ctx.translate`Annuler`,
                value: `cancel_field`,
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
                  ctx.translate`**Êtes-vous sur de vouloir supprimer le rôle ${field} ?**`
                )
                .setColor(ctx.colors.blue);

              const msgConfirm = await menuSend.channel.send({
                embeds: [embed],
                components: ctx.messageFormatter.question(
                  `field_yes`,
                  `${ctx.emojiSuccess}`,
                  `field_no`,
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

                if (buttonConfirm.customId === "field_no") return;
                embedBeforeEdit.data.fields.splice(choice, 1);
                rolesChosen.splice(choice, 1);
                await msgEmbedForEditing.edit({ embeds: [embedBeforeEdit] });
              });

              collectorConfirmReset.on("end", async (collected, reason) => {
                if (reason === "idle") {
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
        } else if (choice === "nothing") {
          await menu.deferUpdate();
        }
      });

      collector.on("end", async (_, reason) => {
        if (reason === "idle")
          return msgEmbedForEditing.edit({ components: [] }).catch(() => null);
      });
    } else if (subCommand === "supprimer") {
      if (!database[0])
        return ctx.error(
          ctx.translate`Aucun réaction role n\'est configuré sur ce serveur !`
        );

      await ctx.database
        .table("guild_reaction_role")
        .delete()
        .where({ guild_id: ctx.guild.id });
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le réaction role a bien été complètement supprimé !`,
      });
    } else if (subCommand === "afficher") {
      if (!database[0])
        return ctx.error(
          ctx.translate`Aucun réaction role n\'est configuré sur ce serveur !`
        );

      const embedData = JSON.parse(database[0].embed_data);
      const rolesData = JSON.parse(database[0].roles_id);

      const embed = EmbedBuilder.from(embedData);

      const displayMenu = new StringSelectMenuBuilder()
        .setCustomId(`reaction_role_display`)
        .setPlaceholder(ctx.translate`Choisir un rôle`)
        .setMinValues(0)
        .setMaxValues(rolesData.length);

      for (const row of rolesData) {
        const role = ctx.getRole(row);
        if (!role) continue;

        displayMenu.addOptions([
          {
            label: `${role.name}`,
            value: `${row}`,
            emoji: `💠`,
          },
        ]);
      }

      const actionRow = new ActionRowBuilder().addComponents(displayMenu);

      await ctx.success(ctx.translate`Le réaction a bien été envoyé !`);
      ctx.channel.send({ embeds: [embed], components: [actionRow] });
    }
  }
};
