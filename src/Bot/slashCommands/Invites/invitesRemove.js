const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class InvitesRemove extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite-retrait",
      description: "Retirer des invitations à un membre",
      options: [
        {
          name: "membre",
          type: 6,
          description: "Le membre à qui vous voulez retirer des invitations",
          required: true,
        },
        {
          name: "nombre",
          type: 4,
          description: "Le nombre d'invitations que vous voulez retirer",
          required: true,
          min_value: 1,
        },
      ],
      category: SlashCommand.Categories.Invites,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre");
    const invites = ctx.options.getInteger("nombre");

    if (member.user.bot)
      return ctx.send({
        content: ctx.translate`${ctx.emojiError} Vous ne pouvez pas retirer d'invitations à un bot !`,
        flags: 64,
      });

    let baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    if (!baseInvites[0])
      return ctx.error(ctx.translate`Ce membre n'a pas d'invitations !`);

    await ctx.database
      .table("user_invite")
      .update({
        added: baseInvites[0].added - invites,
      })
      .where({
        guild_id: ctx.guild.id,
        member_id: member.id,
      });

    baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });
    const inviteCount = ctx.invitesManager.getEffectiveInvites(baseInvites[0]);
    const removedInvitesText =
      invites > 1
        ? ctx.translate`invitations ont été retirées`
        : ctx.translate`invitation a été retirée`;
    const totalInvitesText =
      inviteCount > 1 ? ctx.translate`invitations` : ctx.translate`invitation`;
    ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} \`${invites}\` ${removedInvitesText} à ${member} ! Il possède maintenant \`${inviteCount}\` ${totalInvitesText} !`,
    });
  }
};
