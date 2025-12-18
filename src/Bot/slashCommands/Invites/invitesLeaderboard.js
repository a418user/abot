const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class InvitesLeaderboard extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "invite-classement",
      description: "Afficher le classement des invitations",
      category: SlashCommand.Categories.Invites,
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

  async displayEmbed(ctx, users, page, pages, increment) {
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
    const fields = [];

    for (const user of users) {
      let userFormatted = "";
      await ctx.client.users
        .fetch(user.member_id)
        .then((userFetch) => (userFormatted = `${userFetch.displayName}`))
        .catch(() => (userFormatted = `\`${user.member_id}\``));

      const inviteLabel =
        user.number > 1
          ? ctx.translate`invitations`
          : ctx.translate`invitation`;
      if (count <= 10) {
        fields.push({
          name: `${numbers[count - 1]} ${userFormatted}`,
          value: ctx.translate`**${user.number}** ${inviteLabel}`,
        });
      } else {
        fields.push({
          name: `#${count}. ${userFormatted}`,
          value: ctx.translate`**${user.number}** ${inviteLabel}`,
        });
      }
      count++;
    }

    return new EmbedBuilder()
      .setAuthor({
        name: ctx.translate`Classement du serveur ${ctx.guild.name}`,
        iconURL: `${ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()}`,
      })
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setFooter({
        text: ctx.translate`Page ${page}/${pages}`,
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .addFields(fields);
  }

  async run(ctx) {
    const baseLeaderBoard = await ctx.database
      .table("user_invite")
      .select()
      .where({ guild_id: ctx.guild.id });
    if (!baseLeaderBoard[0])
      return ctx.error(
        ctx.translate`Ce serveur ne possède aucun membre classé !`
      );

    // Sort the leaderboard with the getEffectiveInvites function
    const allUsers = baseLeaderBoard
      .map((user) => {
        return {
          member_id: user.member_id,
          number: ctx.invitesManager.getEffectiveInvites(user),
        };
      })
      .sort((a, b) => b.number - a.number);

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
          1
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
              increment
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
              increment
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
              increment
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
              increment
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
