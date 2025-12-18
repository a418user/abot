const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class MoneyUser extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "money",
      description: "Gérer l'argent des membres",
      options: [
        {
          name: "ajouter",
          description: "Ajouter de l'argent à un membre",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à qui ajouter de l'argent",
              type: 6,
              required: true,
            },
            {
              name: "montant",
              description: "Montant à ajouter",
              type: 4,
              required: true,
              min_value: 1,
            },
          ],
        },
        {
          name: "retirer",
          description: "Retirer de l'argent à un membre",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à qui retirer de l'argent",
              type: 6,
              required: true,
            },
            {
              name: "montant",
              description: "Montant à retirer",
              type: 4,
              required: true,
              min_value: 1,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Economy,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const member = ctx.options.getMember("membre");
    const amount = ctx.options.getInteger("montant");

    const subCommand = ctx.options.getSubcommand();
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

    if (subCommand === "ajouter") {
      if (!baseUserMoney[0]) {
        await ctx.database.table("user_money").insert({
          guild_id: ctx.guild.id,
          user_id: member.id,
          money: amount,
        });

        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} \`${amount}\` ${name} ont bien été ajoutés à **${member.user.displayName}** ! Il possède maintenant \`${amount}\` ${name} !`,
        });
      } else {
        await ctx.database
          .table("user_money")
          .update({
            money: baseUserMoney[0].money + amount,
          })
          .where({ guild_id: ctx.guild.id, user_id: member.id });

        ctx.send({
          content: ctx.translate`${
            ctx.emojiSuccess
          } \`${amount}\` ${name} ont bien été ajoutés à **${
            member.user.displayName
          }** ! Il possède maintenant \`${
            baseUserMoney[0].money + amount
          }\` ${name} !`,
        });
      }
    } else if (subCommand === "retirer") {
      if (!baseUserMoney[0])
        return ctx.error(
          ctx.translate`**${member.user.displayName}** ne possède pas de ${name} !`
        );

      await ctx.database
        .table("user_money")
        .update({
          money:
            baseUserMoney[0].money - amount < 0
              ? 0
              : baseUserMoney[0].money - amount,
        })
        .where({ guild_id: ctx.guild.id, user_id: member.id });

      ctx.send({
        content: ctx.translate`${
          ctx.emojiSuccess
        } \`${amount}\` ${name} ont bien été retirés à **${
          member.user.displayName
        }** ! Il possède maintenant \`${
          baseUserMoney[0].money - amount < 0
            ? 0
            : baseUserMoney[0].money - amount
        }\` ${name} !`,
      });
    }
  }
};
