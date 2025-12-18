const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
} = require("discord.js");

module.exports = class SuggestSettings extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "suggestions-config",
      description: "Configurer le système de suggestions",
      category: SlashCommand.Categories.Management,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  displayEmbed(ctx, data) {
    const threadStatus = data.isThread ? ctx.emojiSuccess : ctx.emojiError;
    const typeLabel = data.isMessage
      ? ctx.translate`Message dans le salon et slash command`
      : ctx.translate`Slash command`;
    const channelDisplay = ctx.getChannel(data.channelId)
      ? `\`${ctx.getChannel(data.channelId).name}\``
      : `\`${ctx.translate`Non défini`}\``;
    const bypassName = ctx.translate`» Rôles bypass - \`${data.rolesBypass.length}/10\``;
    const blacklistName = ctx.translate`» Rôles blacklist - \`${data.rolesBlacklist.length}/10\``;
    const formatRoleValue = (roleId) =>
      ctx.getRole(roleId)
        ? `> \`${ctx.getRole(roleId).name}\``
        : ctx.translate`> Invalide`;
    const bypassValue =
      data.rolesBypass.map(formatRoleValue).join("\n") ||
      ctx.translate`\`Aucun\``;
    const blacklistValue =
      data.rolesBlacklist.map(formatRoleValue).join("\n") ||
      ctx.translate`\`Aucun\``;

    return new EmbedBuilder()
      .setTitle(ctx.translate`Paramètres des suggestions`)
      .setColor(ctx.colors.blue)
      .setDescription(
        ctx.translate`> **Créer automatiquement un thread** : ${threadStatus}\n\n> **Type** » ${typeLabel}\n> **Salon des suggestions** » ${channelDisplay}`
      )
      .addFields([
        {
          name: bypassName,
          value: bypassValue,
          inline: true,
        },
        {
          name: blacklistName,
          value: blacklistValue,
          inline: true,
        },
      ]);
  }

  buttonSettings(ctx, data) {
    const menuChannel = new ChannelSelectMenuBuilder()
      .setCustomId("suggest_channel")
      .setChannelTypes([0]);

    if (data.channelId) menuChannel.setDefaultChannels(data.channelId);
    else menuChannel.setPlaceholder(ctx.translate`➜ Salon des suggestions`);

    const menuBypass = new RoleSelectMenuBuilder().setCustomId("rolesBypass");

    if (data.rolesBypass.length > 0)
      menuBypass.setDefaultRoles(data.rolesBypass);
    else menuBypass.setPlaceholder(ctx.translate`➜ Rôles bypass`);

    const menuBlacklist = new RoleSelectMenuBuilder().setCustomId(
      "rolesBlacklist"
    );

    if (data.rolesBlacklist.length > 0)
      menuBlacklist.setDefaultRoles(data.rolesBlacklist);
    else menuBlacklist.setPlaceholder(ctx.translate`➜ Rôles blacklist`);

    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("thread")
          .setLabel(ctx.translate`Créer automatiquement un thread`)
          .setStyle(data.isThread ? 3 : 4),
        new ButtonBuilder()
          .setCustomId("type")
          .setLabel(ctx.translate`Modifier le type`)
          .setStyle(2),
        new ButtonBuilder()
          .setCustomId("information")
          .setLabel(ctx.translate`Informations`)
          .setStyle(2),
        new ButtonBuilder()
          .setCustomId("validate")
          .setLabel(ctx.translate`Valider`)
          .setStyle(1),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel(ctx.translate`Annuler`)
          .setStyle(4)
      ),
      new ActionRowBuilder().addComponents(menuChannel),
      new ActionRowBuilder().addComponents(menuBypass),
      new ActionRowBuilder().addComponents(menuBlacklist),
    ];
  }

  async run(ctx) {
    const data = await ctx.database
      .table("guild_suggest")
      .where("guildId", ctx.guild.id)
      .first();

    const underConstruction = {};
    if (data) {
      underConstruction.channelId = data.channelId;
      underConstruction.isThread = data.isThread;
      underConstruction.isMessage = data.isMessage;
      underConstruction.rolesBypass = JSON.parse(data.rolesBypass);
      underConstruction.rolesBlacklist = JSON.parse(data.rolesBlacklist);
    } else {
      underConstruction.channelId = "";
      underConstruction.isThread = true;
      underConstruction.isMessage = false;
      underConstruction.rolesBypass = [];
      underConstruction.rolesBlacklist = [];
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
    const collectorChannel = msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
      componentType: 8,
    });
    const collectorRole = msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
      componentType: 6,
    });

    collectorButton.on("collect", async (button) => {
      if (button.customId === "thread") {
        await button.deferUpdate();

        underConstruction.isThread = !underConstruction.isThread;
        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      } else if (button.customId === "type") {
        await button.deferUpdate();

        underConstruction.isMessage = !underConstruction.isMessage;
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
            ctx.translate`> **Créer automatiquement un thread** : Permet de créer un fil de discussion sous le message de la suggestion\n> **Modifier le type** : Permet de choisir comment créer une suggestion\n> **Salon des suggestions** : Salon où seront envoyées toutes les suggestions\n> **Rôles bypass** : Rôles qui peuvent écrire dans le salon des suggestions sans que celle-ci soit transformée en suggestion *(type Message dans le salon activé)*\n> **Rôles blacklist** : Rôles qui ne peuvent pas créer de suggestions`
          );

        return button.followUp({ embeds: [embed], flags: 64 });
      } else if (button.customId === "validate") {
        await button.deferUpdate();

        if (!underConstruction.channelId)
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Veuillez définir un salon de suggestions !`,
            flags: 64,
          });

        if (data) {
          await ctx.database
            .table("guild_suggest")
            .update({
              channelId: underConstruction.channelId,
              isThread: underConstruction.isThread,
              isMessage: underConstruction.isMessage,
              rolesBypass: JSON.stringify(underConstruction.rolesBypass),
              rolesBlacklist: JSON.stringify(underConstruction.rolesBlacklist),
            })
            .where("guildId", ctx.guild.id);

          await button.followUp({
            content: ctx.translate`${ctx.emojiSuccess} Paramètres mis à jour avec succès !`,
            flags: 64,
          });
        } else {
          await ctx.database.table("guild_suggest").insert({
            guildId: ctx.guild.id,
            channelId: underConstruction.channelId,
            isThread: underConstruction.isThread,
            isMessage: underConstruction.isMessage,
            rolesBypass: JSON.stringify(underConstruction.rolesBypass),
            rolesBlacklist: JSON.stringify(underConstruction.rolesBlacklist),
          });

          await button.followUp({
            content: ctx.translate`${ctx.emojiSuccess} Paramètres ajoutés avec succès !`,
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

    collectorChannel.on("collect", async (menu) => {
      if (menu.customId === "suggest_channel") {
        await menu.deferUpdate();

        underConstruction.channelId = menu.values[0];
        return menu.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      }
    });

    collectorRole.on("collect", async (menu) => {
      const values = menu.values;

      if (menu.customId === "rolesBypass") {
        await menu.deferUpdate();

        // Remove roles present in rolesBlacklist
        underConstruction.rolesBypass = values.filter(
          (roleId) => !underConstruction.rolesBlacklist.includes(roleId)
        );

        return menu.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      } else if (menu.customId === "rolesBlacklist") {
        await menu.deferUpdate();

        // Remove roles present in rolesBypass
        underConstruction.rolesBlacklist = values.filter(
          (roleId) => !underConstruction.rolesBypass.includes(roleId)
        );

        return menu.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      }
    });

    collectorButton.on("end", async (_, reason) => {
      if (reason === "idle") return msg.edit({ components: [] });
    });
  }
};
