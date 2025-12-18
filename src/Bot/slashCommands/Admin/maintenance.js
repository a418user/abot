const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = class Maintenance extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "maintenance",
      description: "Mettre le serveur en mode maintenance",
      category: SlashCommand.Categories.Admin,
      user_permissions: ["Administrator"],
      bot_permissions: ["ManageChannels", "ManageRoles"],
    });
  }

  async run(ctx) {
    const embed = new EmbedBuilder()
      .setTitle(
        ctx.translate`Lire impérativement ce texte avant de faire votre choix`
      )
      .setDescription(
        ctx.translate`# **Cette action est __IRREVERSIBLE__ !**\n**Êtes-vous sûr de vouloir mettre le serveur en mode maintenance ?**\n__Cela aura pour effet de changer les permissions de tous les salons du serveur.__`
      )
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.me.displayAvatarURL())
      .setFooter({
        text: ctx.translate`Demandé par ${ctx.user.username}`,
        iconURL: ctx.user.displayAvatarURL(),
      });

    const msgCollector = await ctx.send({
      embeds: [embed],
      components: ctx.messageFormatter.question(
        "yes",
        `${ctx.client.emojiSuccess}`,
        "no",
        `${ctx.client.emojiError}`
      ),
    });

    const collector = msgCollector.createMessageComponentCollector({
      time: 2 * 60 * 1000,
      componentType: 2,
    });

    collector.on("collect", async (button) => {
      collector.stop();
      await button.deferUpdate();

      if (button.customId === "yes") {
        await button.message
          .edit({
            content: ctx.translate(
              ":clock10: La mise en maintenance est en cours ..."
            ),
            embeds: [],
            components: [],
          })
          .catch(() => null);

        // Hide all channels of the guild
        const channels = ctx.guild.channels.cache.filter((c) => c.type !== 4);

        for (const channel of channels.values()) {
          await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, {
            ViewChannel: false,
          });
        }

        // Create a maintenance category
        const category = await ctx.guild.channels
          .create({
            name: ctx.translate`💾 Maintenance 💾`,
            type: 4,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone,
                allow: [PermissionsBitField.Flags.ViewChannel],
              },
            ],
            reason: ctx.translate`Mise en maintenance du serveur`,
          })
          .catch(() => null);

        // Create a maintenance announcement channel
        const announcement = await ctx.guild.channels
          .create({
            name: ctx.translate`📢 annonces`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone,
                allow: [PermissionsBitField.Flags.ViewChannel],
                deny: [PermissionsBitField.Flags.SendMessages],
              },
            ],
            reason: ctx.translate`Mise en maintenance du serveur`,
          })
          .catch(() => null);

        // Create a maintenance channel
        const maintenance = await ctx.guild.channels
          .create({
            name: ctx.translate`💬 discussion`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone,
                allow: [PermissionsBitField.Flags.ViewChannel],
              },
            ],
            reason: ctx.translate`Mise en maintenance du serveur`,
          })
          .catch(() => null);

        // Create a maintenance command channel
        const command = await ctx.guild.channels
          .create({
            name: ctx.translate`🤖 cmd-bot`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone,
                allow: [PermissionsBitField.Flags.ViewChannel],
              },
            ],
            reason: ctx.translate`Mise en maintenance du serveur`,
          })
          .catch(() => null);

        const maintenanceSummary =
          `${ctx.client.emojiSuccess} ` +
          ctx.translate`La mise en maintenance est terminée !\n\n**__Voici les salons créés :__**\n${announcement} - Salon d'annonce de la maintenance\n${maintenance} - Salon de maintenance\n${command} - Salon de commandes de maintenance`;

        await button.message
          .edit({
            content: maintenanceSummary,
          })
          .catch(() => null);
      } else {
        return button.message
          .edit({
            content: ctx.translate`${ctx.client.emojiError} La mise en maintenance a été annulée !`,
            embeds: [],
            components: [],
          })
          .catch(() => null);
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time")
        return msgCollector
          .edit({
            content: `${
              ctx.client.emojiError
            } ${ctx.translate`Vous n'avez pas répondu à temps !`}`,
            components: [],
          })
          .catch(() => null);
    });
  }
};
