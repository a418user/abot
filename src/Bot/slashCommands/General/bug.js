const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} = require("discord.js");

module.exports = class Bug extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "bug",
      description: "Faire remonter un bug aux développeurs",
      options: [
        {
          name: "image",
          description: "Une image pour illustrer votre bug",
          type: 11,
          required: false,
        },
      ],
      category: SlashCommand.Categories.General,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const channel = ctx.client.channels.cache.get(
      ctx.config["system"]["bugChannelId"]
    );
    if (!channel)
      return ctx.error(ctx.translate`Le salon de bug n'existe plus !`);

    const attachment = ctx.options.getAttachment("image")
      ? ctx.options.getAttachment("image").contentType.includes("image")
        ? ctx.options.getAttachment("image").url
        : null
      : null;

    const date = Date.now();

    const modal = new ModalBuilder()
      .setCustomId(`modal_bug__request_${date}`)
      .setTitle(ctx.translate`Nouveau bug`);

    const textInput = new TextInputBuilder()
      .setCustomId("modal_bug_request_reason")
      .setStyle(2)
      .setLabel(ctx.translate`Quel est votre problème ?`)
      .setPlaceholder(
        ctx.translate`Exemple : La commande /report ne fonctionne pas`
      )
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(textInput);

    modal.addComponents([actionRow]);

    ctx.inter.showModal(modal).catch(() => null);

    const filter = (modal) => modal.customId === `modal_bug__request_${date}`;
    ctx.inter
      .awaitModalSubmit({ filter: filter, time: 5 * 60 * 1000 })
      .catch(() => {})
      .then(async (modal) => {
        if (modal === undefined || modal === null) return;
        await modal.deferUpdate().catch(() => null);

        const content = modal.fields.getTextInputValue(
          "modal_bug_request_reason"
        );

        const embed = new EmbedBuilder()
          .setAuthor({
            name: ctx.user.displayName,
            iconURL:
              ctx.user.displayAvatarURL() || ctx.client.user.displayAvatarURL(),
          })
          .setTitle(ctx.translate`Nouveau bug`)
          .setDescription(content)
          .setThumbnail(ctx.client.user.displayAvatarURL())
          .setColor(ctx.colors.blue)
          .setImage(attachment)
          .setFooter({
            text: ctx.translate`${ctx.user.displayName} | ${ctx.guild.name}`,
            iconURL: `${
              ctx.user.displayAvatarURL() || ctx.client.user.displayAvatarURL()
            }`,
          });

        await channel.send({ embeds: [embed] }).catch(() => null);

        await modal.followUp({
          content: ctx.translate`${ctx.emojiSuccess} Votre bug a bien été envoyé !`,
          flags: 64,
        });
      });
  }
};
