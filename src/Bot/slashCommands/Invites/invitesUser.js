const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class InvitesUser extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite-membre",
      description: "Afficher les invitations d'un membre",
      options: [
        {
          name: "membre",
          description: "Le membre dont vous voulez voir les invitations",
          type: 6,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Invites,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre") || ctx.member;

    const invitesDb = await ctx.database.table("user_invite").select().where({
      guild_id: ctx.guild.id,
      member_id: member.id,
    });

    if (!invitesDb[0])
      return ctx.error(
        ctx.translate`${member} n'est pas classé actuellement !`
      );

    const inviteCount = ctx.invitesManager.getEffectiveInvites(invitesDb[0]);
    const inviteLabel =
      inviteCount > 1 ? ctx.translate`invitations` : ctx.translate`invitation`;

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(ctx.translate`Invitation | ${member.user.displayName}`)
      .setDescription(
        ctx.translate`${member} possède \`${inviteCount}\` ${inviteLabel}.`
      )
      .addFields([
        {
          name: ctx.translate`Total Invites`,
          value: `**${invitesDb[0]?.tracked + invitesDb[0]?.added || 0}**`,
          inline: true,
        },
        {
          name: ctx.translate`Fake Invites`,
          value: `**${invitesDb[0]?.fake || 0}**`,
          inline: true,
        },
        {
          name: ctx.translate`Left Invites`,
          value: `**${invitesDb[0]?.left || 0}**`,
          inline: true,
        },
      ])
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    ctx.send({ embeds: [embed] });
  }
};
