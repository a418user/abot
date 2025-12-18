const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class MoneyLeaderboard extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "money-classement",
      description: "Afficher le classement des membres les plus riches",
      category: SlashCommand.Categories.Economy,
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

  async displayEmbed(ctx, users, page, pages, increment, name) {
    let count = increment;
    const numbers = [
      "🥇",
      "🥈",
      "🥉",
      "4️⃣",
      "5️⃣",
      "6️⃣",
      "7️⃣",
      "8️⃣",
      "9️⃣",
      "🔟",
    ];
    const description = [];

    for (const user of users) {
      let userFormatted = "";
      await ctx.client.users
        .fetch(user.user_id)
        .then((userFetch) => (userFormatted = `${userFetch.displayName}`))
        .catch(() => (userFormatted = `\`${user.user_id}\``));

      if (count <= 10) {
        description.push(
          ctx.translate`${numbers[count - 1]} ${userFormatted} : **${
            user.money
          }** ${name}`
        );
      } else {
        description.push(
          ctx.translate`${userFormatted} : **${user.money}** ${name}`
        );
      }
      count++;
    }

    return new EmbedBuilder()
      .setAuthor({
        name: ctx.translate`Classement des membres les plus riches`,
        iconURL: `${ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()}`,
      })
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({ text: ctx.translate`Page ${page}/${pages}` })
      .setDescription(description.join("\n"));
  }

  async run(ctx) {
    const baseLeaderBoard = await ctx.database
      .table("user_money")
      .select()
      .where({ guild_id: ctx.guild.id });
    if (!baseLeaderBoard[0])
      return ctx.error(ctx.translate`Ce serveur n'a pas de classement !`);

    const baseGuildMoney = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);
    const name =
      baseGuildMoney[0] && baseGuildMoney[0].name
        ? baseGuildMoney[0].name
        : "coins";

    const allUsers = baseLeaderBoard.sort((a, b) =>
      a.money < b.money ? 1 : -1
    );

    let page = 1;
    const numberPerPage = 10;
    const users_list = ctx.utils.getNumberPacket(allUsers, numberPerPage);

    const msg = await ctx.send({
      embeds: [
        await this.displayEmbed(
          ctx,
          users_list[page - 1],
          page,
          users_list.length,
          1,
          name
        ),
      ],
      components: [this.buttons(page, users_list.length)],
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
            await this.displayEmbed(
              ctx,
              users_list[page - 1],
              page,
              users_list.length,
              increment,
              name
            ),
          ],
          components: [this.buttons(page, users_list.length)],
        });
      } else if (interaction.customId === "DFullSkipButton") {
        page = users_list.length;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            await this.displayEmbed(
              ctx,
              users_list[page - 1],
              page,
              users_list.length,
              increment,
              name
            ),
          ],
          components: [this.buttons(page, users_list.length)],
        });
      } else if (interaction.customId === "DBeforeButton") {
        page--;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            await this.displayEmbed(
              ctx,
              users_list[page - 1],
              page,
              users_list.length,
              increment,
              name
            ),
          ],
          components: [this.buttons(page, users_list.length)],
        });
      } else if (interaction.customId === "DAfterButton") {
        page++;
        const increment = (page - 1) * numberPerPage + 1;
        return msg.edit({
          embeds: [
            await this.displayEmbed(
              ctx,
              users_list[page - 1],
              page,
              users_list.length,
              increment,
              name
            ),
          ],
          components: [this.buttons(page, users_list.length)],
        });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "idle")
        return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
