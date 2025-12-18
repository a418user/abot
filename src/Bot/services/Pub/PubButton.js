const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");

module.exports = class PubButton {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
    this.event = event;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    if (
      inter.customId !== "pub_accept" &&
      inter.customId !== "pub_refuse" &&
      inter.customId !== "pub_delete" &&
      inter.customId !== "pub_delete_log"
    )
      return;

    await inter.deferUpdate();

    const base = await this.database
      .table("guild_pub_channel")
      .select()
      .where({ guild_id: inter.guild.id });
    if (!base[0]) return;

    // Get the pub
    const pub = await this.database.table("guild_pub").select().where({
      guild_id: inter.guild.id,
      message_verification_id: inter.message.id,
    });

    // Check if the pub exists
    if (!pub[0]) {
      // Delete the message
      return inter.message.delete().catch(() => null);
    }

    if (inter.customId === "pub_accept") {
      // Delete the message
      await inter.message.delete().catch(() => null);

      // Add the pub to the user
      await this.event.addVerifiedPubToMember(inter, inter.member);

      // Add the pub to the channel
      await this.event.addVerifiedPubToChannel(inter, pub[0].channel_id);

      // Send a success message
      const res = await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} La publicité a été acceptée avec succès !`,
        flags: 64,
      });

      const logChannel = inter.guild.channels.cache.get(base[0].log_channel_id);

      const verifiedLine = this
        .translate`> **Vérifié par :** ${inter.member} ${inter.member.displayName} (\`${inter.member.id}\`)`;

      const embedLog = new EmbedBuilder()
        .setDescription(
          `${inter.message.embeds[0].data.fields[0].value}\n${verifiedLine}`
        )
        .setColor(this.event.colors.blue)
        .setThumbnail(
          inter.guild.iconURL() || inter.client.user.displayAvatarURL()
        )
        .setFooter({
          text: inter.guild.name,
          iconURL:
            inter.guild.iconURL() || inter.client.user.displayAvatarURL(),
        });

      const buttonDeleteLog = ButtonBuilder.from(
        inter.message.components[0].components[2]
      ).setCustomId("pub_delete_log");

      const actionRow = new ActionRowBuilder()
        .addComponents(buttonDeleteLog)
        .addComponents(inter.message.components[0].components[3]);

      let message = null;
      if (logChannel) {
        message = await logChannel.send({
          content: inter.message.embeds[0].data.description,
          embeds: [embedLog],
          components: [actionRow],
        });
      }

      // Update the database
      await this.database
        .table("guild_pub")
        .update({
          inVerification: false,
          message_verification_id: message ? message.id : inter.message.id,
        })
        .where({
          guild_id: inter.guild.id,
          message_verification_id: inter.message.id,
        });

      // Wait 5 seconds
      await this.utils.sleep(5000);

      // Delete the message
      await inter.deleteReply(res.id).catch(() => null);
    } else if (inter.customId === "pub_refuse") {
      // Get the channel where the pub has been posted
      const channel = inter.guild.channels.cache.get(pub[0].channel_id);
      if (channel) {
        // Get the message
        const message = await channel.messages
          .fetch(pub[0].message_id)
          .catch(() => null);
        if (message) {
          // Delete the message
          await message.delete().catch(() => null);
        }
      }

      // Delete the database
      await this.database.table("guild_pub").delete().where({
        guild_id: inter.guild.id,
        message_verification_id: inter.message.id,
      });

      // Delete the message
      await inter.message.delete().catch(() => null);

      // Add the pub to the user
      await this.event.addVerifiedPubToMember(inter, inter.member);

      // Send a success message
      const res = await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} La publicité a été refusée avec succès !`,
        flags: 64,
      });

      // Wait 5 seconds
      await this.utils.sleep(5000);

      // Delete the message
      await inter.deleteReply(res.id).catch(() => null);
    } else if (inter.customId === "pub_delete") {
      // Get the channel
      const channel = inter.guild.channels.cache.get(pub[0].channel_id);
      if (channel) {
        // Get the message
        const message = await channel.messages
          .fetch(pub[0].message_id)
          .catch(() => null);
        if (message) {
          // Delete the message
          await message.delete().catch(() => null);
        }
      }

      // Delete the database
      await this.database.table("guild_pub").delete().where({
        guild_id: inter.guild.id,
        message_verification_id: inter.message.id,
      });

      // Delete the message
      await inter.message.delete().catch(() => null);

      // Add the pub to the user
      await this.event.addVerifiedPubToMember(inter, inter.member);

      // Send a success message
      const res = await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} La publicité a été supprimée avec succès !`,
        flags: 64,
      });

      // Wait 5 seconds
      await this.utils.sleep(5000);

      // Delete the message
      await inter.deleteReply(res.id).catch(() => null);
    } else if (inter.customId === "pub_delete_log") {
      // Get the channel
      const channel = inter.guild.channels.cache.get(pub[0].channel_id);
      if (channel) {
        // Get the message
        const message = await channel.messages
          .fetch(pub[0].message_id)
          .catch(() => null);
        if (message) {
          // Delete the message
          await message.delete().catch(() => null);
        }
      }

      // Delete the database
      await this.database.table("guild_pub").delete().where({
        guild_id: inter.guild.id,
        message_verification_id: inter.message.id,
      });

      // Delete the message
      await inter.message.delete().catch(() => null);

      // Send a success message
      const res = await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} La publicité a été supprimée avec succès !`,
        flags: 64,
      });

      // Wait 5 seconds
      await this.utils.sleep(5000);

      // Delete the message
      await inter.deleteReply(res.id).catch(() => null);
    }
  }
};
