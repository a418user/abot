const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  version,
} = require("discord.js");
const os = require("os");

module.exports = class Invite extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "info-bot",
      description: "Afficher des informations sur le bot",
      category: SlashCommand.Categories.Information,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const invite = new ButtonBuilder()
      .setStyle(5)
      .setURL(ctx.config["system"]["linkInviteBot"])
      .setLabel(ctx.translate`Inviter le bot`);

    const server = new ButtonBuilder()
      .setStyle(5)
      .setURL(ctx.config["system"]["serverSupport"])
      .setLabel(ctx.translate`Support`);

    const actionRow = new ActionRowBuilder()
      .addComponents(invite)
      .addComponents(server);

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(ctx.translate`Informations sur le serveur ${ctx.guild.name}`)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .addFields(
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur le bot`,
          value:
            ctx.translate`
            > ${ctx.emojis.bot} **Nom** : \`${ctx.client.user.displayName}\`
            > ${ctx.emojis.id} **Identifiant** : \`${ctx.client.user.id}\`
            > ${ctx.emojis.owner} **Fondateur** : \`zegnos\`
            > ${ctx.emojis.dev} **Développeur** : \`zegnos\`
            > ${ctx.emojis.djs} **Discord.js** : \`${version}\`
            > ${ctx.emojis.nodejs} **Node.js** : \`${process.version}\`` +
            `
            > ${ctx.emojis.ping} **Ping** : \`${ctx.client.ws.ping} ms\`
			> ${ctx.emojis.mysql} **Base de Données :** \`MySQL\`
            `,
        },
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur les statistiques`,
          value:
            ctx.translate`
            > ${ctx.emojis.home} **Serveurs** : \`${
              ctx.client.guilds.cache.size
            }\`
            > ${
              ctx.emojis.members
            } **Utilisateurs** : \`${ctx.utils.numberWithSpaces(
              ctx.client.guilds.cache
                .map((guild) => guild.memberCount)
                .reduce((p, c) => p + c)
            )}\`
            > ${
              ctx.emojis.slash
            } **Commandes** : \`${ctx.utils.numberWithSpaces(
              ctx.client.slashCommandsHandler.slashCommands.size
            )}\`
            > ${ctx.emojis.channel} **Salons** : \`${ctx.utils.numberWithSpaces(
              ctx.client.channels.cache.size
            )}\`
            > ${ctx.emojis.fun} **Emojis** : \`${ctx.utils.numberWithSpaces(
              ctx.client.emojis.cache.size
            )}\`` +
            `
            > ${ctx.emojis.giveaway} **Date de création** : <t:${Math.floor(
              ctx.client.user.createdAt / 1000
            )}:F>
            > ${ctx.emojis.online} **Connecté depuis** : <t:${(
              ctx.client.readyTimestamp / 1000
            ).toFixed()}:R>
            `,
        },
        {
          name: ctx.translate`${ctx.emojis.arrow} Informations sur la machine`,
          value: ctx.translate`
            > ${ctx.emojis.dev} **Système** : \`${os.platform()}\`
            > ${ctx.emojis.dev} **Processeur** : \`${os
            .cpus()[0]
            .model.slice(0, os.cpus()[0].model.length - 9)}\`
            > ${ctx.emojis.dev} **Mémoire** : \`8Gb\`
            `,
        }
      )
      .setImage(ctx.guild.bannerURL() || null)
      .setFooter({
        text: ctx.client.user.displayName,
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    ctx.send({
      embeds: [embed],
      components: [actionRow],
    });
  }
};
