const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class XpRewards extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "xp-rewards",
      description: "Gérer les récompenses en fonction des niveaux",
      options: [
        {
          type: 1,
          name: "list",
          description: "Voir toutes les récompenses en fonction des niveaux",
        },
        {
          type: 1,
          name: "add",
          description: "Ajouter une récompense de niveaux",
          options: [
            {
              type: 4,
              name: "niveau",
              description: "Le niveau auquel la récompense est obtenu",
              min_value: 1,
              required: true,
            },
            {
              type: 8,
              name: "rôle",
              description: "Le rôle à gagner avec le niveau",
              required: false,
            },
            {
              type: 4,
              name: "monnaie",
              description: "La monnaie à gagner avec le niveau",
              min_value: 1,
              required: false,
            },
          ],
        },
        {
          type: 1,
          name: "remove",
          description: "Retrait d'une récompense de niveau",
          options: [
            {
              type: 4,
              name: "niveau",
              description: "Le niveau du rôle récompense à supprimer",
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Levels,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const base = await ctx.database
      .table("guild_levels")
      .select()
      .where("guildId", ctx.guild.id);

    if (subCommand === "list") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Aucune récompense n'a été défini pour ce serveur !`
        );

      const rewards = JSON.parse(base[0].rewards);
      if (rewards.length === 0)
        return ctx.error(
          ctx.translate`Aucune récompense n'a été défini pour ce serveur !`
        );

      const baseGuildMoney = await ctx.database
        .table("guild_money")
        .select()
        .where("guild_id", ctx.guild.id);
      const name =
        baseGuildMoney[0] && baseGuildMoney[0].name
          ? baseGuildMoney[0].name
          : ctx.translate`coins`;

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des récompenses`)
        .setDescription(
          ctx.translate`Voici la liste des récompenses par niveau :`
        )
        .addFields(
          rewards
            .sort((a, b) => a.level - b.level)
            .map((rr) => {
              const role = ctx.getRole(rr.roleId);
              return {
                name: ctx.translate`Niveau : **${rr.level}**`,
                value: ctx.translate`Rôle : ${
                  role ? role.toString() : `${ctx.emojiError}`
                } | Monnaie : ${
                  rr.money > 0 ? `\`${rr.money}\` ${name}` : `${ctx.emojiError}`
                }`,
                inline: false,
              };
            })
        )
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        });

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "add") {
      const level = ctx.options.getInteger("niveau");
      const role = ctx.options.getRole("rôle");
      const money = ctx.options.getInteger("monnaie") || 0;

      if (!role && money === 0)
        return ctx.error(
          ctx.translate`Vous devez spécifier un rôle ou une monnaie à gagner avec le niveau !`
        );

      // Get the list of roles reward
      const rewards = base[0] ? JSON.parse(base[0].rewards) : [];

      // Check if the role is already in the list
      if (role && rewards.find((r) => r.roleId === role.id))
        return ctx.error(
          ctx.translate`Le rôle **${role.name}** est déjà ajouté aux rôles de récompenses pour un autre niveau !`
        );

      // Check if there is already a reward for this level
      if (rewards.find((rr) => rr.level === level))
        return ctx.error(
          ctx.translate`Une récompense est déjà défini pour le niveau **${level}** !`
        );

      // Add the role reward
      rewards.push({
        level: level,
        roleId: role ? role.id : null,
        money: money,
      });

      // Update the database
      if (!base[0]) {
        await ctx.database.table("guild_levels").insert({
          guildId: ctx.guild.id,
          rewards: JSON.stringify(rewards),
        });
      } else {
        await ctx.database
          .table("guild_levels")
          .update({
            rewards: JSON.stringify(rewards),
          })
          .where("guildId", ctx.guild.id);
      }

      // Send success message
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Les récompenses pour le niveau **${level}** ont été ajoutées avec succès !`,
      });
    } else if (subCommand === "remove") {
      if (!base[0])
        return ctx.error(
          ctx.translate`Aucune récompense n'a été défini pour ce serveur !`
        );

      // Get the id of the role reward
      const level = ctx.options.getInteger("niveau");

      // Find the role reward
      let rewards = JSON.parse(base[0].rewards) || [];
      const reward = rewards.find((rr) => rr.level === level);
      if (!reward)
        return ctx.error(
          ctx.translate`Aucune récompense n'est défini pour le niveau **${level}** !`
        );

      // Remove the role reward
      rewards = rewards.filter((rr) => rr.level !== level);

      // Update the database
      await ctx.database
        .table("guild_levels")
        .update({
          rewards: JSON.stringify(rewards),
        })
        .where("guildId", ctx.guild.id);

      // Send success message
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Les récompenses pour le niveau **${level}** ont été supprimées avec succès !`,
      });
    }
  }
};
