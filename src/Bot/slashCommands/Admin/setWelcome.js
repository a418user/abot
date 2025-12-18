const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = class SetWelcome extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "welcome",
      description: "Gérer les message de bienvenue",
      options: [
        {
          name: "configurer",
          description: "Configurer les messages de bienvenue",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Salon où seront postées les messages de bienvenue",
              type: 7,
              channel_types: [0],
              required: true,
            },
            {
              name: "mention",
              description: "Mentionner le membre dans le message de bienvenue",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer le message de bienvenue",
          type: 1,
        },
        {
          name: "variables",
          description:
            "Afficher les variables disponibles pour les messages de bienvenue",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Admin,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const base = await ctx.database
      .table("guild_welcome")
      .select()
      .where("guild_id", ctx.guild.id);

    if (subCommand === "configurer") {
      const channel = ctx.options.getChannel("salon");
      const mention = ctx.options.getBoolean("mention");

      const date = Date.now();
      const modal = new ModalBuilder()
        .setCustomId(`modal_welcome_${date}`)
        .setTitle(ctx.translate("Message de Bienvenue"));

      const textInput1 = new TextInputBuilder()
        .setCustomId("modal_bvn_text")
        .setStyle(2)
        .setLabel(ctx.translate("Quel message de bienvenue souhaitez-vous ?"))
        .setPlaceholder(ctx.translate("Pensez à inclure des variables."))
        .setRequired(false)
        .setMaxLength(4000);

      const actionRow = new ActionRowBuilder().addComponents(textInput1);

      modal.addComponents(actionRow);

      ctx.inter.showModal(modal).catch(() => null);

      const filterModal = (modal) => modal.customId === `modal_welcome_${date}`;
      ctx.inter
        .awaitModalSubmit({ filter: filterModal, time: 10 * 60 * 1000 })
        .catch(() => null)
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);
          const messageBvn =
            modal.fields.getTextInputValue("modal_bvn_text") || null;

          if (!base[0]) {
            await ctx.database.table("guild_welcome").insert({
              guild_id: ctx.guild.id,
              channel_welcome_id: channel.id,
              mention: mention,
              msg_bvn: messageBvn,
            });

            await modal.followUp(
              ctx.translate(
                `${ctx.emojiSuccess} Le message de bienvenue a été configuré !`
              )
            );
          } else {
            await ctx.database
              .table("guild_welcome")
              .update({
                channel_welcome_id: channel.id,
                mention: mention,
                msg_bvn: messageBvn,
              })
              .where("guild_id", ctx.guild.id);

            await modal.followUp(
              ctx.translate(
                `${ctx.emojiSuccess} Le message de bienvenue a été mis à jour !`
              )
            );
          }
        });
    } else if (subCommand === "supprimer") {
      if (!base[0] || !base[0].channel_welcome_id)
        return ctx.error(
          ctx.translate(
            "Les messages de bienvenue ne sont pas configurés sur ce serveur !"
          )
        );

      if (!base[0].channel_leave_id) {
        await ctx.database
          .table("guild_welcome")
          .delete()
          .where("guild_id", ctx.guild.id);
      } else {
        await ctx.database
          .table("guild_welcome")
          .update({
            channel_welcome_id: null,
          })
          .where("guild_id", ctx.guild.id);
      }

      ctx.send({
        content: ctx.translate(
          `${ctx.emojiSuccess} Le message de bienvenue a été supprimé !`
        ),
      });
    } else if (subCommand === "variables") {
      const embed = new EmbedBuilder()
        .setTitle(ctx.translate("Variables pour les messages d'arrivée"))
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setDescription(
          `\`{user.mention}\` -  Mention utilisateur` +
            "\n" +
            `\`{user.username}\` -  Nom utilisateur` +
            "\n" +
            `\`{member.nickname}\` -  Pseudo membre` +
            "\n" +
            `\`{server}\` -  Nom du serveur`
        );

      ctx.send({ embeds: [embed] });
    }
  }
};
