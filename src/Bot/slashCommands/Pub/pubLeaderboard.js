const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class PubLeaderboard extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "pub-leaderboard",
      description: "Afficher le classement des publicités",
      options: [
        {
          name: "membre",
          description: "Afficher le classement des vérificateurs de publicités",
          type: 1,
        },
        {
          name: "salon",
          description: "Afficher les statistiques des salons de publicités",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Pub,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["EmbedLinks"],
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

  async displayEmbed(ctx, users, page, pages, increment, subCommand, allUsers) {
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

    if (subCommand === "membre") {
      description.push(
        `${ctx.translate`**__Total__ :** **${allUsers}** pubs vérifiées`}\n`
      );

      for (const user of users) {
        let userFormatted = "";
        await ctx.client.users
          .fetch(user.user_id)
          .then((userFetch) => (userFormatted = `${userFetch.displayName}`))
          .catch(() => (userFormatted = `\`${user.user_id}\``));

        const prefix = count <= 10 ? numbers[count - 1] : `\`${count}.\``;
        description.push(
          ctx.translate`${prefix} ${userFormatted} : **${user.verified_pubs}** pubs`
        );
        count++;
      }

      return new EmbedBuilder()
        .setAuthor({
          name: ctx.translate`Classement des vérificateurs de publicités`,
          iconURL: `${
            ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
          }`,
        })
        .setColor(ctx.colors.blue)
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setFooter({ text: ctx.translate`Page ${page}/${pages}` })
        .setDescription(description.join("\n"));
    } else {
      description.push(
        `${ctx.translate`**__Total__ :** **${allUsers}** pubs vérifiées`}\n`
      );

      for (const channel of users) {
        const channelFetch = ctx.getChannel(channel.channel_id);
        const channelFormatted = channelFetch
          ? `${channelFetch} (\`${channelFetch.name}\`)`
          : `\`${channel.channel_id}\``;

        const prefix = count <= 10 ? numbers[count - 1] : `\`${count}.\``;
        description.push(
          ctx.translate`${prefix} ${channelFormatted} : **${channel.verified_pubs}** pubs`
        );
        count++;
      }

      return new EmbedBuilder()
        .setAuthor({
          name: ctx.translate`Statistiques des salons de publicités`,
          iconURL: `${
            ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
          }`,
        })
        .setColor(ctx.colors.blue)
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setFooter({ text: ctx.translate`Page ${page}/${pages}` })
        .setDescription(description.join("\n"));
    }
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const baseLeaderBoard =
      subCommand === "membre"
        ? await ctx.database
            .table("user_pub_statistics")
            .select()
            .where({ guild_id: ctx.guild.id })
        : await ctx.database
            .table("guild_pub_statistics")
            .select()
            .where({ guild_id: ctx.guild.id });

    if (!baseLeaderBoard[0])
      return ctx.error(ctx.translate`Ce serveur n'a pas de classement !`);

    const allUsers = baseLeaderBoard.sort((a, b) =>
      a.verified_pubs < b.verified_pubs ? 1 : -1
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
          subCommand,
          allUsers.length
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
              subCommand,
              allUsers.length
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
              subCommand,
              allUsers.length
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
              subCommand,
              allUsers.length
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
              subCommand,
              allUsers.length
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
