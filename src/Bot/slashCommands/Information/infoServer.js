const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class InfoServer extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "info-server",
      description: "Donner des informations sur le serveur",
      category: SlashCommand.Categories.Information,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const members = await ctx.guild.members.fetch();
    const description = ctx.guild.description
      ? ctx.guild.description
      : ctx.translate`Aucune description`;
    const rulesChannel = ctx.guild.rulesChannel
      ? ctx.guild.rulesChannel
      : ctx.translate`Aucun`;

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(ctx.translate`Informations sur le serveur ${ctx.guild.name}`)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .addFields(
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur le serveur`,
          value:
            ctx.translate`**Nom** : \`${
              ctx.guild.name
            }\`\n**Propriétaire** : ${ctx.getMember(
              ctx.guild.ownerId
            )}\n**Description** : \`${description}\`\n**ID** : \`${
              ctx.guild.id
            }\`\n**Boost** : \`${ctx.guild.premiumSubscriptionCount} (${
              ctx.guild.premiumTier
            })\`\n**NSFW** : \`${ctx.guild.nsfwLevel}\`\n**Membres** : \`${
              members.size
            }\`` +
            `\n> ${ctx.emojis.invite} **Date de création** : <t:${Math.floor(
              ctx.guild.createdAt / 1000
            )}:F>`,
        },
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur les statistiques`,
          value: ctx.translate`> **Total des salons** : \`${
            ctx.guild.channels.cache.size
          }\`\n> **Salons textuels** : \`${
            ctx.guild.channels.cache.filter((c) => c.type === 0).size
          }\`\n> **Salons vocaux** : \`${
            ctx.guild.channels.cache.filter((c) => c.type === 2).size
          }\`\n> **Forums** : \`${
            ctx.guild.channels.cache.filter((c) => c.type === 15).size
          }\`\n> **Catégories** : \`${
            ctx.guild.channels.cache.filter((c) => c.type === 4).size
          }\`\n> **Salons Stages** : \`${
            ctx.guild.channels.cache.filter((c) => c.type === 13).size
          }\`\n> **Rôles** : \`${
            ctx.guild.roles.cache.size
          }\`\n> **Emojis** : \`${ctx.guild.emojis.cache.size}\``,
        },
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur les salons spéciaux`,
          value: ctx.translate`**Règlement** : ${rulesChannel}`,
        }
      )
      .setImage(ctx.guild.bannerURL() || null)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    ctx.send({ embeds: [embed] });
  }
};
