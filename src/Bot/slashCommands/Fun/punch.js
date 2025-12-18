const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class Punch extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "punch",
      description: "Frapper quelqu'un",
      options: [
        {
          name: "utilisateur",
          description: "L'utilisateur que vous souhaitez frapper",
          type: 6,
          required: true,
        },
      ],
      category: SlashCommand.Categories.Fun,
      disableSlash: true,
      bot_permissions: ["EmbedLinks"],
    });

    this.punch = [
      `https://pa1.narvii.com/6272/cf24160e6b4e98e2e40a3b2633a3cce7c31ed4f7_hq.gif`,
      `https://pa1.narvii.com/6724/4daa91b820e74e1ce10574cbac4772d5169f84fa_hq.gif`,
      `https://media1.tenor.com/images/34356db15b5e28ca27307ba87325e67d/tenor.gif`,
      `https://i.pinimg.com/originals/76/0b/3f/760b3fc3deac11d2163ea305987bd9bd.gif`,
    ];
  }

  async run(ctx) {
    const user = ctx.options.getUser("utilisateur");

    const embed = new EmbedBuilder()
      .setDescription(
        ctx.translate`**${ctx.user}** viens de punch **${user}** :punch:`
      )
      .setImage(this.punch[Math.floor(Math.random() * this.punch.length)])
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .setColor(ctx.colors.blue);

    ctx.send({ embeds: [embed] });
  }
};
