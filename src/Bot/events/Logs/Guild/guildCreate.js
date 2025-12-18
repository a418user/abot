const Events = require("../../../managers/structures/Events");
const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = class GuildCreate extends Events {
  constructor(client) {
    super(client, "guildCreate");
  }

  async handle(guild) {
    /* Add Statistics for the Dashboard */
    await this.client.statistics.addNewServerPerDay();

    /* Add invites to the cache */
    await this.invitesManager.cacheGuildInvites(guild);

    /* Get the channel */
    let channel = guild.systemChannel;
    if (!channel)
      channel = guild.channels.cache
        .filter((c) => c.type === 0)
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .find((c) =>
          c
            .permissionsFor(guild.members.me)
            .any(["ViewChannel", "EmbedLinks", "SendMessages"])
        );

    if (channel) {
      /* Create the embed */
      const embed = new EmbedBuilder()
        .setTitle(this.translate`Coucou toi 👋`)
        .setThumbnail(this.client.user.displayAvatarURL())
        .setColor(this.colors.blue)
        .setDescription(
          this.translate`
        Salut 👋

        Je suis le @abot ! Un bot français, tout nouveau et qui peut t aider dans plein de domaines ! Je suis certain de pouvoir améliorer ton serveur, alors qu'attends tu ?

        Je possède de nombreux systèmes divers et variés entièrement configurable un par un. Tu peux voir toutes mes commandes disponibles avec /help, ou encore sa commande /setup pour encore plus de facilité ^^

        Nous avons pour objectif de répondre le mieux possible aux besoins des personnes qui utilisent ce bot pour, par exemple, créer des serveurs ou gérer leur communauté, s'amuser avec ou encore faire gagner des cadeaux et qu'il soit le plus accessible!! Alors nous espérons que le bot vous plaira et nous attendons votre retour sur notre support dans le salon des avis [lien du support](${this.config["system"]["serverSupport"]}). 

        Merci de votre soutien !!
        `
        )
        .setFooter({
          text: `${this.client.user.displayName}`,
          iconURL: this.client.user.displayAvatarURL(),
        });

      const embed2 = new EmbedBuilder()
        .setThumbnail(this.client.user.displayAvatarURL())
        .setColor(this.colors.blue).setDescription(this
        .translate`# Comment nous avez-vous trouvé ?

*Répondre à cette question vous prendra moins de 10 secondes et nous aidera à améliorer le bot !*`);

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`feedback_${guild.id}`)
        .setPlaceholder(this.translate`Sélectionner une réponse`)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
          {
            label: this.translate`Support du bot`,
            value: "support",
            emoji: "🛠️",
          },
          { label: this.translate`Site web`, value: "website", emoji: "🌐" },
          { label: this.translate`Top.gg`, value: "topgg", emoji: "🔝" },
          { label: this.translate`Disboard`, value: "disboard", emoji: "📦" },
          { label: this.translate`Autres`, value: "other", emoji: "❓" },
        ]);

      const actionRow = new ActionRowBuilder().addComponents(menu);

      /* Send the embed */
      channel
        .send({ embeds: [embed, embed2], components: [actionRow] })
        .catch(() => null);
    }

    /* Get the log channel */
    const logChannel = this.client.channels.cache.get(
      this.config["system"]["logAddRemoveChannelId"]
    );
    if (!logChannel) return;

    /* Check bot permissions */
    if (!logChannel.guild.members.me.permissions.has("Administrator")) {
      if (!logChannel.viewable) return;
      if (
        !logChannel
          .permissionsFor(this.client.user.id)
          .any(["EmbedLinks", "SendMessages"])
      )
        return;
    }

    /* Fetch members */
    const members = await guild.members.fetch();
    const owner = members.get(guild.ownerId);

    let invite = null;
    const channelInvite = guild.channels.cache.find(
      (channel) =>
        channel.type === 0 &&
        channel.permissionsFor(guild.members.me).has("CreateInstantInvite")
    );
    if (channelInvite) {
      invite = await channelInvite
        .createInvite({ maxAge: 0 })
        .catch(() => null);
    }

    /* Create the embed */
    const embedLog = new EmbedBuilder()
      .setColor(this.colors.blue)
      .setAuthor({
        name: this.translate`Arrivé sur un serveur`,
        iconURL: guild.iconURL() || this.client.user.displayAvatarURL(),
      })
      .setDescription(
        this.translate`> ${this.emojis.bot} **Nom :** \`${guild.name}\`
> ${this.emojis.id} **Identifiant :**\`${guild.id}\`
> ${this.emojis.msg} **Description :** \`${
          guild.description
            ? guild.description
            : this.translate`Aucune description`
        }\`
> ${this.emojis.owner} **Propriétaire :** ${owner.user} - \`${
          owner.user.displayName
        }\` (\`${guild.ownerId}\`)
> ${this.emojis.members} **Membres :** \`${members.size}\`
> ${this.emojis.boost} **Boost :** \`${
          guild.premiumSubscriptionCount
            ? guild.premiumSubscriptionCount
            : this.translate`Aucune boost`
        }\`
> ${this.emojis.giveaway} **Date de création :** <t:${Math.floor(
          guild.createdAt / 1000
        )}:F>
> ${this.emojis.arrow} **Invitation :** ${
          invite !== null ? `discord.gg/${invite.code}` : "`Aucune`"
        }
> ${this.emojis.arrow} **Serveur du bot :** \`${
          this.client.guilds.cache.size
        }\``
      )
      .setFooter({
        text: this.client.user.displayName,
        iconURL: this.client.user.displayAvatarURL(),
      });

    /* Send the embed */
    logChannel.send({ embeds: [embedLog] }).catch(() => null);
  }
};
