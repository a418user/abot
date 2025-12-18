const { EmbedBuilder } = require("discord.js");

module.exports = class PollButton {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
    this.translate = event.translate.bind(event);
  }

  async displayEmbed(ctx, data) {
    const message = await ctx.channel.messages.fetch(ctx.message.id);
    const oldEmbed = EmbedBuilder.from(message.embeds[0]);

    const embed = new EmbedBuilder()
      .setTitle(message.embeds[0].title)
      .setDescription(message.embeds[0].description)
      .setColor(message.embeds[0].color)
      .setFooter({
        text: message.embeds[0].footer.text,
        iconURL: message.embeds[0].footer.iconURL,
      })
      .setThumbnail(message.embeds[0].thumbnail.url);

    const fields = [];
    const numberTotalVote = Object.values(data).reduce(function (acc, obj) {
      return acc + obj.vote;
    }, 0);
    for (let i = 1; i <= Object.values(data).length; i++) {
      const numberVote = Object.values(data[i])[0];
      fields.push({
        name: oldEmbed.data.fields[i - 1].name,
        value: `${this.utils.progressBarPoll(
          numberVote,
          numberTotalVote !== 0 ? numberTotalVote : 10,
          10
        )} (${numberVote})`,
      });
    }

    embed.addFields(fields);

    return message.edit({ embeds: [embed] }).catch(() => null);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    // Check if poll exists
    const poll = await this.database
      .table("poll_number")
      .select()
      .where({ message_id: inter.message.id });
    if (!poll[0]) return;

    await inter.deferUpdate();

    // get poll data
    let customIdNumber = inter.customId.split("_")[1];
    const json = JSON.parse(poll[0].vote);

    // Check if user has already voted
    let pollUser = false;
    for (let i = 1; i <= Object.values(json).length; i++) {
      if (json[i].users.includes(inter.user.id)) {
        pollUser = true;
        break;
      }
    }

    if (pollUser) {
      if (json[customIdNumber].users.includes(inter.user.id)) {
        json[customIdNumber].vote -= 1;
        json[customIdNumber].users.splice(
          json[customIdNumber].users.indexOf(inter.user.id),
          1
        );

        await this.database
          .table("poll_number")
          .update({ vote: JSON.stringify(json) })
          .where({ message_id: inter.message.id });

        await this.displayEmbed(inter, json);

        await inter.followUp({
          content: this
            .translate`${this.client.emojiSuccess} Votre choix a bien été annulé !`,
          flags: 64,
        });
      } else {
        if (Boolean(poll[0].isMultiple)) {
          json[customIdNumber].vote += 1;
          json[customIdNumber].users.push(inter.user.id);

          await this.database
            .table("poll_number")
            .update({ vote: JSON.stringify(json) })
            .where({ message_id: inter.message.id });

          await this.displayEmbed(inter, json);

          await inter.followUp({
            content: this
              .translate`${this.client.emojiSuccess} Votre choix a bien été ajouté !`,
            flags: 64,
          });
        } else {
          for (let i = 1; i <= Object.values(json).length; i++) {
            if (Object.values(json[i])[1].includes(inter.user.id)) {
              return inter.followUp({
                content: this
                  .translate`${this.client.emojiError} Vous avez déjà voté pour ce sondage l'option **${i}** !\nVeuillez cliquer sur le bouton de votre vote pour l'annuler.`,
                flags: 64,
              });
            }
          }
        }
      }
    } else {
      json[customIdNumber].vote += 1;
      json[customIdNumber].users.push(inter.user.id);

      await this.database
        .table("poll_number")
        .update({ vote: JSON.stringify(json) })
        .where({ message_id: inter.message.id });

      await this.displayEmbed(inter, json);

      await inter.followUp({
        content: this
          .translate`${this.client.emojiSuccess} Votre choix a bien été ajouté !`,
        flags: 64,
      });
    }
  }
};
