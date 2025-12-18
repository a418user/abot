const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class MoneyView extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "money-user",
      description: "Voir son argent ou celui d'un membre",
      options: [
        {
          name: "membre",
          description: "Membre dont vous voulez voir l'argent",
          type: 6,
          required: false,
        },
      ],
      category: SlashCommand.Categories.Economy,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre") || ctx.member;

    const baseUserMoney = await ctx.database
      .table("user_money")
      .select()
      .where({ guild_id: ctx.guild.id, user_id: member.id });
    const baseGuildMoney = await ctx.database
      .table("guild_money")
      .select()
      .where("guild_id", ctx.guild.id);

    const name =
      baseGuildMoney[0] && baseGuildMoney[0].name
        ? baseGuildMoney[0].name
        : "coins";

    if (!baseUserMoney[0])
      return ctx.error(
        ctx.translate`**${member.user.displayName}** ne possède pas de ${name} !`
      );

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setAuthor({
        name: ctx.translate`Trésorerie de ${member.user.displayName}`,
        iconURL:
          member.user.displayAvatarURL() || ctx.client.user.displayAvatarURL(),
      })
      .setDescription(ctx.translate`\`${baseUserMoney[0].money}\` ${name}`)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      });

    ctx.send({ embeds: [embed] });
  }
};
