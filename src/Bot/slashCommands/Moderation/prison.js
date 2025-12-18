const SlashCommand = require("../../managers/structures/SlashCommands.js");
const ms = require("ms");
const schedule = require("node-schedule");
const { EmbedBuilder } = require("discord.js");

module.exports = class Prison extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "prison-user",
      description: "Gérer les membres en prison",
      options: [
        {
          name: "ajouter",
          description: "Ajouter un membre en prison",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Le membre à ajouter en prison",
              type: 6,
              required: true,
            },
            {
              name: "raison",
              description: "La raison de l'emprisonnement",
              type: 3,
              required: true,
            },
            {
              name: "temps",
              description: "Le temps de l'emprisonnement",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "retirer",
          description: "Retirer un membre de prison",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Le membre à retirer de prison",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "réinitialiser",
          description: "Réinitialiser les membres en prison",
          type: 1,
        },
        {
          name: "liste",
          description: "Afficher la liste des membres en prison",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const baseGuildPrison = await ctx.database
      .table("guild_prison")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!baseGuildPrison[0])
      return ctx.error(
        ctx.translate`Le système de prison n'est pas configuré !`
      );

    if (subCommand === "ajouter") {
      const member = ctx.options.getMember("membre");
      const reason = ctx.options.getString("raison");
      const time = ctx.options.getString("temps") || null;

      if (!member)
        return ctx.error(ctx.translate`Veuillez entrer un membre valide !`);

      const baseUserPrison = await ctx.database
        .table("user_prison")
        .select()
        .where({ guild_id: ctx.guild.id, user_id: member.id });
      if (baseUserPrison[0])
        return ctx.error(ctx.translate`Ce membre est déjà en prison !`);

      const roleToAdd = ctx.getRole(baseGuildPrison[0].role_add_id);
      if (!roleToAdd)
        return ctx.error(
          ctx.translate`Les rôles du système de prison ne sont pas configurés correctement !`
        );

      let timing = null;
      if (time) {
        const timeInMs = ms(time);
        if (isNaN(timeInMs))
          return ctx.error(
            ctx.translate`Veuillez entrer une durée valide sous la forme 1s/1m/1h/1d !`
          );

        timing = Date.now() + timeInMs;
      }

      // Save all the id of the roles of the member
      const roles = [];

      // Remove all roles of the member
      const notRemoved = [];
      for (const role of member.roles.cache
        .filter((r) => r.id !== ctx.guild.id)
        .values()) {
        roles.push(role.id);

        await member.roles.remove(role.id).catch(() => {
          notRemoved.push(role.name);
        });
      }

      await member.roles.add(roleToAdd.id).catch((e) => {
        return ctx.error(`${ctx.translate`Impossible d'ajouter le rôle **${roleToAdd.name}** à **${member.user.displayName}** !`}
${e}`);
      });

      await ctx.database.table("user_prison").insert({
        guild_id: ctx.guild.id,
        user_id: member.id,
        reason: reason,
        time: timing ? timing : null,
        roles: JSON.stringify(roles),
      });

      const durationText =
        timing !== null
          ? ctx.translate` pendant **${ms(ms(time), { long: true })}**`
          : "";
      const removalWarning =
        notRemoved.length !== 0
          ? ctx.translate`
:warning: Les rôles **${notRemoved.join(", ")}** n'ont pas pu être retiré.`
          : "";
      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Le membre **${member.user.displayName}** a été emprisonné`}${durationText} !${removalWarning}`,
      });

      if (timing) {
        schedule.scheduleJob(timing, async () => {
          await member.roles.remove(roleToAdd.id).catch(() => null);
          await member.roles.add(roles).catch(() => null);

          await ctx.database
            .table("user_prison")
            .delete()
            .where({ guild_id: ctx.guild.id, user_id: member.id });
        });
      }
    } else if (subCommand === "retirer") {
      const member = ctx.options.getMember("membre");
      if (!member)
        return ctx.error(ctx.translate`Veuillez entrer un membre valide !`);

      const baseUserPrison = await ctx.database
        .table("user_prison")
        .select()
        .where({ guild_id: ctx.guild.id, user_id: member.id });
      if (!baseUserPrison[0])
        return ctx.error(ctx.translate`Ce membre n'est pas en prison !`);

      const roleToAdd = ctx.getRole(baseGuildPrison[0].role_add_id);

      await member.roles.remove(roleToAdd.id).catch(() => {
        ctx.error(
          ctx.translate`Impossible de retirer le rôle **${roleToAdd.name}** à **${member.user.displayName}** !`
        );
      });

      const rolesToAdd = JSON.parse(baseUserPrison[0].roles);
      if (rolesToAdd[0]) {
        await member.roles.add(rolesToAdd).catch((e) => {
          ctx.error(`${ctx.translate`Une erreur est survenue lors de l'ajout des rôles à **${member.user.displayName}** !`}
${e}`);
        });
      }

      await ctx.database
        .table("user_prison")
        .delete()
        .where({ guild_id: ctx.guild.id, user_id: member.id });

      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Le membre **${member.user.displayName}** a été retiré de prison !`}`,
      });
    } else if (subCommand === "réinitialiser") {
      const baseUserPrison = await ctx.database
        .table("user_prison")
        .select()
        .where("guild_id", ctx.guild.id);
      if (!baseUserPrison[0])
        return ctx.error(ctx.translate`Il n'y a aucun membre en prison !`);

      const msg = await ctx.send({
        content: ctx.translate`:clock10: Les membres en prison sont en cours de réinitialisation !`,
      });

      for (const userPrison of baseUserPrison) {
        const member = ctx.getMember(userPrison.user_id);
        if (!member) continue;

        const roleToAdd = ctx.getRole(baseGuildPrison[0].role_add_id);

        await member.roles.remove(roleToAdd.id).catch(() => {
          ctx.error(
            ctx.translate`Impossible de retirer le rôle **${roleToAdd.name}** à **${member.user.displayName}** !`
          );
        });

        const rolesToAdd = JSON.parse(userPrison.roles);
        if (rolesToAdd[0]) {
          await member.roles.add(rolesToAdd).catch((e) => {
            ctx.error(`${ctx.translate`Une erreur est survenue lors de l'ajout des rôles à **${member.user.displayName}** !`}
${e}`);
          });
        }
      }

      await ctx.database
        .table("user_prison")
        .delete()
        .where("guild_id", ctx.guild.id);

      msg.edit({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Les membres en prison ont été réinitialisés !`}`,
      });
    } else if (subCommand === "liste") {
      const baseUserPrison = await ctx.database
        .table("user_prison")
        .select()
        .where("guild_id", ctx.guild.id);
      if (!baseUserPrison[0])
        return ctx.error(ctx.translate`Il n'y a aucun membre en prison !`);

      let description = [];

      for (const userPrison of baseUserPrison) {
        let member = ctx.getMember(userPrison.user_id);
        if (!member) member = `\`${userPrison.user_id}\``;
        else member = `${member.user}`;

        const duration = userPrison.time
          ? ctx.translate`**${ms(userPrison.time - Date.now(), {
              long: true,
            })}**`
          : ctx.translate`indéfiniment`;
        description.push(
          ctx.translate`- ${member} | ${duration} | ${userPrison.reason}`
        );
      }
      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setTitle(ctx.translate`Liste des membres en prison`)
        .setDescription(description.join("\n"));

      ctx.send({ embeds: [embed] });
    }
  }
};
