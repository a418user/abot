const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class BanList extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "banlist",
      description: "Afficher la liste des membres bannis",
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["BanMembers"],
      bot_permissions: ["KickMembers", "EmbedLinks"],
    });
  }

  async run(ctx) {
    ctx.guild.bans.fetch().then(async (banned) => {
      const banList = banned.map((user) => user.user.displayName).join("\n");

      const noEmbed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setDescription(ctx.translate`Aucun bannissement sur ce serveur !`);

      if (banned.size === 0) return ctx.send({ embeds: [noEmbed] });

      const embed = new EmbedBuilder()
        .setTitle(
          ctx.translate`Liste des bannissements sur le serveur ${ctx.guild.name}`
        )
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setColor(ctx.colors.blue)
        .setDescription(banList);

      if (embed.data.description.length > 4096) {
        // Loop for each 4096 chars
        const embeds = [];
        for (let i = 0; i < embed.data.description.length; i += 4096) {
          const embed = new EmbedBuilder()
            .setTitle(
              ctx.translate`Liste des bannissements sur le serveur ${ctx.guild.name}`
            )
            .setThumbnail(
              ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
            )
            .setColor(ctx.colors.blue)
            .setDescription(banList.slice(i, i + 4096));

          embeds.push(embed);
        }

        return ctx.send({ embeds: embeds });
      }

      return ctx.send({ embeds: [embed] });
    });
  }
};
