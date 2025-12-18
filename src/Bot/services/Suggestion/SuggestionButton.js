const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = class SuggestionButton {
  constructor(event) {
    this.client = event.client;
    this.config = event.config;
    this.database = event.database;
    this.event = event;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    if (
      inter.customId !== "suggest_accepted" &&
      inter.customId !== "suggest_neutral" &&
      inter.customId !== "suggest_refused"
    )
      return;

    await inter.deferUpdate();

    const suggestion = await this.database
      .table("user_suggest")
      .where({ messageId: inter.message.id });

    const msg = await inter.guild.channels.cache
      .get(inter.channel.id)
      .messages.fetch(inter.message.id);

    let actionRow = new ActionRowBuilder()
      .addComponents(ButtonBuilder.from(msg.components[0].components[0]))
      .addComponents(ButtonBuilder.from(msg.components[0].components[1]))
      .addComponents(ButtonBuilder.from(msg.components[0].components[2]));

    const allVotes = JSON.parse(suggestion[0].votes);
    let userChoice = null;

    if (allVotes.accepted.includes(inter.user.id)) {
      userChoice = "accepted";
    } else if (allVotes.neutral.includes(inter.user.id)) {
      userChoice = "neutral";
    } else if (allVotes.refused.includes(inter.user.id)) {
      userChoice = "refused";
    }

    if (userChoice && inter.customId !== `suggest_${userChoice}`) {
      let choice;
      if (userChoice === "accepted") {
        choice = this.translate`Pour`;
      } else if (userChoice === "refused") {
        choice = this.translate`Contre`;
      } else if (userChoice === "neutral") {
        choice = this.translate`Neutre`;
      }
      return inter.followUp({
        content: this
          .translate`${this.client.emojiError} Vous avez déjà voté **${choice}** concernant cette suggestion. Veuillez retirer votre votre si vous souhaitez changer d'avis !`,
        ephemeral: true,
      });
    }

    if (inter.customId === "suggest_accepted") {
      if (!allVotes.accepted.includes(inter.user.id)) {
        allVotes.accepted.push(inter.user.id);
      } else {
        allVotes.accepted = allVotes.accepted.filter(
          (id) => id !== inter.user.id
        );
      }

      await this.database
        .table("user_suggest")
        .update({ votes: JSON.stringify(allVotes) })
        .where({ messageId: inter.message.id });

      /* Update the button */
      actionRow.components[0] = ButtonBuilder.from(
        msg.components[0].components[0]
      ).setLabel(`${allVotes.accepted.length}`);
    } else if (inter.customId === "suggest_neutral") {
      if (!allVotes.neutral.includes(inter.user.id)) {
        allVotes.neutral.push(inter.user.id);
      } else {
        allVotes.neutral = allVotes.neutral.filter(
          (id) => id !== inter.user.id
        );
      }

      await this.database
        .table("user_suggest")
        .update({ votes: JSON.stringify(allVotes) })
        .where({ messageId: inter.message.id });

      /* Update the button */
      actionRow.components[1] = ButtonBuilder.from(
        msg.components[0].components[1]
      ).setLabel(`${allVotes.neutral.length}`);
    } else if (inter.customId === "suggest_refused") {
      if (!allVotes.refused.includes(inter.user.id)) {
        allVotes.refused.push(inter.user.id);
      } else {
        allVotes.refused = allVotes.refused.filter(
          (id) => id !== inter.user.id
        );
      }

      await this.database
        .table("user_suggest")
        .update({ votes: JSON.stringify(allVotes) })
        .where({ messageId: inter.message.id });

      /* Update the button */
      actionRow.components[2] = ButtonBuilder.from(
        msg.components[0].components[2]
      ).setLabel(`${allVotes.refused.length}`);
    }

    /* Update the message */
    await msg.edit({ components: [actionRow] });
    await inter.followUp({
      content: this
        .translate`${this.client.emojiSuccess} Votre vote a bien été pris en compte !`,
      ephemeral: true,
    });
  }
};
