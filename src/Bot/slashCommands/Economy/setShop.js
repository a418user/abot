const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

module.exports = class SetShop extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "boutique-configurer",
      description: "Gérer la boutique",
      category: SlashCommand.Categories.Economy,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  async run(ctx) {
    let base = await ctx.database
      .table("guild_shop")
      .select()
      .where("guild_id", ctx.guild.id);

    const baseGuildMoney = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);
    const name =
      baseGuildMoney[0] && baseGuildMoney[0].name
        ? baseGuildMoney[0].name
        : "coins";

    const getItemsDescription = () =>
      base[0]
        ? base
            .map(
              (o) =>
                ctx.translate` - ${o.object_name} : \`${o.object_price}\` ${name}`
            )
            .join("\n")
        : ctx.translate`Aucun`;
    const getShopDescription = () =>
      ctx.translate`Bienvenue dans la gestion de la boutique ! Vous pouvez ajouter ou supprimer des objets de la boutique.\n\n- Pour ajouter un objet, cliquez sur le bouton \`Ajouter un objet\`.\n- Pour supprimer un objet, cliquez sur le bouton \`Supprimer un objet\`.\n- Pour fermer la boutique, cliquez sur le bouton \`Fermer\`.\n\n- **Objets :**\n${getItemsDescription()}`;

    const embed = new EmbedBuilder()
      .setTitle(ctx.translate`Gestion de la boutique`)
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .setColor(ctx.colors.blue)
      .setDescription(getShopDescription());

    let buttonAdd = new ButtonBuilder()
      .setStyle(2)
      .setLabel(ctx.translate`Ajouter un objet`)
      .setCustomId("add")
      .setDisabled(base.length >= 15);

    let buttonRemove = new ButtonBuilder()
      .setStyle(2)
      .setLabel(ctx.translate`Supprimer un objet`)
      .setCustomId("remove")
      .setDisabled(base.length < 1);

    const buttonClose = new ButtonBuilder()
      .setStyle(4)
      .setLabel(ctx.translate`Fermer`)
      .setCustomId("cancel_main_shop");

    let actionRow = new ActionRowBuilder()
      .addComponents(buttonAdd)
      .addComponents(buttonRemove)
      .addComponents(buttonClose);

    const msg = await ctx.send({ embeds: [embed], components: [actionRow] });

    const filter = (i) => i.user.id === ctx.user.id;
    const collectorButton = msg.createMessageComponentCollector({
      filter: filter,
      time: 15 * 60 * 1000,
      componentType: 2,
    });

    collectorButton.on("collect", async (button) => {
      if (button.customId === "add") {
        if (base.length >= 15)
          return ctx.error(
            ctx.translate`Vous ne pouvez pas ajouter plus de 15 objets dans la boutique !`
          );

        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_shop_${date}`)
          .setTitle(ctx.translate`Ajout d'un objet`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_shop_name")
          .setStyle(1)
          .setLabel(ctx.translate`Quel est le nom de l'objet ?`)
          .setRequired(true);

        const textInput2 = new TextInputBuilder()
          .setCustomId("modal_shop_price")
          .setStyle(1)
          .setLabel(ctx.translate`Quel est le prix de l'objet ?`)
          .setRequired(true);

        let actionRow = new ActionRowBuilder().addComponents(textInput);

        const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

        modal.addComponents(actionRow, actionRow2);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) => modal.customId === `modal_shop_${date}`;
        ctx.inter
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const objectName =
              modal.fields.getTextInputValue("modal_shop_name");
            const objectPrice = Number(
              modal.fields.getTextInputValue("modal_shop_price")
            );

            if (isNaN(objectPrice) || typeof objectPrice !== "number") {
              return modal.followUp({
                content: ctx.translate`${ctx.emojiError} Le prix de l'objet doit être un nombre entier !`,
                flags: 64,
              });
            }

            await ctx.database.table("guild_shop").insert({
              guild_id: ctx.guild.id,
              object_name: objectName,
              object_price: objectPrice,
            });

            base = await ctx.database
              .table("guild_shop")
              .select()
              .where("guild_id", ctx.guild.id);

            embed.setDescription(getShopDescription());
            buttonAdd.setDisabled(base.length >= 15);
            buttonRemove.setDisabled(base.length < 1);
            actionRow = new ActionRowBuilder()
              .addComponents(buttonAdd)
              .addComponents(buttonRemove)
              .addComponents(buttonClose);

            return button.message
              .edit({ embeds: [embed], components: [actionRow] })
              .catch(() => null);
          });
      } else if (button.customId === "remove") {
        if (base.length < 1)
          return ctx.error(
            ctx.translate`Vous ne pouvez pas supprimer d'objets car il n'y en a pas !`
          );

        const date = Date.now();
        const modal = new ModalBuilder()
          .setCustomId(`modal_shop_delete_${date}`)
          .setTitle(ctx.translate`Suppression d'un objet`);

        const textInput = new TextInputBuilder()
          .setCustomId("modal_shop_name")
          .setStyle(1)
          .setLabel(ctx.translate`Quel est le nom de l'objet ?`)
          .setRequired(true);

        let actionRow = new ActionRowBuilder().addComponents(textInput);

        modal.addComponents(actionRow);

        button.showModal(modal).catch(() => null);

        const filterModal = (modal) =>
          modal.customId === `modal_shop_delete_${date}`;
        ctx.inter
          .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
          .catch(() => null)
          .then(async (modal) => {
            if (modal === undefined || modal === null) return;
            await modal.deferUpdate().catch(() => null);
            const objectName =
              modal.fields.getTextInputValue("modal_shop_name");

            if (!base.find((o) => o.object_name === objectName))
              return modal.followUp({
                content: ctx.translate`${ctx.emojiError} Cet objet n'existe pas dans la boutique !`,
                flags: 64,
              });

            await ctx.database.table("guild_shop").delete().where({
              guild_id: ctx.guild.id,
              object_name: objectName,
            });

            base = await ctx.database
              .table("guild_shop")
              .select()
              .where("guild_id", ctx.guild.id);

            embed.setDescription(getShopDescription());
            buttonAdd.setDisabled(base.length >= 15);
            buttonRemove.setDisabled(base.length < 1);
            actionRow = new ActionRowBuilder()
              .addComponents(buttonAdd)
              .addComponents(buttonRemove)
              .addComponents(buttonClose);

            return button.message
              .edit({ embeds: [embed], components: [actionRow] })
              .catch(() => null);
          });
      } else if (button.customId === "cancel_main_shop") {
        await button.deferUpdate();
        collectorButton.stop();
        return button.message
          .edit({ embeds: [embed], components: [] })
          .catch(() => null);
      }
    });

    collectorButton.on("end", async (_, reason) => {
      if (reason === "time") {
        return msg.edit({ components: [] }).catch(() => null);
      }
    });
  }
};
