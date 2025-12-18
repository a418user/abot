const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { parseEmoji } = require("discord.js");
const { parse } = require("twemoji-parser");
const axios = require("axios");

module.exports = class Emoji extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "emoji",
      description: "Télécharger un emoji",
      options: [
        {
          name: "emoji",
          description: "Emoji à télécharger",

          type: 3,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Fun,
    });
  }

  async run(ctx) {
    const emoji = ctx.options.getString("emoji");
    const emojiDiscord = parseEmoji(emoji);

    /* Is a custom emoji */
    if (emojiDiscord.id) {
      const guildEmoji = ctx.client.emojis.cache.get(emojiDiscord.id);
      if (!guildEmoji)
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
          flags: 64,
        });

      /* Get the url of the emoji */
      const extension = emojiDiscord.animated ? ".gif" : ".png";
      const url = `https://cdn.discordapp.com/emojis/${
        emojiDiscord.id + extension
      }`;

      /* Send the url emoji */
      return ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} [Cliquez ici pour télécharger l'emoji](<${url}>) ${emoji} !`,
      });
    } else {
      const parsedEmoji = parse(emoji);
      if (!parsedEmoji[0])
        return ctx.send({
          content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
          flags: 64,
        });

      // Get only the id of the emoji in the url : https://twemoji.maxcdn.com/v/latest/svg/id.svg
      const emojiIdUrl = parsedEmoji[0].url.split("/").pop().split(".")[0];

      /* Check if the url is valid with an axios request */
      await axios
        .get(
          `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emojiIdUrl}.svg`
        )
        .then(async (res) => {
          if (res.status !== 200) {
            return ctx.send({
              content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
              flags: 64,
            });
          }

          /* Send the url emoji */
          return ctx.send({
            content: ctx.translate`${ctx.emojiSuccess} [Cliquez ici pour télécharger l'emoji](${parsedEmoji[0].url}) ${emoji} !`,
          });
        })
        .catch(() => {
          return ctx.send({
            content: ctx.translate`${ctx.emojiError} Cet emoji est introuvable !`,
            flags: 64,
          });
        });
    }
  }
};
