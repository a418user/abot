const Events = require("../../../managers/structures/Events");
const { EmbedBuilder } = require("discord.js");

module.exports = class MessageDelete extends Events {
  constructor(client) {
    super(client, "messageDelete");
  }

  async handle(deletedMessage) {
    if (deletedMessage.channel.type === 1) return;
    if (!deletedMessage.content) return;
    if (!deletedMessage.guild) return;

    // Ghost ping system
    if (
      deletedMessage.guild.members.me.permissions.has("ManageWebhooks") &&
      deletedMessage.mentions.members.size > 0 &&
      !deletedMessage.author.bot
    ) {
      let checkGhostPing = false;

      deletedMessage.mentions.members.forEach((member) => {
        if (member.user.id !== deletedMessage.author.id && !member.user.bot) {
          checkGhostPing = true;
        }
      });

      if (checkGhostPing) {
        const ghostPing = await this.database
          .table("guild_ghost_ping")
          .select()
          .where({ guild_id: deletedMessage.guild.id });
        if (ghostPing[0]) {
          const channel = deletedMessage.guild.channels.cache.get(
            ghostPing[0].channel_id
          );
          if (!channel) return;

          await channel
            .createWebhook({
              name: deletedMessage.author.displayName,
              avatar: `https://cdn.discordapp.com/avatars/${deletedMessage.author.id}/${deletedMessage.author.avatar}.png`,
              reason: this
                .translate`Ghost ping de ${deletedMessage.author.displayName}`,
            })
            .then((w) => {
              if (deletedMessage.attachments.size > 0) {
                let embeds = [];
                let attachments = [];
                let firstEmbed = true;

                deletedMessage.attachments.forEach(async (attachment) => {
                  if (attachment.contentType.includes("image")) {
                    attachments.push(attachment.url);
                  }
                });

                const embed = new EmbedBuilder()
                  .setURL("https://abot.fr")
                  .setColor(this.colors.blue)
                  .setDescription(
                    this.translate`[GHOST PING]\n${deletedMessage.content}`
                  );

                for (let i = 0; i < attachments.length; i++) {
                  if (firstEmbed) {
                    embed.setImage(attachments[i]);
                    embeds.push(embed);
                    firstEmbed = false;
                  } else {
                    embeds.push(
                      new EmbedBuilder()
                        .setURL("https://abot.fr")
                        .setImage(attachments[i])
                    );
                  }
                }
                w.send({ embeds: embeds });
              } else {
                const embed = new EmbedBuilder()
                  .setColor(this.colors.blue)
                  .setDescription(
                    this.translate`[GHOST PING]\n${deletedMessage.content}`
                  );
                w.send({ embeds: [embed] });
              }
            })
            .catch(() => null);

          const webhooks = await channel.fetchWebhooks();
          const myWebhooks = webhooks.filter(
            (webhook) =>
              webhook.owner.id === this.client.user.id &&
              webhook.name === deletedMessage.author.displayName
          );
          for (let [_, webhook] of myWebhooks)
            await webhook.delete(
              this.translate`Ghost ping ${deletedMessage.author.displayName}`
            );
        }
      }
    }

    // Log messageDelete
    const channel = await this.verificationChannelLog(
      deletedMessage,
      "message_id",
      deletedMessage.guild.id
    );
    if (typeof channel === "boolean") return;

    // No embed in log messages
    if (deletedMessage.embeds.length > 0) return;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${deletedMessage.author.displayName}`,
        iconURL: `${
          deletedMessage.author.displayAvatarURL() ||
          this.client.user.displayAvatarURL()
        }`,
      })
      .setDescription(
        this
          .translate`**Message de ${deletedMessage.author.displayName} supprimé dans ${deletedMessage.channel}**\n${deletedMessage.content}`
      )
      .setFooter({ text: this.translate`Auteur : ${deletedMessage.author.id}` })
      .setColor("#F40808");

    channel.send({ embeds: [embed] }).catch(() => null);
  }
};
