const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
} = require("discord.js");

module.exports = class Ban extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "ban",
      description: "Bannir un membre",
      options: [
        {
          name: "membre",
          description: "Membre à bannir",
          type: 6,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["BanMembers"],
      bot_permissions: ["BanMembers", "EmbedLinks"],
    });
  }

  async run(ctx) {
    let member = ctx.options.getMember("membre");
    let reason = null;
    const defaultReason = ctx.translate`Aucune raison donnée`;

    const getDisplayName = (target) =>
      target?.displayName ||
      target?.username ||
      target?.tag ||
      ctx.translate`Utilisateur inconnu`;

    if (!member) {
      member = ctx.options.getUser("membre");
      if (!member) return ctx.error(ctx.translate`Le membre est introuvable !`);

      const antiBan = await ctx.database.table("admin_anti_ban").select();
      const isAntiBan = antiBan.find((u) => u.user_id === member.id);
      if (isAntiBan)
        return ctx.error(
          ctx.translate`Le membre **${getDisplayName(
            member
          )}** ne peut pas être banni car il fait partie de mes créateurs !`
        );

      const modal = new ModalBuilder()
        .setCustomId(`modal_ban${member.id}`)
        .setTitle(ctx.translate`Bannissement de ${getDisplayName(member)}`);

      const textInput = new TextInputBuilder()
        .setCustomId("modal_ban_reason")
        .setStyle(2)
        .setLabel(ctx.translate`Quelle est la raison du bannissement ?`)
        .setPlaceholder(
          ctx.translate`Laisser vide pour ne pas donner de raison.`
        )
        .setRequired(false);

      const actionRow = new ActionRowBuilder().addComponents(textInput);

      modal.addComponents(actionRow);

      ctx.inter.showModal(modal).catch(() => null);

      const filter = (modal) => modal.customId === `modal_ban${member.id}`;
      ctx.inter
        .awaitModalSubmit({ filter: filter, time: 2 * 60 * 1000 })
        .catch(() => null)
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);

          reason =
            modal.fields.getTextInputValue("modal_ban_reason") || defaultReason;

          await ctx.guild.members.ban(member.id, { reason: reason });

          const embed = new EmbedBuilder()
            .setColor(ctx.colors.blue)
            .setFooter({
              text: "abot",
              iconURL: ctx.client.user.displayAvatarURL(),
            })
            .setTitle(ctx.translate`Bannissement`)
            .setDescription(
              ctx.translate`**${getDisplayName(member)}** a été banni par \`${
                ctx.user.displayName
              }\` pour \`${reason}\` !`
            );

          ctx.send({ embeds: [embed] });
        });
    } else {
      const antiBan = await ctx.database.table("admin_anti_ban").select();
      const isAntiBan = antiBan.find((u) => u.user_id === member.id);
      if (isAntiBan)
        return ctx.error(
          ctx.translate`Le membre **${member.displayName}** ne peut pas être banni car il fait partie de mes créateurs !`
        );

      if (!member.bannable)
        return ctx.error(ctx.translate`Je ne peux pas bannir ce membre !`);
      if (member.id === ctx.user.id)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas vous bannir vous même !`
        );
      if (member.id === ctx.client.user.id)
        return ctx.error(ctx.translate`Vous ne pouvez pas me bannir !`);
      if (member.id === ctx.guild.ownerId)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas bannir le propriétaire du serveur !`
        );

      if (
        member.roles.highest.position >=
        ctx.guild.members.me.roles.highest.position
      )
        return ctx.error(ctx.translate`Je ne peux pas bannir ce membre !`);
      if (
        member.roles.highest.position >= ctx.member.roles.highest.position &&
        ctx.user.id !== ctx.guild.ownerId
      )
        return ctx.error(
          ctx.translate`Vous ne pouvez pas bannir ce membre car il est plus haut hiérarchiquement !`
        );

      const modal = new ModalBuilder()
        .setCustomId(`modal_ban${member.id}`)
        .setTitle(ctx.translate`Bannissement de ${member.user.displayName}`);

      const textInput = new TextInputBuilder()
        .setCustomId("modal_ban_reason")
        .setStyle(2)
        .setLabel(ctx.translate`Quelle est la raison du bannissement ?`)
        .setPlaceholder(
          ctx.translate`Laisser vide pour ne pas donner de raison.`
        )
        .setRequired(false);

      const actionRow = new ActionRowBuilder().addComponents(textInput);

      modal.addComponents(actionRow);

      ctx.inter.showModal(modal).catch(() => null);

      const filter = (modal) => modal.customId === `modal_ban${member.id}`;
      ctx.inter
        .awaitModalSubmit({ filter: filter, time: 2 * 60 * 1000 })
        .catch(() => null)
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);
          reason =
            modal.fields.getTextInputValue("modal_ban_reason") || defaultReason;

          await member
            .send({
              content: ctx.translate`Bonjour, vous avez été banni du serveur **${ctx.guild.name}** pour : **${reason}**`,
            })
            .catch(() => null);

          await ctx.guild.members.cache
            .get(member.id)
            .ban({ reason: reason, deleteMessageSeconds: 604800 })
            .catch(() => null);

          const embed = new EmbedBuilder()
            .setColor(ctx.colors.blue)
            .setFooter({
              text: "abot",
              iconURL: ctx.client.user.displayAvatarURL(),
            })
            .setTitle(ctx.translate`Bannissement`)
            .setDescription(
              ctx.translate`**${member.user.displayName}** a été banni par \`${ctx.user.displayName}\` pour \`${reason}\` !`
            );

          ctx.send({ embeds: [embed] });

          ctx.send({
            content: ctx.translate`Bien fait pour toi !\nhttps://tenor.com/view/anime-girl-ban-hammer-gif-14716143`,
          });
        });
    }
  }
};
