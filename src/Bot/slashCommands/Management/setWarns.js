const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
} = require("discord.js");

module.exports = class WarnsSettings extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "warns-config",
      description: "Configurer le système d'avertissements",
      category: SlashCommand.Categories.Management,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  displayEmbed(ctx, data) {
    const dmStatus = data.isDm ? ctx.emojiSuccess : ctx.emojiError;
    const channelDisplay = ctx.getChannel(data.channelId)
      ? `${ctx.getChannel(data.channelId)}`
      : `\`${ctx.translate`Non défini`}\``;

    return new EmbedBuilder()
      .setTitle(ctx.translate`Paramètres des avertissements`)
      .setColor(ctx.colors.blue)
      .setDescription(
        ctx.translate`**Envoyer l'avertissement en message privé** : ${dmStatus}\n\n**Salon des avertissements** » ${channelDisplay}`
      );
  }

  buttonSettings(ctx, data) {
    const menuChannel = new ChannelSelectMenuBuilder()
      .setCustomId("warns_channel")
      .setChannelTypes([0])
      .setMinValues(1)
      .setMaxValues(1);

    if (data.channelId) menuChannel.setDefaultChannels(data.channelId);
    else menuChannel.setPlaceholder(ctx.translate`➜ Salon des avertissements`);

    return [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("dm")
            .setLabel(ctx.translate`Envoyer l'avertissement en message privé`)
            .setStyle(data.isDm ? 3 : 4)
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
      new ActionRowBuilder().addComponents(menuChannel),
    ];
  }

  async run(ctx) {
    const data = await ctx.database
      .table("guild_warns")
      .where("guildId", ctx.guild.id)
      .first();

    const underConstruction = {};
    if (data) {
      underConstruction.channelId = data.channelId;
      underConstruction.isDm = data.isDm;
    } else {
      underConstruction.channelId = "";
      underConstruction.isDm = false;
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

    collectorButton.on("collect", async (button) => {
      if (button.customId === "dm") {
        await button.deferUpdate();

        underConstruction.isDm = !underConstruction.isDm;
        return button.message.edit({
          embeds: [this.displayEmbed(ctx, underConstruction)],
          components: this.buttonSettings(ctx, underConstruction),
        });
      } else if (button.customId === "validate") {
        await button.deferUpdate();

        if (!underConstruction.channelId && underConstruction.isDm === false)
          return button.followUp({
            content: ctx.translate`${ctx.emojiError} Veuillez définir au moins un type d'envoie des avertissements !`,
            flags: 64,
          });

        if (data) {
          await ctx.database
            .table("guild_warns")
            .update({
              channelId: underConstruction.channelId,
              isDm: underConstruction.isDm,
            })
            .where("guildId", ctx.guild.id);

          await button.followUp({
            content: ctx.translate`${ctx.emojiSuccess} Paramètres mis à jour avec succès !`,
            flags: 64,
          });
        } else {
          await ctx.database.table("guild_warns").insert({
            guildId: ctx.guild.id,
            channelId: underConstruction.channelId,
            isDm: underConstruction.isDm,
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
      if (menu.customId === "warns_channel") {
        await menu.deferUpdate();

        underConstruction.channelId = menu.values[0];
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
