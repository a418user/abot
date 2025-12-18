const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { resolve, join } = require("path");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const shortNumber = require("short-number");
const Canvas = require("canvas");

Canvas.registerFont(
  resolve(join(__dirname, "../../assets/fonts/Montserrat-Regular.ttf")),
  { family: "Montserrat" }
);
Canvas.registerFont(
  resolve(join(__dirname, "../../assets/fonts/Montserrat-Bold.ttf")),
  { family: "Montserrat", weight: "bold" }
);

module.exports = class XpLeaderboard extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-leaderboard",
      description: "Afficher le classement des niveaux du serveur",
      options: [
        {
          type: 4,
          name: "page",
          description: "La page du classement",
          min_value: 1,
        },
      ],
      category: SlashCommand.Categories.Levels,
      bot_permissions: ["EmbedLinks", "AttachFiles"],
    });
  }

  /**
   * Generate the leaderboard image
   * @param {CommandContext} [context] The command context
   * @param {Levels[]} [users] All data to display
   * @param {number} [page] The current page of the leaderboard
   * @param {number} pages The maximum page of the leaderboard
   * @param {number} [increment] The current rank
   * @param {Object} [me] The author's data
   * @returns {Promise<Buffer>}
   */
  async generateCardLevel(context, users, page, pages, increment, me) {
    /* Position */
    let position = increment;
    let cardPosition = 0;

    /* Get background path */
    const backgroundPath = resolve(
      join(__dirname, "../../assets/leveling/leaderboardLevels.png")
    );

    /* Canvas */
    const canvas = Canvas.createCanvas(550, 595);
    const ctx = canvas.getContext("2d");
    const pageLabel = context?.translate
      ? context.translate`Page ${page}/${pages}`
      : `Page ${page}/${pages}`;

    /* Background */
    const background = await Canvas.loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    /* Page */
    ctx.font = "bold 16px Montserrat";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(pageLabel, 15, 29.5);

    for (const user of users) {
      /* Get the member */
      const member = await this.client.users
        .fetch(user.userId)
        .catch(() => null);
      if (!member) continue;

      /* Location */
      const location = cardPosition * 55;

      /* Is me */
      if (me.position === position) {
        ctx.fillStyle = "#484B51";
        ctx.fillRect(0, 55 + location, canvas.width, 45);
      }

      /* Rank */
      ctx.font = "bold 18px Montserrat";
      ctx.textBaseline = "middle";
      ctx.fillStyle =
        position === 1
          ? "#FFC327"
          : position === 2
          ? "#CCCCCC"
          : position === 3
          ? "#F4AE43"
          : "#ffffff";

      const positionText = `#${position}`;
      const positionSize = ctx.measureText(positionText).width;

      ctx.fillText(positionText, 59, 77.5 + location);

      /* First point */
      ctx.font = "bold 33px Montserrat";
      ctx.fillStyle = "#7F8699";

      const pointText = "•";
      const pointSize = ctx.measureText(pointText).width;

      ctx.fillText(pointText, 64 + positionSize, 77.5 + location);

      /* Username */
      ctx.font = "bold 18px Montserrat";
      ctx.fillStyle =
        position === 1
          ? "#FFC327"
          : position === 2
          ? "#CCCCCC"
          : position === 3
          ? "#F4AE43"
          : "#ffffff";

      ctx.fillText(
        member.displayName,
        69 + positionSize + pointSize,
        77.5 + location
      );

      /* Level */
      ctx.font = "bold 16px Montserrat";
      ctx.fillStyle = "#ffffff";

      const levelText = user.level;
      const levelSize = ctx.measureText(levelText).width;

      ctx.fillText(levelText, 382 - levelSize / 2, 77.5 + location);

      /* Second point */
      ctx.font = "bold 33px Montserrat";
      ctx.fillStyle = "#7F8699";
      ctx.fillText("•", 443, 77.5 + location);

      /* Xp */
      ctx.font = "bold 16px Montserrat";
      ctx.fillStyle = "#ffffff";

      const xpText = shortNumber(user.xp);
      const xpSize = ctx.measureText(xpText).width;

      ctx.fillText(xpText, 490 - xpSize / 2, 77.5 + location);

      /* Avatar */
      const avatar = await Canvas.loadImage(
        member.displayAvatarURL({ extension: "png", size: 512 })
      );
      const borderRadius = 5;
      const x = 0;
      const y = 55 + location;
      const w = 45;
      const h = 45;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + w - borderRadius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
      ctx.lineTo(x + w, y + h - borderRadius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
      ctx.lineTo(x + borderRadius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, x, y, w, h);
      ctx.restore();

      position++;
      cardPosition++;
    }

    /* Return a buffer */
    return canvas.toBuffer();
  }

  /**
   * Get the buttons for the level leaderboard.
   * @param page
   * @param pages
   * @param off
   * @returns {ActionRowBuilder}
   */
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

  /**
   * Get the embed for the level leaderboard.
   * @param {CommandContext} ctx The command context
   * @param {Array} users The users
   * @param {number} page The current page of the leaderboard
   * @param {number} pages The maximum page of the leaderboard
   * @param {number} increment The increment of all the members
   * @param {Object} [me] The author's data
   * */
  async _getLevelEmbed(ctx, users, page, pages, increment, me) {
    /* Generate the card */
    const card = await this.generateCardLevel(
      ctx,
      users,
      page,
      pages,
      increment,
      me
    );

    /* Card's identifier */
    const cardId = `${ctx.guild.id}-${ctx.user.id}-${Date.now()}-${page}`;

    const leaderboardDescription = ctx.translate`\`Classement des niveaux\`\n\nVous êtes **#${
      me.position
    }** au classement\navec **${me.data.level}** niveaux et **${shortNumber(
      me.data.xp
    )}** xp.`;

    const embed = new EmbedBuilder()
      .setTitle(ctx.guild.name)
      .setDescription(leaderboardDescription)
      .setColor(ctx.colors.blue)
      .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
      .setImage(`attachment://${cardId}.png`)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    /* Return the message content */
    return {
      embeds: [embed],
      files: [
        {
          attachment: card,
          name: `${cardId}.png`,
        },
      ],
      components: [this.buttons(page, pages)],
    };
  }

  async run(ctx) {
    /* Defer the reply */
    await ctx.inter.deferReply();

    /** Define variables */
    let page = ctx.options.getInteger("page") || 1;
    const numberPerPage = 10;

    /* Get the database */
    const data = await ctx.database
      .table("user_levels")
      .select()
      .where("guildId", ctx.guild.id);
    if (!data[0])
      return ctx.inter.followUp({
        content: ctx.translate`${ctx.emojiError} Aucun membre n'a encore gagné d'xp sur le serveur !`,
        flags: 64,
      });

    /* It's getting the members from the database. */
    const members = data.sort((a, b) => (a.xp < b.xp ? 1 : -1));

    /* Get data & position of the user who executed the command */
    const meData = {
      data: members.find(
        (e) => e.guildId === ctx.guild.id && e.userId === ctx.user.id
      ) || { level: 0, xp: 0 },
      position:
        members.findIndex(
          (e) => e.guildId === ctx.guild.id && e.userId === ctx.user.id
        ) + 1 || ctx.guild.memberCount,
    };

    /* Get packets for embed pages */
    const membersList = ctx.utils.getNumberPacket(members, numberPerPage);

    /* Check if the page is valid */
    if (page >= membersList.length) page = membersList.length;

    /* Define increment */
    let increment = (page - 1) * numberPerPage + 1;

    /* Send the message */
    const msg = await ctx.inter.followUp(
      await this._getLevelEmbed(
        ctx,
        membersList[page - 1],
        page,
        membersList.length,
        increment,
        meData
      )
    );

    /* Define the filter and the collector */
    const filter = ({ user }) => user.id === ctx.user.id;
    const collector = await msg.createMessageComponentCollector({
      filter,
      idle: 5 * 60 * 1000,
    });

    collector.on("collect", async (button) => {
      await button.deferUpdate();

      if (button.customId === "DStop") {
        collector.stop();
        return msg.edit({ components: [] }).catch(() => null);
      } else if (button.customId === "DFullBackButton") {
        page = 1;
      } else if (button.customId === "DFullSkipButton") {
        page = membersList.length;
      } else if (button.customId === "DBeforeButton") {
        page--;
      } else if (button.customId === "DAfterButton") {
        page++;
      }

      /* Update the increment */
      increment = (page - 1) * numberPerPage + 1;

      return msg
        .edit(
          await this._getLevelEmbed(
            ctx,
            membersList[page - 1],
            page,
            membersList.length,
            increment,
            meData
          )
        )
        .catch(() => null);
    });

    collector.on("end", () => {
      return msg.edit({ components: [] }).catch(() => null);
    });
  }
};
