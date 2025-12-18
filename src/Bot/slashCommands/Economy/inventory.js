const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = class Inventory extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "inventaire",
      description: "Voir son inventaire ou celui d'un autre membre",
      options: [
        {
          name: "membre",
          description: "Le membre dont vous voulez voir l'inventaire",
          type: 6,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Economy,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre") || ctx.member;
    let baseUserShop = await ctx.database
      .table("user_shop")
      .select()
      .where({ guild_id: ctx.guild.id, user_id: member.user.id });

    if (!baseUserShop[0])
      return ctx.error(
        ctx.translate`**${member.user.displayName}** n'a aucun item dans son inventaire !`
      );
    const permission = ctx.member.permissions.has("ManageGuild");

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Inventaire | ${member.user.displayName}`)
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .setColor(ctx.colors.blue)
      .setDescription(
        baseUserShop
          .map((item) => ctx.translate`- ${item.object_name}`)
          .join("\n")
      );

    const buttonDeleteItem = new ButtonBuilder()
      .setCustomId("delete_item")
      .setLabel(ctx.translate`Supprimer un item`)
      .setStyle(4)
      .setEmoji("🗑️");

    const actionRow = new ActionRowBuilder().addComponents(buttonDeleteItem);

    const msg = await ctx.send({
      embeds: [embed],
      components: permission ? [actionRow] : [],
    });

    if (!permission) return;

    const filter = (interaction) => interaction.user.id === ctx.user.id;
    const collectorButton = msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
      componentType: 2,
    });
    const collectorMenu = msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
      componentType: 3,
    });

    collectorButton.on("collect", async (button) => {
      await button.deferUpdate();
      if (button.customId === "delete_item") {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("delete_item_menu")
          .setPlaceholder(ctx.translate`Sélectionnez un item à supprimer`)
          .addOptions(
            baseUserShop.map((item) => ({
              label: item.object_name,
              value: String(item.id),
            }))
          )
          .setMinValues(1)
          .setMaxValues(1);

        const actionRow = new ActionRowBuilder().addComponents(menu);

        return button.message
          .edit({ components: [actionRow] })
          .catch(() => null);
      }
    });

    collectorMenu.on("collect", async (menu) => {
      await menu.deferUpdate();
      const id = Number(menu.values[0]);

      if (!baseUserShop.find((item) => item.id === id)) {
        menu.message.edit({ components: [actionRow] }).catch(() => null);
        return menu.followUp({
          content: ctx.translate`${ctx.emojiError} Cet objet n'existe pas !`,
          flags: 64,
        });
      }

      await ctx.database.table("user_shop").delete().where({ id });

      await menu.followUp({
        content: ctx.translate`${ctx.emojiSuccess} L'objet a bien été supprimé !`,
        flags: 64,
      });

      baseUserShop = await ctx.database
        .table("user_shop")
        .select()
        .where({ guild_id: ctx.guild.id, user_id: member.user.id });
      if (!baseUserShop[0]) {
        embed.setDescription(
          ctx.translate`**${member.user.displayName}** n'a aucun item dans son inventaire !`
        );
        return menu.message
          .edit({ embeds: [embed], components: [] })
          .catch(() => null);
      }

      embed.setDescription(
        baseUserShop
          .map((item) => ctx.translate`- ${item.object_name}`)
          .join("\n")
      );
      return menu.message
        .edit({ embeds: [embed], components: [actionRow] })
        .catch(() => null);
    });

    collectorButton.on("end", async (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
