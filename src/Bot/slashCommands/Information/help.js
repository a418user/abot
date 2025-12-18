const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  PermissionsBitField,
} = require("discord.js");

const cooldown = new Map();

module.exports = class Help extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "help",
      description: "Afficher la liste des commandes disponibles",
      category: SlashCommand.Categories.Information,
      bot_permissions: ["EmbedLinks"],
    });
  }

  getSubCommands(cmd) {
    const allCommands = [];

    if (cmd.options.filter((o) => o.type <= 2).length === 0)
      return [
        {
          name: cmd.name,
          description: cmd.description,
        },
      ];

    for (const opt of cmd.options) {
      if (opt.type === 1)
        allCommands.push({
          name: `${cmd.name} ${opt.name}`,
          description: opt.description,
        });
      else if (opt.type === 2) {
        for (const opt2 of opt.options) {
          if (opt2.type === 1)
            allCommands.push({
              name: `${cmd.name} ${opt.name} ${opt2.name}`,
              description: opt2.description,
            });
        }
      }
    }

    return allCommands;
  }

  getCommandsCategory(slashCommandsData) {
    const { commands, applicationCommands } = slashCommandsData;
    const allCommands = [];

    commands.map((cmd) => {
      allCommands.push(...this.getSubCommands(cmd));
    });

    return allCommands
      .map((cmd) => {
        const commandName = cmd.name.split(" ")[0];
        const cmdFetch = applicationCommands.find(
          (c) => c.name === commandName
        );
        return `${
          cmdFetch
            ? `</${cmd.name}:${cmdFetch?.id || "null"}>`
            : `\`${cmd.name}\``
        } : ${cmd.description}`;
      })
      .join("\n");
  }

  createSelectMenu(commands, ctx, noCommands = false) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_selectMenu")
      .setPlaceholder(ctx.translate`Choisir une commande`);

    commands = commands.filter((x) => x.type < 2);

    if (commands.size === 0 || noCommands === true) {
      selectMenu
        .addOptions({
          label: ctx.translate`Aucune commande`,
          value: `nothing`,
        })
        .setDisabled(true);
    } else {
      commands.forEach((cmd) => {
        selectMenu.addOptions({
          label: `${cmd.name}`,
          value: `${cmd.name}`,
          emoji: cmd.category.emoji,
        });
      });
    }

    return new ActionRowBuilder().addComponents(selectMenu);
  }

  createComponents(ctx, categories) {
    const actionRows = [];

    const rowBase = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setStyle(3).setEmoji("🏠").setCustomId("help_home")
      )
      .addComponents(
        new ButtonBuilder().setStyle(4).setEmoji("📕").setCustomId("help_close")
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel(ctx.translate`Serveur Discord`)
          .setStyle(5)
          .setURL(ctx.config["system"]["serverSupport"])
          .setEmoji("<:discord:1078617494337634334>")
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel(ctx.translate`Lien d'invitation du bot`)
          .setStyle(5)
          .setURL(ctx.config["system"]["linkInviteBot"])
          .setEmoji("<:discordbotdev:1061305162913812480>")
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel(ctx.translate`Dashboard`)
          .setStyle(5)
          .setURL(ctx.config["dashboard"]["link"])
          .setEmoji("🔗")
      );

    actionRows.push(rowBase);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_categories")
      .setPlaceholder(ctx.translate`Choisir une catégorie`)
      .setMinValues(1)
      .setMaxValues(1);

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      selectMenu.addOptions({
        label: `${category[1].name}`,
        emoji: `${category[1].emoji}`,
        value: `${category[1].id}`,
      });
    }

    actionRows.push(new ActionRowBuilder().addComponents(selectMenu));

    return actionRows;
  }

  async run(ctx) {
    // Get slashCommands of the files bot
    let slashCommands = ctx.client.slashCommandsHandler.slashCommands;

    // Get the slashCommands in the rest api
    let applicationCommands;
    ctx.client.token === process.env.DEV_TOKEN
      ? (applicationCommands = await ctx.guild.commands.fetch())
      : (applicationCommands = await ctx.client.application.commands.fetch());

    // Keep only commands that the user can use by comparing the permissions of the user and the permissions of the command
    applicationCommands = applicationCommands.filter((cmd) => {
      if (cmd.defaultMemberPermissions === null) return true;
      return ctx.member.permissions.has(cmd.defaultMemberPermissions);
    });

    // Remove the commands in the files that user can't use
    slashCommands = ctx.client.slashCommandsHandler.slashCommands.filter(
      (cmd) => applicationCommands.find((c) => c.name === cmd.name)
    );

    // Get the categories
    let categories = Object.entries(SlashCommand.Categories).filter(
      ([_, value]) => ![11, 100, 101].includes(value.id)
    );

    // Ignore categories without commands
    categories = categories.filter((x) => {
      const commands = slashCommands.filter(
        (cmd) => cmd.category.id === x[1].id
      );
      return commands.size > 0;
    });

    // Get Information commands
    const commandsInformation = slashCommands.filter(
      (x) =>
        x.hiddenInHelp === false &&
        x.disableSlash === false &&
        [110].includes(x.category.id)
    );

    // Format the data
    const slashCommandsDataInformation = {
      commands: commandsInformation,
      applicationCommands,
    };

    const categoriesList = categories
      .map(
        ([_, value], index) =>
          `> \`${index + 1}\` ${value.emoji} **${value.name}**`
      )
      .join("\n");

    const embedDescription = ctx.translate`Pour plus d'informations vous pouvez rejoindre le [serveur Discord](${ctx.config["system"]["serverSupport"]}).\n\n» **__Catégories__**\n${categoriesList}`;
    const infoCommandsValue =
      this.getCommandsCategory(slashCommandsDataInformation) ||
      ctx.translate`Aucune commande`;

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Les commandes`)
      .setDescription(embedDescription)
      .setFooter({
        text: ctx.translate`Page principale | ${ctx.user.displayName}`,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .addFields([
        {
          name: ctx.translate`ℹ️ __Information__ :`,
          value: infoCommandsValue,
        },
      ]);

    let components = this.createComponents(ctx, categories);
    components.push(this.createSelectMenu(commandsInformation, ctx));

    const msg = await ctx.send({
      embeds: [embed],
      components: components,
    });

    const filter = (i) => i.user.id === ctx.user.id;
    const collectorButton = msg.createMessageComponentCollector({
      filter,
      idle: 15 * 60 * 1000,
      componentType: 2,
    });
    const collectorMenu = msg.createMessageComponentCollector({
      filter,
      idle: 15 * 60 * 1000,
      componentType: 3,
    });

    collectorButton.on("collect", async (button) => {
      await button.deferUpdate();

      if (button.customId === "help_home") {
        const getGuildCooldown = cooldown.get(ctx.guild.id);
        if (!getGuildCooldown) {
          cooldown.set(ctx.guild.id, 1);
        } else {
          cooldown.set(ctx.guild.id, getGuildCooldown + 1);
        }

        if (getGuildCooldown + 1 >= 5) {
          const easterEggs = await ctx.database
            .table("guild_easter_eggs")
            .select()
            .where("guild_id", ctx.guild.id);
          if (easterEggs[0]) {
            await ctx.database
              .table("guild_easter_eggs")
              .delete()
              .where("guild_id", ctx.guild.id);

            button.followUp({
              content: ctx.translate`${ctx.emojiSuccess} Vous venez désactiver un easter eggs !`,
              flags: 64,
            });
          } else {
            await ctx.database
              .table("guild_easter_eggs")
              .insert({ guild_id: ctx.guild.id });

            button.followUp({
              content: ctx.translate`${ctx.emojiSuccess} Vous venez d'activer un easter eggs !`,
              flags: 64,
            });
          }
        }

        setTimeout(() => {
          // Remove 1 to the value
          const getGuildCooldown2 = cooldown.get(ctx.guild.id);
          if (getGuildCooldown2 - 1 === 0) {
            cooldown.delete(ctx.guild.id);
          } else {
            cooldown.set(ctx.guild.id, getGuildCooldown2 - 1);
          }
        }, 1000 * 10);

        components = this.createComponents(ctx, categories);
        components.push(this.createSelectMenu(commandsInformation, ctx));

        return button.message
          .edit({
            embeds: [embed],
            components: components,
          })
          .catch(() => null);
      } else if (button.customId === "help_close") {
        collectorButton.stop();
        collectorMenu.stop();

        return button.message
          .edit({
            components: [],
          })
          .catch(() => null);
      } else {
        const category = categories.find(
          ([_, value]) => value.id === Number(button.customId.split("_")[2])
        );
        if (category) {
          const commands = slashCommands.filter(
            (x) =>
              x.hiddenInHelp === false &&
              x.disableSlash === false &&
              x.category.id === category[1].id
          );

          // Format the data
          const slashCommandsData = {
            commands,
            applicationCommands,
          };

          const categoryCommands =
            this.getCommandsCategory(slashCommandsData) ||
            ctx.translate`Aucune commande`;

          const embedCategory = new EmbedBuilder()
            .setTitle(ctx.translate`Les commandes`)
            .setFooter({
              text: ctx.translate`Catégorie ${category[1].name} | ${ctx.user.displayName}`,
              iconURL: ctx.user.displayAvatarURL(),
            })
            .setColor(ctx.colors.blue)
            .setThumbnail(ctx.client.user.displayAvatarURL())
            .setDescription(
              ctx.translate`${category[1].emoji} **__${category[1].name}__**\n${categoryCommands}`
            );

          components = this.createComponents(ctx, categories);
          components.push(this.createSelectMenu(commands, ctx));

          return button.message
            .edit({
              embeds: [embedCategory],
              components: components,
            })
            .catch(() => null);
        }
      }
    });

    collectorMenu.on("collect", async (menu) => {
      await menu.deferUpdate();

      if (menu.customId === "help_categories") {
        const categoryId = Number(menu.values[0]);
        const category = categories.find(
          ([_, value]) => value.id === categoryId
        );
        if (!category) return;

        const commands = slashCommands.filter(
          (x) =>
            x.hiddenInHelp === false &&
            x.disableSlash === false &&
            x.category.id === category[1].id
        );

        // Format the data
        const slashCommandsData = {
          commands,
          applicationCommands,
        };

        const categoryCommands =
          this.getCommandsCategory(slashCommandsData) ||
          ctx.translate`Aucune commande`;

        const embedCategory = new EmbedBuilder()
          .setTitle(ctx.translate`Les commandes`)
          .setFooter({
            text: ctx.translate`Catégorie ${category[1].name} | ${ctx.user.displayName}`,
            iconURL: ctx.user.displayAvatarURL(),
          })
          .setColor(ctx.colors.blue)
          .setThumbnail(ctx.client.user.displayAvatarURL())
          .setDescription(
            ctx.translate`${category[1].emoji} **__${category[1].name}__**\n${categoryCommands}`
          );

        components = this.createComponents(ctx, categories);
        components.push(this.createSelectMenu(commands, ctx));

        return menu.message
          .edit({
            embeds: [embedCategory],
            components: components,
          })
          .catch(() => null);
      } else if (menu.customId === "help_selectMenu") {
        const command = ctx.client.slashCommandsHandler.getSlashCommand(
          menu.values[0]
        );
        const cmdFetch = applicationCommands.find(
          (c) => c.name === command.name
        );

        const allCommands = this.getSubCommands(command).map((cmd) => {
          return {
            name: `${
              cmdFetch
                ? `</${cmd.name}:${cmdFetch?.id || "null"}>`
                : `\`${cmd.name}\``
            }`,
            description: cmd.description,
          };
        });

        let arrayPermissionsName = [];
        let userPermissions = command.user_permissions;
        if (userPermissions.includes(8n)) {
          userPermissions = userPermissions.filter((x) => x !== 8n);
          arrayPermissionsName.push("Administrator");
        }

        const bitPermissions = new PermissionsBitField(userPermissions);

        const permissions = {
          Administrator: PermissionsBitField.Flags.Administrator,
          ManageGuild: PermissionsBitField.Flags.ManageGuild,
          BanMembers: PermissionsBitField.Flags.BanMembers,
          KickMembers: PermissionsBitField.Flags.KickMembers,
          ManageChannels: PermissionsBitField.Flags.ManageChannels,
          ManageMessages: PermissionsBitField.Flags.ManageMessages,
          ManageNicknames: PermissionsBitField.Flags.ManageNicknames,
          ManageRoles: PermissionsBitField.Flags.ManageRoles,
          MentionEveryone: PermissionsBitField.Flags.MentionEveryone,
          ModerateMembers: PermissionsBitField.Flags.ModerateMembers,
          MoveMembers: PermissionsBitField.Flags.MoveMembers,
          MuteMembers: PermissionsBitField.Flags.MuteMembers,
        };

        for (const [key, value] of Object.entries(permissions)) {
          if (bitPermissions.has(value)) {
            arrayPermissionsName.push(key);
          }
        }

        const permissionsValue =
          arrayPermissionsName.length < 1
            ? ctx.translate`Aucune`
            : `${arrayPermissionsName.join(", ")}`;

        const embed = new EmbedBuilder()
          .setDescription(
            ctx.translate`ℹ️ Information sur la commande **${command.name}**`
          )
          .addFields([
            {
              name: ctx.translate`\uD83D\uDCAC **Nom de la commande**`,
              value: allCommands.map((cmd) => cmd.name).join("\n"),
            },
            {
              name: ctx.translate`\uD83D\uDCDD **Description**`,
              value: allCommands.map((cmd) => cmd.description).join("\n"),
            },
            {
              name: ctx.translate`:hammer_pick: **Catégorie**`,
              value: command.category.name,
            },
            {
              name: ctx.translate`✅ **Permissions**`,
              value: permissionsValue,
            },
          ])
          .setThumbnail(ctx.client.user.displayAvatarURL())
          .setColor(ctx.colors.blue)
          .setFooter({
            text: `${ctx.user.displayName}`,
            iconURL: `${ctx.user.displayAvatarURL()}`,
          });

        msg.edit({ embeds: [embed] }).catch(() => null);
      }
    });

    collectorButton.on("end", (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
