const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class Say extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "say",
      description: "Faire parler le bot à votre place",
      options: [
        {
          name: "texte",
          type: 3,
          description: "Message à dire",
          required: true,
        },
      ],
      category: SlashCommand.Categories.General,
      user_permissions: ["ManageMessages"],
    });
  }

  async run(ctx) {
    let msg;
    const content = ctx.options
      .getString("texte")
      .replaceAll("@everyone", "`Everyone`")
      .replaceAll("@here", "`Here`")
      .replace(/<@&(\d+)>/g, "`mentionRôle`");

    if (content.length > 2000) {
      msg = content.substr(0, 1996) + " ...";
    } else {
      msg = content;
    }

    await ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} Votre message a bien été envoyé !`,
      flags: 64,
    });
    await ctx.channel.send({ content: msg });
  }
};
