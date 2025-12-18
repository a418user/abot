const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { resolve, join } = require("path");
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

module.exports = class Card extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "profil",
      description: "Afficher le profil d'un membre",
      options: [
        {
          type: 6,
          name: "membre",
          description: "Le membre auquel vous souhaitez voir le profil",
          required: false,
        },
      ],
      category: SlashCommand.Categories.Levels,
      bot_permissions: ["EmbedLinks", "AttachFiles"],
    });
  }

  /**
   * Calculates progress
   * @param {number} currentXp The current xp of the user
   * @param {number} xpReq The xp needed to level up
   * @param {number} rectangleWidth The width of the progress bar
   * @return {number}
   */
  _calculateProgress(currentXp, xpReq, rectangleWidth) {
    const cx = currentXp;
    const rx = xpReq;

    if (rx <= 0) return 1;
    if (cx > rx) return parseInt(rectangleWidth) || 0;

    let width = (cx * rectangleWidth) / rx;
    if (width > rectangleWidth) width = rectangleWidth;
    return parseInt(width) || 0;
  }

  async run(ctx) {
    /* Defer the reply */
    await ctx.inter.deferReply();

    /* Get the member */
    const member = ctx.options.getMember("membre") || ctx.member;

    /* Find data of the user */
    const memberLevel = await ctx.database
      .table("user_levels")
      .select()
      .where({ guildId: ctx.guild.id, userId: member.id });
    if (!memberLevel[0])
      return ctx.inter.editReply(
        ctx.translate`${ctx.emojiError} Ce membre n'a pas encore d'xp !`
      );

    /* Get backgrounds path */
    const overlayPath = resolve(
      join(__dirname, "../../assets/leveling/card.png")
    );

    /* Canvas */
    const canvas = Canvas.createCanvas(510, 350);
    const ctX = canvas.getContext("2d");

    /* Overlay */
    const overlay = await Canvas.loadImage(overlayPath);
    ctX.drawImage(overlay, 0, 0, canvas.width, canvas.height);

    /* Username */
    ctX.font = "bold 18px Montserrat";
    ctX.textBaseline = "middle";

    ctX.font = "bold 20px Montserrat";
    ctX.fillStyle = "#ffffff";
    ctX.fillText(member.user.username, 167, 214);

    /* DisplayName */
    ctX.font = "bold 14px Montserrat";
    ctX.fillStyle = "#7F8699";
    ctX.fillText(member.displayName, 167, 236);

    /* Level */
    ctX.font = "bold 16px Montserrat";
    ctX.fillStyle = "#ffffff";

    const levelText = memberLevel[0].level;
    const levelSize = ctX.measureText(levelText).width;

    ctX.fillText(levelText, 454 - levelSize, 185 + 81);

    /* Xp */
    const xpText = shortNumber(memberLevel[0].xp);
    const xpSize = ctX.measureText(xpText).width;

    ctX.fillText(xpText, 454 - xpSize, 185 + 55);

    /* Progressbar */
    ctX.beginPath();

    /* Background progressbar */
    const rectangleX = 20;
    const rectangleY = 301;
    const rectangleWidth = 468;
    const rectangleHeight = 28;
    const cornerRadius = 5;

    ctX.fillStyle = "#7C778B";

    ctX.beginPath();
    ctX.moveTo(rectangleX + cornerRadius, rectangleY);
    ctX.lineTo(rectangleX + rectangleWidth - cornerRadius, rectangleY);
    ctX.arcTo(
      rectangleX + rectangleWidth,
      rectangleY,
      rectangleX + rectangleWidth,
      rectangleY + cornerRadius,
      cornerRadius
    );
    ctX.lineTo(
      rectangleX + rectangleWidth,
      rectangleY + rectangleHeight - cornerRadius
    );
    ctX.arcTo(
      rectangleX + rectangleWidth,
      rectangleY + rectangleHeight,
      rectangleX + rectangleWidth - cornerRadius,
      rectangleY + rectangleHeight,
      cornerRadius
    );
    ctX.lineTo(rectangleX + cornerRadius, rectangleY + rectangleHeight);
    ctX.arcTo(
      rectangleX,
      rectangleY + rectangleHeight,
      rectangleX,
      rectangleY + rectangleHeight - cornerRadius,
      cornerRadius
    );
    ctX.lineTo(rectangleX, rectangleY + cornerRadius);
    ctX.arcTo(
      rectangleX,
      rectangleY,
      rectangleX + cornerRadius,
      rectangleY,
      cornerRadius
    );
    ctX.closePath();
    ctX.fill();

    /* Calcul progress */
    const xpReq = ctx.utils.getXpWithLevel(memberLevel[0].level + 1);
    const xpReqPrevious = ctx.utils.getXpWithLevel(memberLevel[0].level);
    const progressWidth = this._calculateProgress(
      memberLevel[0].xp - xpReqPrevious,
      xpReq - xpReqPrevious,
      rectangleWidth
    );

    ctX.fillStyle = "#FFFFFF";

    ctX.beginPath();
    ctX.moveTo(rectangleX + cornerRadius, rectangleY);
    ctX.lineTo(rectangleX + progressWidth, rectangleY);
    ctX.lineTo(rectangleX + progressWidth, rectangleY + rectangleHeight);
    ctX.lineTo(rectangleX + cornerRadius, rectangleY + rectangleHeight);
    ctX.arcTo(
      rectangleX,
      rectangleY + rectangleHeight,
      rectangleX,
      rectangleY + rectangleHeight - cornerRadius,
      cornerRadius
    );
    ctX.lineTo(rectangleX, rectangleY + cornerRadius);
    ctX.arcTo(
      rectangleX,
      rectangleY,
      rectangleX + cornerRadius,
      rectangleY,
      cornerRadius
    );
    ctX.closePath();
    ctX.fill();

    /* Text progressbar */
    ctX.font = "bold 16px Montserrat";
    ctX.fillStyle = "#737373";
    ctX.globalCompositeOperation = "difference";

    const progressbarText = `${shortNumber(memberLevel[0].xp)} / ${shortNumber(
      xpReq
    )}`;
    const progressbarSize = ctX.measureText(progressbarText).width;

    ctX.fillText(progressbarText, 410 - progressbarSize / 2, 315);

    /* Avatar */
    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 512 })
    );
    const borderRadius = 10;
    const x = 20;
    const y = 152;
    const w = 129;
    const h = 129;

    ctX.save();
    ctX.beginPath();
    ctX.moveTo(x + borderRadius, y);
    ctX.lineTo(x + w - borderRadius, y);
    ctX.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
    ctX.lineTo(x + w, y + h - borderRadius);
    ctX.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
    ctX.lineTo(x + borderRadius, y + h);
    ctX.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
    ctX.lineTo(x, y + borderRadius);
    ctX.quadraticCurveTo(x, y, x + borderRadius, y);
    ctX.closePath();
    ctX.clip();

    ctX.drawImage(avatar, x, y, w, h);
    ctX.restore();

    /* Get a buffer */
    const card = canvas.toBuffer();

    /* Card's identifier */
    const cardId = `${ctx.guild.id}-${member.user.id}-${Date.now()}`;

    /* Send the message */
    return ctx.inter.editReply({
      files: [
        {
          attachment: card,
          name: `${cardId}.png`,
        },
      ],
    });
  }
};
