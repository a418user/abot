const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class PubBlacklist extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "pub-blacklist",
      description: "Gérer les blacklist du système de publicités",
      options: [
        {
          name: "ajouter",
          description: "Ajouter un membre à la blacklist",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à ajouter",
              type: 6,
              required: true,
            },
            {
              name: "raison",
              description: "Raison du blacklist",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "retirer",
          description: "Retirer un membre de la blacklist",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à retirer",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "liste",
          description: "Afficher la liste des membres blacklist",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Pub,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "ajouter") {
      const member = ctx.options.getMember("membre");
      if (!member)
        return ctx.error(ctx.translate`Ce membre n'est pas sur le serveur !`);

      const reason =
        ctx.options.getString("raison") ||
        ctx.translate`Aucune raison spécifiée`;

      const base = await ctx.database
        .table("pub_blacklist")
        .where({ user_id: member.id })
        .first();

      if (!base) {
        await ctx.database
          .table("pub_blacklist")
          .insert({ user_id: member.id, reason });
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le membre **${member.displayName}** a bien été ajouté à la blacklist des publicités !`,
        });
      } else {
        ctx.error(ctx.translate`Ce membre est déjà blacklist des publicités !`);
      }
    } else if (subCommand === "retirer") {
      const member = ctx.options.getMember("membre");

      const base = await ctx.database
        .table("pub_blacklist")
        .where({ user_id: member.id })
        .first();

      if (base) {
        await ctx.database
          .table("pub_blacklist")
          .delete()
          .where({ user_id: member.id });
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Le membre **${member.displayName}** a bien été retiré de la blacklist des publicités !`,
        });
      } else
        ctx.error(
          ctx.translate`Ce membre n'est pas blacklist des publicités !`
        );
    } else if (subCommand === "liste") {
      const base = await ctx.database.table("pub_blacklist").select();

      let field = ``;
      for (let i = 0; i < base.length; i++) {
        let userFormatted = "";
        await ctx.client.users
          .fetch(base[i].user_id)
          .then(
            (userFetch) =>
              (userFormatted = `${userFetch} **${userFetch.displayName}** (\`${userFetch.id}\`)`)
          )
          .catch(() => (userFormatted = `\`${base[i].user_id}\``));

        field += `\`${i + 1}\`. ${userFormatted} : ${base[i].reason}\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Blacklist du système de publicités`)
        .setDescription(field || ctx.translate`Aucun membre blacklist`)
        .setColor(ctx.colors.blue);

      ctx.send({ embeds: [embed] });
    }
  }
};
