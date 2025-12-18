const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = class Shop extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "boutique",
      description: "Afficher la boutique",
      category: SlashCommand.Categories.Economy,
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    let base = await ctx.database
      .table("guild_shop")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!base[0])
      return ctx.error(ctx.translate`Il n'y a aucun objet dans la boutique !`);

    let baseUserShop = await ctx.database
      .table("user_shop")
      .select()
      .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });
    const baseGuildMoney = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);
    const name =
      baseGuildMoney[0] && baseGuildMoney[0].name
        ? baseGuildMoney[0].name
        : "coins";

    if (
      base.filter(
        (o) => !baseUserShop.find((u) => u.object_name === o.object_name)
      ).length === 0
    )
      return ctx.error(ctx.translate`Vous avez déjà tous les objets !`);

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Boutique | ${ctx.guild.name}`)
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .setColor(ctx.colors.blue)
      .setDescription(
        base
          .map(
            (o) =>
              ctx.translate`- ${o.object_name} : \`${o.object_price}\` ${name}`
          )
          .join("\n")
      );

    let selectMenu = new StringSelectMenuBuilder()
      .setCustomId("shop_select")
      .setPlaceholder(ctx.translate`Acheter un objet`)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        base
          .filter(
            (o) => !baseUserShop.find((u) => u.object_name === o.object_name)
          )
          .map((o) => {
            return {
              label: o.object_name,
              value: String(o.id),
            };
          })
      );

    let actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await ctx.send({ embeds: [embed], components: [actionRow] });

    const filter = (i) => i.user.id === ctx.user.id;
    const collectorMenu = msg.createMessageComponentCollector({
      filter: filter,
      time: 15 * 60 * 1000,
      componentType: 3,
    });

    collectorMenu.on("collect", async (menu) => {
      await menu.deferUpdate();
      const objectId = menu.values[0];

      // Get the object
      const object = base.find((o) => o.id === Number(objectId));
      if (!object)
        return menu.followUp({
          content: ctx.translate`Cet objet n'existe pas !`,
          flags: 64,
        });

      // Check if the user has enough money
      const userMoney = await ctx.database
        .table("user_money")
        .select()
        .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });
      if (!userMoney[0] || userMoney[0].money < object.object_price)
        return menu.followUp({
          content: ctx.translate`${ctx.emojiError} Vous n'avez pas assez d'argent !`,
          flags: 64,
        });

      // Check if the user already has the object
      const userShop = await ctx.database
        .table("user_shop")
        .select()
        .where({
          guild_id: ctx.guild.id,
          user_id: ctx.user.id,
          object_name: object.object_name,
        });
      if (userShop[0])
        return menu.followUp({
          content: ctx.translate`${ctx.emojiError} Vous avez déjà cet objet !`,
          flags: 64,
        });

      // Update the user money and add the object to the user shop
      await ctx.database
        .table("user_money")
        .update({
          money: userMoney[0].money - object.object_price,
        })
        .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });

      await ctx.database.table("user_shop").insert({
        guild_id: ctx.guild.id,
        user_id: ctx.user.id,
        object_name: object.object_name,
      });

      await menu.followUp({
        content: ctx.translate`${ctx.emojiSuccess} Vous avez acheté l'objet \`${object.object_name}\` pour \`${object.object_price}\` ${name} !`,
        flags: 64,
      });

      base = await ctx.database
        .table("guild_shop")
        .select()
        .where("guild_id", ctx.guild.id);
      if (!base[0]) {
        await menu.followUp({
          content: ctx.translate`${ctx.emojiError} Il n'y a plus d'objets dans la boutique !`,
          flags: 64,
        });

        return msg.edit({ components: [] }).catch(() => null);
      }

      let baseUserShop = await ctx.database
        .table("user_shop")
        .select()
        .where({ guild_id: ctx.guild.id, user_id: ctx.user.id });
      if (
        base.filter(
          (o) => !baseUserShop.find((u) => u.object_name === o.object_name)
        ).length === 0
      ) {
        await menu.followUp({
          content: ctx.translate`:information_source: Vous possédez tous les objets !`,
          flags: 64,
        });

        return msg.edit({ components: [] }).catch(() => null);
      }

      selectMenu.setOptions(
        base
          .filter(
            (o) => !baseUserShop.find((u) => u.object_name === o.object_name)
          )
          .map((o) => {
            return {
              label: o.object_name,
              value: String(o.id),
            };
          })
      );

      actionRow = new ActionRowBuilder().addComponents(selectMenu);

      return menu.message
        .edit({
          embeds: [embed],
          components: [actionRow],
        })
        .catch(() => null);
    });

    collectorMenu.on("end", async (_, reason) => {
      if (reason === "time") {
        return msg.edit({ components: [] }).catch(() => null);
      }
    });
  }
};
