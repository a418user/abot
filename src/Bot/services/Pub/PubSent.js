const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class PubSent {
  constructor(client) {
    this.client = client;
    this.database = client.database;
    this.translate = client.translate.bind(client);
  }

  async handle(message) {
    // Check if the message is sent by a bot or not in a guild
    if (message.author.bot || !message.guild) return;

    const base = await this.database
      .table("guild_pub_channel")
      .select()
      .where({ guild_id: message.guild.id });
    if (!base[0]) return;

    // Check the category where the message is sent
    if (message.channel.parentId !== base[0].category_id) return;

    // Check the channel where the message is sent
    const pubChannels = JSON.parse(base[0].channels);
    if (!pubChannels.includes(message.channel.id)) return;

    // Check if the message is a pub
    if (!message.content) return message.delete().catch(() => null);

    // Check if the message has at least 200 characters
    /*if (message.content.length < 200) {
            const msg = await message.channel.send({
                content: ":warning: Votre publicité doit contenir au moins 200 caractères !"
            });

            setTimeout(() => {
                msg.delete().catch(() => null);
            }, 5 * 1000);

            return message.delete().catch(() => null);
        }*/

    // Check if the user is blacklisted
    const blacklisted = await this.database
      .table("pub_blacklist")
      .select()
      .where({
        user_id: message.author.id,
      });

    // If the user is blacklisted, delete the message
    if (blacklisted[0]) {
      return message.delete().catch(() => null);
    }

    // Create the embed for the verification of the pub
    const embed = new EmbedBuilder()
      .setTitle(this.translate`Vérification de la publicité en attente`)
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(message.content)
      .addFields([
        {
          name: this.translate`Information de la publicité`,
          value: this.translate`> ● Membre : ${message.author} ${
            message.member.displayName
          } (\`${message.author.id}\`)
> ● Arrivé sur le serveur : <t:${Math.floor(message.member.joinedAt / 1000)}:F>
> ● Salon de la publicité : ${message.channel} (\`${message.channel.name}\`) `,
        },
      ]);

    const buttonAccept = new ButtonBuilder()
      .setCustomId("pub_accept")
      .setStyle(3)
      .setLabel(this.translate`Accepter`);

    const buttonRefuse = new ButtonBuilder()
      .setCustomId("pub_refuse")
      .setStyle(4)
      .setLabel(this.translate`Refuser`);

    const buttonDelete = new ButtonBuilder()
      .setCustomId("pub_delete")
      .setStyle(2)
      .setLabel(this.translate`Supprimer`);

    const buttonLinkMessage = new ButtonBuilder()
      .setStyle(5)
      .setURL(
        `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
      )
      .setLabel(this.translate`Lien du message`);

    const actionRow = new ActionRowBuilder()
      .addComponents(buttonAccept)
      .addComponents(buttonRefuse)
      .addComponents(buttonDelete)
      .addComponents(buttonLinkMessage);

    // Get the verification channel
    const verificationChannel = message.guild.channels.cache.get(
      base[0].verification_channel_id
    );
    if (!verificationChannel) return;

    // Send the embed in the verification channel
    const messageVerification = await verificationChannel.send({
      content: this
        .translate`**Lien publicitaire en attente de vérification :**`,
      embeds: [embed],
      components: [actionRow],
    });

    await this.database.table("guild_pub").insert({
      guild_id: message.guild.id,
      channel_id: message.channel.id,
      author_id: message.author.id,
      message_id: message.id,
      message_verification_id: messageVerification.id,
      message: message.content,
      inVerification: true,
    });
  }
};
