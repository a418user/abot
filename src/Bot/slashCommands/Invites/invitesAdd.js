const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class InvitesAdd extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite-ajout",
      description: "Ajouter des invitations à un membre",
      options: [
        {
          name: "membre",
          type: 6,
          description: "Le membre à qui vous voulez ajouter des invitations",
          required: true,
        },
        {
          name: "nombre",
          type: 4,
          description: "Le nombre d'invitations que vous voulez ajouter",
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
        content: ctx.translate`${ctx.emojiError} Vous ne pouvez pas ajouter d'invitations à un bot !`,
        flags: 64,
      });

    let baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    if (!baseInvites[0]) {
      await ctx.database.table("user_invite").insert({
        guild_id: ctx.guild.id,
        member_id: member.id,
        added: invites,
      });
    } else {
      await ctx.database
        .table("user_invite")
        .update({
          added: baseInvites[0].added + invites,
        })
        .where({
          guild_id: ctx.guild.id,
          member_id: member.id,
        });
    }

    baseInvites = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    const inviteCount = ctx.invitesManager.getEffectiveInvites(baseInvites[0]);
    const addedInvitesText =
      invites > 1
        ? ctx.translate`invitations ont été ajoutées`
        : ctx.translate`invitation a été ajoutée`;
    const totalInvitesText =
      inviteCount > 1 ? ctx.translate`invitations` : ctx.translate`invitation`;
    ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} \`${invites}\` ${addedInvitesText} à ${member} ! Il possède maintenant \`${inviteCount}\` ${totalInvitesText} !`,
    });
  }
};
