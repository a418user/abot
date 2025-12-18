const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class FormView extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid-afficher",
      description: "Afficher les formulaires de candidature",
      category: SlashCommand.Categories.Forms,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks", "ManageMessages"],
    });
  }

  buttons(page, pages, off = false) {
    const FullBack = new ButtonBuilder()
      .setCustomId("DFullBackButton")
      .setEmoji("⏮️")
      .setStyle(2)
      .setDisabled(page === 1 || off);
    const FullSkip = new ButtonBuilder()
      .setCustomId("DFullSkipButton")
      .setEmoji("⏭️")
      .setStyle(2)
      .setDisabled(page === pages || off);
    const Before = new ButtonBuilder()
      .setCustomId("DBeforeButton")
      .setEmoji("⬅️")
      .setStyle(2)
      .setDisabled(page === 1 || off);
    const After = new ButtonBuilder()
      .setCustomId("DAfterButton")
      .setEmoji("➡️")
      .setStyle(2)
      .setDisabled(page === pages || off);
    const stop = new ButtonBuilder()
      .setCustomId("DStop")
      .setStyle(2)
      .setEmoji("⏹️");
    return new ActionRowBuilder()
      .addComponents(FullBack)
      .addComponents(Before)
      .addComponents(stop)
      .addComponents(After)
      .addComponents(FullSkip);
  }
  displayEmbed(ctx, forms, page, pages, increment) {
    const description = [];
    let count = increment;

    for (const form of forms) {
      const questions = JSON.parse(form.questions);
      const channelDisplay = ctx.getChannel(form.channel_id)
        ? ctx.getChannel(form.channel_id)
        : `\`${form.channel_id}\``;
      const roleDisplay =
        form.role_access_id !== null
          ? ctx.getRole(form.role_access_id)
            ? ctx.getRole(form.role_access_id)
            : `\`${form.role_access_id}\``
          : `\`${ctx.translate`Aucun`}\``;
      const formDescription =
        form.form_description || ctx.translate`Aucune description`;

      const questionLines = questions
        .map(
          (question, index) => ctx.translate`**\`${index + 1}.\`** ${question}`
        )
        .join("\n");

      const block = [
        ctx.translate`**Formulaire n°${count}**`,
        ctx.translate`Titre : **${form.form_name}**`,
        ctx.translate`Id : **${form.id}**`,
        ctx.translate`Description : **${formDescription}**`,
        ctx.translate`Salon : ${channelDisplay}`,
        ctx.translate`Rôle : ${roleDisplay}`,
        ctx.translate`Nombre de questions : \`${questions.length}\``,
        "",
        ctx.translate`Questions :`,
        questionLines,
      ]
        .filter(Boolean)
        .join("\n");

      description.push(block.trim());
      count++;
    }

    return new EmbedBuilder()
      .setAuthor({
        name: ctx.translate`Formulaires`,
        iconURL: `${ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()}`,
      })
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({ text: ctx.translate`Page ${page}/${pages}` })
      .setDescription(description.join("\n"));
  }

  async run(ctx) {
    const baseGuildForm = await ctx.database
      .table("guild_form")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!baseGuildForm[0])
      return ctx.error(
        ctx.translate`Il n'y a aucun formulaire de candidature sur ce serveur !`
      );

    let page = 1;
    const numberPerPage = 1;
    const formList = ctx.utils.getNumberPacket(baseGuildForm, numberPerPage);

    const msg = await ctx.send({
      embeds: [
        this.displayEmbed(ctx, formList[page - 1], page, formList.length, 1),
      ],
      components: [this.buttons(page, formList.length)],
    });

    const filter = ({ customId, user }) =>
      (customId === "DStop" ||
        customId === "DFullBackButton" ||
        customId === "DFullSkipButton" ||
        customId === "DBeforeButton" ||
        customId === "DAfterButton" ||
        customId === "DInfosButton") &&
      user.id === ctx.inter.user.id;
    const collector = await msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === "DStop") {
        collector.stop();
        return msg.edit({ components: [] }).catch(() => null);
      } else if (interaction.customId === "DFullBackButton") {
        page = 1;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            this.displayEmbed(
              ctx,
              formList[page - 1],
              page,
              formList.length,
              increment
            ),
          ],
          components: [this.buttons(page, formList.length)],
        });
      } else if (interaction.customId === "DFullSkipButton") {
        page = formList.length;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            this.displayEmbed(
              ctx,
              formList[page - 1],
              page,
              formList.length,
              increment
            ),
          ],
          components: [this.buttons(page, formList.length)],
        });
      } else if (interaction.customId === "DBeforeButton") {
        page--;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            this.displayEmbed(
              ctx,
              formList[page - 1],
              page,
              formList.length,
              increment
            ),
          ],
          components: [this.buttons(page, formList.length)],
        });
      } else if (interaction.customId === "DAfterButton") {
        page++;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            this.displayEmbed(
              ctx,
              formList[page - 1],
              page,
              formList.length,
              increment
            ),
          ],
          components: [this.buttons(page, formList.length)],
        });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
