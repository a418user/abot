const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class UnBan extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "unban",
      description: `Débannir un membre`,
      options: [
        {
          name: "membre",
          description: "Membre à débannir",
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
    const user = ctx.options.getUser("membre");

    await ctx.guild.bans.fetch().then((bans) => {
      if (bans.size === 0)
        return ctx.error(
          ctx.translate`Il n'y a aucun bannissement sur le serveur !`
        );
      const bUser = bans.find((b) => b.user.id === user.id);
      if (!bUser)
        return ctx.error(
          ctx.translate`**${user.displayName}** n'est pas banni du serveur !`
        );

      try {
        ctx.guild.members.unban(user.id);

        const embed = new EmbedBuilder()
          .setColor(ctx.colors.blue)
          .setFooter({
            text: "abot",
            iconURL: ctx.client.user.displayAvatarURL(),
          })
          .setTitle(ctx.translate`Débannissement`)
          .setDescription(
            ctx.translate`**${user.displayName}** a été débanni par \`${ctx.user.displayName}\` !`
          );

        ctx.send({ embeds: [embed] });
      } catch {
        ctx.error(ctx.translate`Je ne peux pas débannir ce membre !`);
      }
    });
  }
};
