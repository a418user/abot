const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class InfoUser extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "info-user",
      description: "Get information about a user",
      description_localizations: {
        fr: "Donner des informations sur un utilisateur",
      },
      options: [
        {
          name: "user",
          name_localizations: {
            fr: "utilisateur",
          },
          description: "The user you want to get information about",
          description_localizations: {
            fr: "L'utilisateur dont vous souhaitez avoir des informations",
          },
          type: 6,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Information,
      bot_permissions: ["EmbedLinks"],
    });

    this.flags = {
      Staff: "<:Staff:1151631287531077664>",
      Partner: "<:Partner:1151631291469545603>",
      BugHunterLevel1: "<:BugHunterLevel1:1151631325372088350>",
      BugHunterLevel2: "<:BugHunterLevel2:1151631323304304691>",
      HypeSquadOnlineHouse1: "<:HypeSquadOnlineHouse1:1151631318405357648>",
      HypeSquadOnlineHouse2: "<:HypeSquadOnlineHouse2:1151631296842448906>",
      HypeSquadOnlineHouse3: "<:HypeSquadOnlineHouse3:1151631294732709948>",
      PremiumEarlySupporter: "<:PremiumEarlySupporter:1151631289376579624>",
      VerifiedDeveloper: "<:VerifiedDeveloper:1151631284829962261>",
      CertifiedModerator: "<:CertifiedModerator:1151631320506699868>",
      ActiveDeveloper: "<:ActiveDeveloper:1151631321622388818>",
      HypeSquadEvents: "<:Hypesquad:1151631293000458340>",
    };
  }

  async run(ctx) {
    const user = ctx.options.getUser("user") || ctx.user;
    const member = ctx.getMember(user.id) || null;

    const userFlags = await user.fetchFlags().then((e) => e.toArray());
    const urlBanner = await user
      .fetch()
      .then((user) => user.bannerURL({ forceStatic: false, size: 4096 }));
    const isBot = user.bot ? ctx.translate`Oui` : ctx.translate`Non`;
    const noBadge = ctx.translate`Aucun badge.`;
    const noNickname = ctx.translate`Aucun`;
    const memberRoles = member
      ? member.roles.cache.map((r) => `${r}`).join(" ")
      : ctx.translate`Aucun`;

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(ctx.translate`Information sur ${user.displayName}`)
      .setThumbnail(
        ctx.user.displayAvatarURL() || ctx.client.user.displayAvatarURL()
      )
      .setImage(urlBanner || null)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .addFields({
        name: ctx.translate`${ctx.emojis.arrow} Information sur l'utilisateur`,
        value:
          ctx.translate`**Pseudo** : \`${
            user.displayName
          }\`\n**Identifiant** : \`${
            user.id
          }\`\n**Avatar** : **[Lien](${user.displayAvatarURL({
            extension: "png",
          })})**\n**Bot** : \`${isBot}\`\n**Badges** : ${
            userFlags.length
              ? userFlags
                  .map((flag) => this.flags[flag] + " " + flag)
                  .join(" , ")
              : noBadge
          }` +
          `\n> ${
            ctx.emojis.invite
          } **Date de création du compte** : <t:${Math.floor(
            user.createdAt / 1000
          )}:F>`,
      });

    if (member) {
      embed.addFields({
        name: ctx.translate`${ctx.emojis.arrow} Information sur le membre`,
        value:
          ctx.translate`**Surnom** : \`${
            member.nickname ? member.nickname : noNickname
          }\`\n**Roles** \`(${member.roles.cache.size})\` : ${memberRoles}` +
          `\n> ${ctx.emojis.giveaway} **Date d'arrivée** : <t:${Math.floor(
            member.joinedAt / 1000
          )}:F>`,
      });
    }

    ctx.send({ embeds: [embed] });
  }
};
