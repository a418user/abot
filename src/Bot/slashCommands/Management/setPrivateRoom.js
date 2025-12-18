const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  TextInputBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = class VoiceSettings extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "vocal-privé-config",
      description: "Configurer les salons vocaux temporaires",
      category: SlashCommand.Categories.Management,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks", "ManageChannels"],
    });

    this.listPermissions = [
      "ManageChannels",
      "ManageRoles",
      "ViewChannel",
      "Connect",
      "Speak",
      "Stream",
      "UseEmbeddedActivities",
      "UseVAD",
      "PrioritySpeaker",
      "MoveMembers",
      "MuteMembers",
      "DeafenMembers",
      "SendMessages",
      "EmbedLinks",
      "AttachFiles",
      "AddReactions",
      "UseExternalEmojis",
      "MentionEveryone",
      "ManageMessages",
      "UseApplicationCommands",
    ];
  }

  displayEmbed(ctx, data) {
    const waitingStatus = data.waitingChannel
      ? ctx.emojiSuccess
      : ctx.emojiError;
    const protectStatus = data.permissionsProtect
      ? ctx.emojiSuccess
      : ctx.emojiError;
    const categoryDisplay = ctx.getChannel(data.categoryId)
      ? `\`${ctx.getChannel(data.categoryId).name}\``
      : `\`${ctx.translate`Non défini`}\``;
    const hubDisplay = ctx.getChannel(data.channelStartId)
      ? `\`${ctx.getChannel(data.channelStartId).name}\``
      : `\`${ctx.translate`Non défini`}\``;
    const voiceName = `\`\`\`${data.channelName}\`\`\``;
    const waitingName = `\`\`\`${data.channelWaitingName}\`\`\``;
    const limitValue = `\`\`\`${data.channelLimit}\`\`\``;
    const formatRoleValue = (roleId) =>
      ctx.getRole(roleId)
        ? `> \`${ctx.getRole(roleId).name}\``
        : ctx.translate`> Invalide`;
    const emptyRoleValue = `\`${ctx.translate`Aucun`}\``;
    const managerValue =
      data.rolesManager.map(formatRoleValue).join("\n") || emptyRoleValue;
    const acceptedValue =
      data.rolesAccepted.map(formatRoleValue).join("\n") || emptyRoleValue;
    const refusedValue =
      data.rolesRefused.map(formatRoleValue).join("\n") || emptyRoleValue;

    return new EmbedBuilder()
      .setTitle(ctx.translate`Paramètres des salons vocaux temporaires`)
      .setColor(ctx.colors.blue)
      .addFields([
        {
          name: ctx.translate`» Général`,
          value: ctx.translate`> **Salon attente** : ${waitingStatus}\n> **Protection des permissions** : ${protectStatus}`,
          inline: false,
        },
        {
          name: ctx.translate`» Salons`,
          value: ctx.translate`> **Catégorie** : ${categoryDisplay}\n> **Hub** : ${hubDisplay}`,
          inline: false,
        },
        {
          name: ctx.translate`» Nom salon vocal`,
          value: voiceName,
          inline: true,
        },
        {
          name: ctx.translate`» Nom salon vocal d'attente`,
          value: waitingName,
          inline: true,
        },
        {
          name: ctx.translate`» Limite d'utilisateur`,
          value: limitValue,
          inline: true,
        },
        {
          name: ctx.translate`» Rôles gérants - \`${data.rolesManager.length}/10\``,
          value: managerValue,
          inline: true,
        },
        {
          name: ctx.translate`» Rôles autorisés - \`${data.rolesAccepted.length}/10\``,
          value: acceptedValue,
          inline: true,
        },
        {
          name: ctx.translate`» Rôles refusés - \`${data.rolesRefused.length}/10\``,
          value: refusedValue,
          inline: true,
        },
      ]);
  }

  buttonSettings(ctx, data) {
    return [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("waitingChannel")
            .setLabel(ctx.translate`Salon attente`)
            .setStyle(data.waitingChannel ? 3 : 4)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("permissionsProtect")
            .setLabel(ctx.translate`Protection des permissions`)
            .setStyle(data.permissionsProtect ? 3 : 4)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("information")
            .setLabel(ctx.translate`Informations`)
            .setStyle(2)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("validate")
            .setLabel(ctx.translate`Valider`)
            .setStyle(1)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel(ctx.translate`Annuler`)
            .setStyle(4)
        ),
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("channels")
            .setLabel(ctx.translate`Salons`)
            .setStyle(2)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("roles")
            .setLabel(ctx.translate`Rôles`)
            .setStyle(2)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("permissions")
            .setLabel(ctx.translate`Permissions`)
            .setStyle(2)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("channelsName")
            .setLabel(ctx.translate`Noms salons`)
            .setStyle(2)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("limit")
            .setLabel(ctx.translate`Limite`)
            .setStyle(2)
        ),
    ];
  }

  convertStringToPermissions(permissions) {
    const permissionsBitField = new PermissionsBitField();
    permissions.forEach((permission) => {
      permissionsBitField.add(permission);
    });

    return permissionsBitField.toArray();
  }

  displayEmbedPermissions(ctx, permissions) {
    const ownerAccepted = this.convertStringToPermissions(
      permissions.owner.accepted
    );
    const ownerRefused = this.convertStringToPermissions(
      permissions.owner.refused
    );
    const everyoneAccepted = this.convertStringToPermissions(
      permissions.everyone.accepted
    );
    const everyoneRefused = this.convertStringToPermissions(
      permissions.everyone.refused
    );

    return new EmbedBuilder()
      .setTitle(ctx.translate`Permissions des salons vocaux temporaires`)
      .setColor(ctx.colors.blue)
      .addFields([
        {
          name: ctx.translate`» Owner & Admins`,
          value: this.listPermissions
            .map(
              (permission) =>
                `${
                  ownerAccepted.includes(permission)
                    ? `${ctx.emojiSuccess}`
                    : `${
                        ownerRefused.includes(permission)
                          ? `${ctx.emojiError}`
                          : `➖`
                      }`
                } ${permission}`
            )
            .join("\n"),
          inline: true,
        },
        {
          name: ctx.translate`» Everyone`,
          value: this.listPermissions
            .map(
              (permission) =>
                `${
                  everyoneAccepted.includes(permission)
                    ? `${ctx.emojiSuccess}`
                    : `${
                        everyoneRefused.includes(permission)
                          ? `${ctx.emojiError}`
                          : `➖`
                      }`
                } ${permission}`
            )
            .join("\n"),
          inline: true,
        },
      ]);
  }

  buttonPermissions(ctx, typePermissions) {
    let permissions = this.listPermissions;
    if (typePermissions === "owner")
      permissions = permissions.filter(
        (permission) => !["ViewChannel", "Connect"].includes(permission)
      );

    const activeSuffix = ctx.translate` (Actuellement ici)`;
    const buttonOwner = new ButtonBuilder()
      .setCustomId("permission_owner")
      .setLabel(
        `${ctx.translate`Owner & Admins`}${
          typePermissions === "owner" ? activeSuffix : ""
        }`
      )
      .setStyle(2)
      .setDisabled(typePermissions === "owner");

    const buttonEveryone = new ButtonBuilder()
      .setCustomId("permission_everyone")
      .setLabel(
        `${ctx.translate`Everyone`}${
          typePermissions === "everyone" ? activeSuffix : ""
        }`
      )
      .setStyle(2)
      .setDisabled(typePermissions === "everyone");

    const menuAccepted = new StringSelectMenuBuilder()
      .setCustomId("permissions_accepted")
      .setPlaceholder(ctx.translate`➜ Permissions accordées`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        permissions.map((permission) => {
          return {
            label: permission,
            value: permission,
            emoji: `${ctx.emojiSuccess}`,
          };
        })
      );

    const menuNeutral = new StringSelectMenuBuilder()
      .setCustomId("permissions_neutral")
      .setPlaceholder(ctx.translate`➜ Permissions neutres`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        permissions.map((permission) => {
          return {
            label: permission,
            value: permission,
            emoji: `➖`,
          };
        })
      );

    const menuRefused = new StringSelectMenuBuilder()
      .setCustomId("permissions_refused")
      .setPlaceholder(ctx.translate`➜ Permissions refusées`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        permissions.map((permission) => {
          return {
            label: permission,
            value: permission,
            emoji: `${ctx.emojiError}`,
          };
        })
      );

    return [
      new ActionRowBuilder()
        .addComponents(buttonOwner)
        .addComponents(buttonEveryone),
      new ActionRowBuilder().addComponents(menuAccepted),
      new ActionRowBuilder().addComponents(menuNeutral),
      new ActionRowBuilder().addComponents(menuRefused),
    ];
  }

  async run(ctx) {
    const data = await ctx.database
      .table("guild_voice_settings")
      .where("guildId", ctx.guild.id)
      .first();

    const underConstruction = {};
    let typePermissions = "owner";
    if (data) {
      underConstruction.waitingChannel = data.waitingChannel;
      underConstruction.permissionsProtect = data.permissionsProtect;
      underConstruction.categoryId = data.categoryId;
      underConstruction.channelStartId = data.channelStartId;
      underConstruction.channelName = data.channelName;
      underConstruction.channelWaitingName = data.channelWaitingName;
      underConstruction.channelLimit = data.channelLimit;
      underConstruction.rolesManager = JSON.parse(data.rolesManager);
      underConstruction.rolesAccepted = JSON.parse(data.rolesAccepted);
      underConstruction.rolesRefused = JSON.parse(data.rolesRefused);
      underConstruction.permissions = JSON.parse(data.permissions);
    } else {
      underConstruction.waitingChannel = true;
      underConstruction.permissionsProtect = true;
      underConstruction.categoryId = "";
      underConstruction.channelStartId = "";
      underConstruction.channelName = "Vocal de {username}";
      underConstruction.channelWaitingName = "» Attente de {username}";
      underConstruction.channelLimit = 0;
      underConstruction.rolesManager = [];
      underConstruction.rolesAccepted = [];
      underConstruction.rolesRefused = [];
      underConstruction.permissions = {
        owner: {
          accepted: [
            String(PermissionsBitField.Flags.ViewChannel),
            String(PermissionsBitField.Flags.Connect),
            String(PermissionsBitField.Flags.Speak),
          ],
          refused: [],
        },
        everyone: {
          accepted: [],
          refused: [String(PermissionsBitField.Flags.Connect)],
        },
      };
    }

    const msg = await ctx.send({
      embeds: [this.displayEmbed(ctx, underConstruction)],
      components: this.buttonSettings(ctx, underConstruction),
    });

    const filter = (i) => i.user.id === ctx.user.id;
    const collectorButton = msg.createMessageComponentCollector({
      filter,
      idle: 30 * 60 * 1000,
      componentType: 2,
    });

    collectorButton.on("collect", async (button) => {
      if (button.customId === "waitingChannel") {
        await button.deferUpdate();

        underConstruction.waitingChannel = !underConstruction.waitingChannel;
        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      } else if (button.customId === "permissionsProtect") {
        await button.deferUpdate();

        underConstruction.permissionsProtect =
          !underConstruction.permissionsProtect;
        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      } else if (button.customId === "information") {
        await button.deferUpdate();

        const embed = new EmbedBuilder()
          .setColor(ctx.colors.blue)
          .setTitle(ctx.translate`Aide au paramétrage`)
          .setDescription(
            ctx.translate`> **Salon attente** : Salon vocal que les membres peuvent rejoindre pour demander à rejoindre votre salon vocal privé\n> **Permissions protect** : Activer ou désactiver l'ajout des rôles gérants, autorisés et refusés dans les paramètres des salons vocaux\n> **Salons** : Permet de choisir les différents salons\n> **Rôles** : Permet de configurer les rôles gérants (peuvent **gérer** et **rejoindre** tous les salons vocaux privés), autorisés (peuvent **rejoindre** tous les salons vocaux privé) et refusés (ne peuvent **rejoindre aucun** salons vocaux privé)\n> **Permissions** : Permet de configurer les permissions données au propriétaire et admins du vocal privé, ainsi que ceux des membres qui les rejoignent\n> **Noms salons** : Permet de configurer les noms des salons vocaux et d'attente\n> **Limite** : Permet de configurer la limite d'utilisateur dans les salons vocaux`
          );

        return button.followUp({ embeds: [embed], flags: 64 });
      } else if (button.customId === "channels") {
        await button.deferUpdate();

        const categoryChannel = new ChannelSelectMenuBuilder()
          .setCustomId("categoryChannel")
          .setChannelTypes([4])
          .setMinValues(1)
          .setMaxValues(1);

        if (underConstruction.categoryId)
          categoryChannel.setDefaultChannels(underConstruction.categoryId);
        else categoryChannel.setPlaceholder(ctx.translate`➜ Catégorie`);

        const hubChannel = new ChannelSelectMenuBuilder()
          .setCustomId("hubChannel")
          .setChannelTypes([2])
          .setMinValues(1)
          .setMaxValues(1);

        if (underConstruction.channelStartId)
          hubChannel.setDefaultChannels(underConstruction.channelStartId);
        else hubChannel.setPlaceholder(ctx.translate`➜ Hub`);

        const actionRow = new ActionRowBuilder().addComponents(categoryChannel);

        const actionRow2 = new ActionRowBuilder().addComponents(hubChannel);

        const msgChannel = await button.followUp({
          components: [actionRow, actionRow2],
          flags: 64,
        });

        const collectorChannel = msgChannel.createMessageComponentCollector({
          filter,
          idle: 5 * 60 * 1000,
          componentType: 8,
        });

        collectorChannel.on("collect", async (menu) => {
          if (menu.customId === "categoryChannel") {
            await menu.deferUpdate();

            underConstruction.categoryId = menu.values[0];
            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          } else if (menu.customId === "hubChannel") {
            await menu.deferUpdate();

            underConstruction.channelStartId = menu.values[0];
            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          }
        });
      } else if (button.customId === "roles") {
        await button.deferUpdate();

        const rolesManager = new RoleSelectMenuBuilder()
          .setCustomId("rolesManager")
          .setMinValues(0)
          .setMaxValues(10);

        if (underConstruction.rolesManager.length > 0)
          rolesManager.setDefaultRoles(underConstruction.rolesManager);
        else rolesManager.setPlaceholder(ctx.translate`➜ Rôles gérants`);

        const rolesAccepted = new RoleSelectMenuBuilder()
          .setCustomId("rolesAccepted")
          .setMinValues(0)
          .setMaxValues(10);

        if (underConstruction.rolesAccepted.length > 0)
          rolesAccepted.setDefaultRoles(underConstruction.rolesAccepted);
        else rolesAccepted.setPlaceholder(ctx.translate`➜ Rôles autorisés`);

        const rolesRefused = new RoleSelectMenuBuilder()
          .setCustomId("rolesRefused")
          .setMinValues(0)
          .setMaxValues(10);

        if (underConstruction.rolesRefused.length > 0)
          rolesRefused.setDefaultRoles(underConstruction.rolesRefused);
        else rolesRefused.setPlaceholder(ctx.translate`➜ Rôles refusés`);

        const actionRow = new ActionRowBuilder().addComponents(rolesManager);

        const actionRow2 = new ActionRowBuilder().addComponents(rolesAccepted);

        const actionRow3 = new ActionRowBuilder().addComponents(rolesRefused);

        const msgChannel = await button.followUp({
          components: [actionRow, actionRow2, actionRow3],
          flags: 64,
        });

        const collectorRole = msgChannel.createMessageComponentCollector({
          filter,
          idle: 5 * 60 * 1000,
          componentType: 6,
        });

        collectorRole.on("collect", async (menu) => {
          const values = menu.values;

          if (menu.customId === "rolesManager") {
            await menu.deferUpdate();

            // Remove roles present in rolesAccepted and rolesRefused
            underConstruction.rolesManager = values.filter(
              (roleId) =>
                !underConstruction.rolesAccepted.includes(roleId) &&
                !underConstruction.rolesRefused.includes(roleId)
            );

            // Update select menu
            rolesManager.setDefaultRoles(underConstruction.rolesManager);

            // Update message
            await menu.editReply({
              components: [actionRow, actionRow2, actionRow3],
            });

            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          } else if (menu.customId === "rolesAccepted") {
            await menu.deferUpdate();

            // Remove roles present in rolesManager and rolesRefused
            underConstruction.rolesAccepted = values.filter(
              (roleId) =>
                !underConstruction.rolesManager.includes(roleId) &&
                !underConstruction.rolesRefused.includes(roleId)
            );

            // Update select menu
            rolesAccepted.setDefaultRoles(underConstruction.rolesAccepted);

            // Update message
            await menu.editReply({
              components: [actionRow, actionRow2, actionRow3],
            });

            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          } else if (menu.customId === "rolesRefused") {
            await menu.deferUpdate();

            // Remove roles present in rolesManager and rolesAccepted
            underConstruction.rolesRefused = values.filter(
              (roleId) =>
                !underConstruction.rolesManager.includes(roleId) &&
                !underConstruction.rolesAccepted.includes(roleId)
            );

            // Update select menu
            rolesRefused.setDefaultRoles(underConstruction.rolesRefused);

            // Update message
            await menu.editReply({
              components: [actionRow, actionRow2, actionRow3],
            });

            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          }
        });
      } else if (button.customId === "channelsName") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`name_${date}`)
          .setTitle(ctx.translate`Noms salons vocaux temporaires`);

        const textInput = new TextInputBuilder()
          .setCustomId("channelName")
          .setStyle(1)
          .setLabel(ctx.translate`» Salon vocal`)
          .setValue(underConstruction.channelName)
          .setRequired(true);

        const textInput2 = new TextInputBuilder()
          .setCustomId("channelWaitingName")
          .setStyle(1)
          .setLabel(ctx.translate`» Salon attente`)
          .setValue(underConstruction.channelWaitingName)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

        modal.addComponents(actionRow, actionRow2);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `name_${date}`;
        ctx.inter
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);

            underConstruction.channelName =
              modal.fields.getTextInputValue("channelName");
            underConstruction.channelWaitingName =
              modal.fields.getTextInputValue("channelWaitingName");

            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          });
      } else if (button.customId === "limit") {
        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`limit_${date}`)
          .setTitle(ctx.translate`Limite salon vocal temporaire`);

        const textInput = new TextInputBuilder()
          .setCustomId("limit")
          .setStyle(1)
          .setLabel(ctx.translate`» Limite d'utilisateur`)
          .setValue(String(underConstruction.channelLimit))
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `limit_${date}`;
        ctx.inter
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);

            const limit = Number(modal.fields.getTextInputValue("limit"));
            if (isNaN(limit))
              return button.followUp({
                content: `${
                  ctx.emojiError
                } ${ctx.translate`Veuillez entrer un nombre valide !`}`,
                flags: 64,
              });

            underConstruction.channelLimit = limit;

            return button.message.edit({
              embeds: [this.displayEmbed(ctx, underConstruction)],
              components: this.buttonSettings(ctx, underConstruction),
            });
          });
      } else if (button.customId === "permissions") {
        await button.deferUpdate();

        const msgPermissions = await button.followUp({
          embeds: [
            this.displayEmbedPermissions(ctx, underConstruction.permissions),
          ],
          components: this.buttonPermissions(ctx, typePermissions),
          flags: 64,
        });

        const collectorButtonPermission =
          msgPermissions.createMessageComponentCollector({
            idle: 5 * 60 * 1000,
            componentType: 2,
          });
        const collectorMenuPermission =
          msgPermissions.createMessageComponentCollector({
            idle: 5 * 60 * 1000,
            componentType: 3,
          });

        collectorButtonPermission.on("collect", async (buttonPermission) => {
          await buttonPermission.deferUpdate();
          buttonPermission.customId === "permission_owner"
            ? (typePermissions = "owner")
            : (typePermissions = "everyone");

          return buttonPermission.editReply({
            components: this.buttonPermissions(ctx, typePermissions),
          });
        });

        collectorMenuPermission.on("collect", async (menuPermission) => {
          await menuPermission.deferUpdate();

          const accepted = this.convertStringToPermissions(
            underConstruction.permissions[typePermissions].accepted
          );
          const refused = this.convertStringToPermissions(
            underConstruction.permissions[typePermissions].refused
          );

          switch (menuPermission.customId) {
            case "permissions_accepted":
              // Check if the permission is already present in the accepted or refused array
              if (!accepted.includes(menuPermission.values[0])) {
                // Add the permission bitfield to the accepted array
                underConstruction.permissions[typePermissions].accepted.push(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );

                // Remove the permission from the refused array if it exists
                const index = underConstruction.permissions[
                  typePermissions
                ].refused.indexOf(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );
                if (index > -1) {
                  underConstruction.permissions[typePermissions].refused.splice(
                    index,
                    1
                  );
                }
              }
              break;
            case "permissions_refused":
              // Check if the permission is already present in the accepted or refused array
              if (!refused.includes(menuPermission.values[0])) {
                // Add the permission bitfield to the refused array
                underConstruction.permissions[typePermissions].refused.push(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );

                // Remove the permission from the accepted array if it exists
                const index = underConstruction.permissions[
                  typePermissions
                ].accepted.indexOf(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );
                if (index > -1) {
                  underConstruction.permissions[
                    typePermissions
                  ].accepted.splice(index, 1);
                }
              }
              break;
            case "permissions_neutral":
              // Check if the permission is already present in the accepted or refused array
              if (accepted.includes(menuPermission.values[0])) {
                // Remove the permission from the accepted array
                const index = underConstruction.permissions[
                  typePermissions
                ].accepted.indexOf(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );
                if (index > -1) {
                  underConstruction.permissions[
                    typePermissions
                  ].accepted.splice(index, 1);
                }
              } else if (refused.includes(menuPermission.values[0])) {
                // Remove the permission from the refused array
                const index = underConstruction.permissions[
                  typePermissions
                ].refused.indexOf(
                  String(PermissionsBitField.Flags[menuPermission.values[0]])
                );
                if (index > -1) {
                  underConstruction.permissions[typePermissions].refused.splice(
                    index,
                    1
                  );
                }
              }
              break;
          }

          return menuPermission.editReply({
            embeds: [
              this.displayEmbedPermissions(ctx, underConstruction.permissions),
            ],
            components: this.buttonPermissions(ctx, typePermissions),
          });
        });
      } else if (button.customId === "validate") {
        await button.deferUpdate();

        if (!underConstruction.categoryId || !underConstruction.channelStartId)
          return button.followUp({
            content: `${
              ctx.emojiError
            } ${ctx.translate`Veuillez définir une catégorie et un hub !`}`,
            flags: 64,
          });
        if (
          !underConstruction.channelName ||
          !underConstruction.channelWaitingName ||
          underConstruction.channelName.length === 0 ||
          underConstruction.channelWaitingName.length === 0
        )
          return button.followUp({
            content: `${
              ctx.emojiError
            } ${ctx.translate`Veuillez définir un nom de salon vocal et un nom de salon d'attente !`}`,
            flags: 64,
          });

        if (data) {
          await ctx.database
            .table("guild_voice_settings")
            .update({
              waitingChannel: underConstruction.waitingChannel,
              permissionsProtect: underConstruction.permissionsProtect,
              categoryId: underConstruction.categoryId,
              channelStartId: underConstruction.channelStartId,
              channelName: underConstruction.channelName,
              channelWaitingName: underConstruction.channelWaitingName,
              channelLimit: underConstruction.channelLimit,
              rolesManager: JSON.stringify(underConstruction.rolesManager),
              rolesAccepted: JSON.stringify(underConstruction.rolesAccepted),
              rolesRefused: JSON.stringify(underConstruction.rolesRefused),
              permissions: JSON.stringify(underConstruction.permissions),
            })
            .where("guildId", ctx.guild.id);

          await button.followUp({
            content: `${
              ctx.emojiSuccess
            } ${ctx.translate`Paramètres mis à jour avec succès !`}`,
            flags: 64,
          });
        } else {
          await ctx.database.table("guild_voice_settings").insert({
            guildId: ctx.guild.id,
            waitingChannel: underConstruction.waitingChannel,
            permissionsProtect: underConstruction.permissionsProtect,
            categoryId: underConstruction.categoryId,
            channelStartId: underConstruction.channelStartId,
            channelName: underConstruction.channelName,
            channelWaitingName: underConstruction.channelWaitingName,
            channelLimit: underConstruction.channelLimit,
            rolesManager: JSON.stringify(underConstruction.rolesManager),
            rolesAccepted: JSON.stringify(underConstruction.rolesAccepted),
            rolesRefused: JSON.stringify(underConstruction.rolesRefused),
            permissions: JSON.stringify(underConstruction.permissions),
          });

          await button.followUp({
            content: `${
              ctx.emojiSuccess
            } ${ctx.translate`Paramètres ajoutés avec succès !`}`,
            flags: 64,
          });
        }

        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: [],
        });
      } else if (button.customId === "cancel") {
        await button.deferUpdate();

        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: [],
        });
      }
    });

    collectorButton.on("end", async (_, reason) => {
      if (reason === "idle") return msg.edit({ components: [] });
    });
  }
};
