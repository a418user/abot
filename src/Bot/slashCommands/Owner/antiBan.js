const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class AntiBan extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "anti-ban",
      description: "Gérer les membres qui ne peuvent pas être bannis",
      options: [
        {
          name: "ajouter",
          description:
            "Ajouter un membre à la liste des membres qui ne peuvent pas être bannis",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Le membre à ajouter",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description:
            "Supprimer un membre de la liste des membres qui ne peuvent pas être bannis",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Le membre à supprimer",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "liste",
          description: "Liste des membres qui ne peuvent pas être bannis",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Owner,
      ownerOnly: true,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    // Only for dev
    if (!ctx.config["devId"].includes(ctx.user.id))
      return ctx.error(
        ctx.translate`Vous n'avez pas la permission d'utiliser cette commande !`
      );

    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "ajouter") {
      const user = ctx.options.getUser("membre");

      const base = await ctx.database
        .table("admin_anti_ban")
        .select()
        .where("user_id", user.id);
      if (base[0])
        return ctx.error(
          ctx.translate`Le membre **${user.displayName}** est déjà dans la liste des membres qui ne peuvent pas être bannis !`
        );

      await ctx.database.table("admin_anti_ban").insert({ user_id: user.id });

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le membre **${user.displayName}** a été ajouté à la liste des membres qui ne peuvent pas être bannis !`,
      });
    } else if (subCommand === "supprimer") {
      const user = ctx.options.getUser("membre");

      const base = await ctx.database
        .table("admin_anti_ban")
        .select()
        .where("user_id", user.id);
      if (!base[0])
        return ctx.error(
          ctx.translate`Le membre **${user.displayName}** ne fait pas partie de la liste des membres qui ne peuvent pas être bannis !`
        );

      await ctx.database
        .table("admin_anti_ban")
        .delete()
        .where({ user_id: user.id });

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le membre **${user.displayName}** a été supprimé de la liste des membres qui ne peuvent pas être bannis !`,
      });
    } else if (subCommand === "liste") {
      const base = await ctx.database.table("admin_anti_ban").select();
      if (!base[0])
        return ctx.error(
          ctx.translate`Il n'y a aucun membre dans la liste des membres qui ne peuvent pas être bannis !`
        );

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des membres anti-ban`)
        .setColor(ctx.colors.blue)
        .setDescription(
          ctx.translate`__Voici la liste des membres__ :\n${base
            .map((u) => {
              return ctx.client.users.cache.get(u.user_id)
                ? `${ctx.client.users.cache.get(u.user_id).displayName} (\`${
                    u.user_id
                  }\`)`
                : `\`${u.user_id}\``;
            })
            .join("\n")}`
        )
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setFooter({
          text: `${ctx.client.user.displayName}`,
          iconURL: ctx.client.user.displayAvatarURL(),
        });

      ctx.send({ embeds: [embed] });
    }
  }
};
