const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = class Kick extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "kick",
      description: "Expulser un membre",
      options: [
        {
          name: "membre",
          description: "Membre à expulser",
          type: 6,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["KickMembers"],
      bot_permissions: ["KickMembers", "EmbedLinks"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre");
    if (!member)
      return ctx.error(
        ctx.translate`Ce membre n'est pas présent sur le serveur !`
      );

    if (!member.kickable)
      return ctx.error(ctx.translate`Je ne peux pas expulser ce membre !`);
    if (member.id === ctx.user.id)
      return ctx.error(
        ctx.translate`Vous ne pouvez pas vous expulser vous même !`
      );
    if (member.id === ctx.client.user.id)
      return ctx.error(ctx.translate`Vous ne pouvez pas m'expulser !`);
    if (member.id === ctx.guild.ownerId)
      return ctx.error(
        ctx.translate`Vous ne pouvez pas expulser le propriétaire du serveur !`
      );

    if (
      member.roles.highest.position >=
      ctx.guild.members.me.roles.highest.position
    )
      return ctx.error(ctx.translate`Je ne peux pas expulser ce membre !`);
    if (
      member.roles.highest.position >= ctx.member.roles.highest.position &&
      ctx.user.id !== ctx.guild.ownerId
    )
      return ctx.error(
        ctx.translate`Vous ne pouvez pas expulser ce membre car il est plus haut hiérarchiquement !`
      );

    const modal = new ModalBuilder()
      .setCustomId(`modal_kick${member.id}`)
      .setTitle(ctx.translate`Expulsion de ${member.user.displayName}`);

    const textInput = new TextInputBuilder()
      .setCustomId("modal_kick_reason")
      .setStyle(2)
      .setLabel(ctx.translate`Quelle est la raison de l'expulsion ?`)
      .setPlaceholder(ctx.translate`Laisser vide pour ne pas donner de raison.`)
      .setRequired(false);

    const actionRow = new ActionRowBuilder().addComponents(textInput);

    modal.addComponents(actionRow);

    ctx.inter.showModal(modal).catch(() => null);

    const filter = (modal) => modal.customId === `modal_kick${member.id}`;
    ctx.inter
      .awaitModalSubmit({ filter: filter, time: 2 * 60 * 1000 })
      .catch(() => null)
      .then(async (modal) => {
        if (modal === undefined || modal === null) return;
        await modal.deferUpdate().catch(() => null);
        const reason =
          modal.fields.getTextInputValue("modal_kick_reason") ||
          ctx.translate`Aucune raison donnée`;

        await member
          .send({
            content: ctx.translate`Bonjour, vous avez été expulsé du serveur **${ctx.guild.name}** pour : **${reason}**`,
          })
          .catch(() => null);

        await ctx.guild.members.cache
          .get(member.id)
          .kick({ reason: reason })
          .catch(() => null);

        const embed = new EmbedBuilder()
          .setColor(ctx.colors.blue)
          .setFooter({
            text: "abot",
            iconURL: ctx.client.user.displayAvatarURL(),
          })
          .setTitle(ctx.translate`Expulsion`)
          .setDescription(
            ctx.translate`**${member.user.displayName}** a été expulsé par \`${ctx.user.displayName}\` pour \`${reason}\` !`
          );

        ctx.send({ embeds: [embed] });
      });
  }
};
