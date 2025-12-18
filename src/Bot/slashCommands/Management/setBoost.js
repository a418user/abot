const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = class Boost extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "boosts",
      description: "Gérer les message de boosts",
      options: [
        {
          name: "configurer",
          description: "Configurer les messages de boosts",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Salon où seront postées les messages de boosts",
              type: 7,
              channel_types: [0],
              required: true,
            },
            {
              name: "mention",
              description: "Mentionner le membre dans le message de boosts",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le message de boosts",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_boost")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const channel = ctx.options.getChannel("salon");
      const mention = ctx.options.getBoolean("mention");

      const date = Date.now();
      const modal = new ModalBuilder()
        .setCustomId(`modal_boost_${date}`)
        .setTitle(ctx.translate`Message de boost`);

      const textInput1 = new TextInputBuilder()
        .setCustomId("modal_boost_text")
        .setStyle(2)
        .setLabel(ctx.translate`Message de boost`)
        .setPlaceholder(
          ctx.translate`Mettez {username} / {server} pour avoir son pseudo / le nom du serveur`
        )
        .setRequired(false)
        .setMaxLength(4000);

      const textInput2 = new TextInputBuilder()
        .setCustomId("modal_boost_text2")
        .setStyle(2)
        .setLabel(ctx.translate`Message de unBoost`)
        .setPlaceholder(
          ctx.translate`Mettez {username} / {server} pour avoir son pseudo / le nom du serveur`
        )
        .setRequired(false)
        .setMaxLength(4000);

      const actionRow = new ActionRowBuilder().addComponents(textInput1);

      const actionRow2 = new ActionRowBuilder().addComponents(textInput2);

      modal.addComponents(actionRow, actionRow2);

      ctx.inter.showModal(modal).catch(() => null);

      const filterModal = (modal) => modal.customId === `modal_boost_${date}`;
      ctx.inter
        .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
        .catch(() => null)
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);
          const messageBoost =
            modal.fields.getTextInputValue("modal_boost_text") || null;
          const messageUnBoost =
            modal.fields.getTextInputValue("modal_boost_text2") || null;

          if (!base[0]) {
            await ctx.database.table("guild_boost").insert({
              guild_id: ctx.guild.id,
              channel_id: channel.id,
              mention: mention,
              message_add: messageBoost,
              message_remove: messageUnBoost,
            });
            await modal.followUp(
              `${
                ctx.emojiSuccess
              } ${ctx.translate`Les messages de boosts ont été configurés !`}`
            );
          } else {
            await ctx.database
              .table("guild_boost")
              .update({
                channel_id: channel.id,
                mention: mention,
                message_add: messageBoost,
                message_remove: messageUnBoost,
              })
              .where("guild_id", ctx.guild.id);

            await modal.followUp(
              `${
                ctx.emojiSuccess
              } ${ctx.translate`Les messages de boosts ont été mis à jour !`}`
            );
          }
        });
    } else if (subCommand === "supprimer") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Les messages de boosts ne sont pas configurés sur ce serveur !`
        );

      await ctx.database
        .table("guild_boost")
        .delete()
        .where("guild_id", ctx.guild.id);
      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Les messages de boosts ont été supprimés !`}`,
      });
    }
  }
};
