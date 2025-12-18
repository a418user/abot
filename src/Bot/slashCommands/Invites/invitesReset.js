const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class InvitesReset extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite-reset",
      description: "Réinitialiser les invitations ajoutés d'un membre",
      options: [
        {
          name: "membre",
          type: 6,
          description:
            "Le membre à qui vous voulez réinitialiser les invitations",
          required: false,
        },
      ],
      category: SlashCommand.Categories.Invites,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre") || null;

    if (member && member.user.bot)
      return ctx.send({
        content: ctx.translate`${ctx.emojiError} Vous ne pouvez pas réinitialiser les invitations d'un bot !`,
        flags: 64,
      });

    let baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    if (!baseInvites[0])
      return ctx.send({
        content: ctx.translate`${ctx.emojiError} ${member} n'est pas classé actuellement !`,
        flags: 64,
      });

    await ctx.database
      .table("user_invite")
      .update({
        added: 0,
      })
      .where({
        guild_id: ctx.guild.id,
        member_id: member.id,
      });

    baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} Les invitations ajoutées de **${member.displayName}** ont été réinitialisées !`,
    });

    await ctx.invitesManager.checkInviteRewards(
      ctx.guild,
      baseInvites[0],
      false
    );
  }
};
