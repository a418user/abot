const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class Nickname extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "nickname",
      description: "Gérer le pseudo des membres",
      options: [
        {
          name: "configurer",
          description: "Configurer le pseudo des membres",
          type: 1,
          options: [
            {
              name: "type",
              description: "Le type de membre à renommer",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Tous les membres",
                  value: "all",
                },
                {
                  name: "Humains",
                  value: "user",
                },
                {
                  name: "Bots",
                  value: "bot",
                },
                {
                  name: "Rôle",
                  value: "role",
                },
              ],
            },
            {
              name: "pseudo",
              description: "Le pseudo à mettre",
              type: 3,
              required: true,
            },
            {
              name: "rôle",
              description: "Le rôle à cibler",
              type: 8,
              required: false,
            },
          ],
        },
        {
          name: "afficher",
          description: "Afficher le changement du pseudo des membres",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer le changement du pseudo des membres",
          type: 1,
          options: [
            {
              name: "type",
              description:
                "Le type de membre à qui supprimer le changement de pseudo",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Tous les membres",
                  value: "all",
                },
                {
                  name: "Humains",
                  value: "user",
                },
                {
                  name: "Bots",
                  value: "bot",
                },
                {
                  name: "Rôle",
                  value: "role",
                },
              ],
            },
            {
              name: "rôle",
              description: "Le rôle à cibler",
              type: 8,
              required: false,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["ManageNicknames"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();
    const baseNickname = await ctx.database
      .table("guild_nickname")
      .select()
      .where({ guild_id: ctx.guild.id });

    if (subCommand === "configurer") {
      const type = ctx.options.getString("type");
      const name = `${ctx.options.getString("pseudo")} `;
      const role = ctx.options.getRole("rôle") || null;

      if (type === "role" && !role)
        return ctx.error(ctx.translate`Vous devez spécifier un rôle !`);

      let data = [];
      if (baseNickname[0]) data = JSON.parse(baseNickname[0].data);

      let members = (await ctx.guild.members.fetch()).map((m) => m);
      let nameSuccess = 0;
      let nameError = 0;
      let nameIgnored = 0;
      let hasOldNickname = null;

      switch (type) {
        case "user":
          members = members.filter((member) => !member.user.bot);

          if (data.find((d) => d.type === "user")) {
            hasOldNickname = data.find((d) => d.type === "user").name;
            data = data.filter((d) => d.type !== "user");
          }
          data.push({
            name: name,
            type: "user",
            roleId: null,
          });
          break;
        case "bot":
          members = members.filter((member) => member.user.bot);

          if (data.find((d) => d.type === "bot")) {
            hasOldNickname = data.find((d) => d.type === "bot").name;
            data = data.filter((d) => d.type !== "bot");
          }
          data.push({
            name: name,
            type: "bot",
            roleId: null,
          });
          break;
        case "role":
          members = members.filter((member) => member.roles.cache.has(role.id));

          if (data.find((d) => d.type === "role" && d.roleId === role.id)) {
            hasOldNickname = data.find(
              (d) => d.type === "role" && d.roleId === role.id
            ).name;
            data = data.filter(
              (d) => d.type !== "role" && d.roleId === role.id
            );
          }
          data.push({
            name: name,
            type: "role",
            roleId: role.id,
          });
          break;
        default:
          if (data.find((d) => d.type === "all")) {
            hasOldNickname = data.find((d) => d.type === "all").name;
            data = data.filter((d) => d.type !== "all");
          }
          data.push({
            name: name,
            type: "all",
            roleId: null,
          });
          break;
      }

      const embed = new EmbedBuilder()
        .setDescription(
          ctx.translate`Êtes-vous sûr de vouloir renommer **${
            members.length
          }** ${members.length > 1 ? "membres" : "membre"} en \`${name}${
            ctx.member.nickname || ctx.user.displayName
          }\` ?`
        )
        .setColor(ctx.colors.blue);

      const msg = await ctx.send({
        embeds: [embed],
        components: ctx.messageFormatter.question(
          `yes`,
          `${ctx.emojiSuccess}`,
          `no`,
          `${ctx.emojiError}`
        ),
      });

      const filter = (button) => button.user.id === ctx.user.id;
      const collectorConfirm = msg.createMessageComponentCollector({
        filter,
        max: 1,
        idle: 5 * 60 * 1000,
      });

      collectorConfirm.on("collect", async (buttonConfirm) => {
        await buttonConfirm.deferUpdate();
        collectorConfirm.stop();

        if (buttonConfirm.customId === "no") {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le changement de pseudo a été annulé !`
          );
          return msg
            .edit({
              embeds: [embed],
              components: [],
            })
            .catch(() => null);
        } else {
          embed.setDescription(
            ctx.translate(":clock10: Le changement de pseudo est en cours ...")
          );
          await msg
            .edit({
              embeds: [embed],
              components: [],
            })
            .catch(() => null);

          if (!baseNickname[0]) {
            await ctx.database.table("guild_nickname").insert({
              guild_id: ctx.guild.id,
              data: JSON.stringify(data),
            });
          } else {
            await ctx.database
              .table("guild_nickname")
              .update({
                data: JSON.stringify(data),
              })
              .where({ guild_id: ctx.guild.id });
          }

          for (const member of members) {
            let oldName = member.nickname || member.user.displayName;

            // If the old nickname contains the new nickname, we ignore it
            if (oldName.startsWith(name)) {
              nameIgnored++;
              continue;
            }

            // If the old nickname contains the old nickname, we remove it
            if (hasOldNickname && oldName.startsWith(hasOldNickname)) {
              oldName = oldName.replace(hasOldNickname, "");
            }

            await member
              .setNickname(`${name}${oldName}`)
              .then(() => nameSuccess++)
              .catch(() => nameError++);
          }

          embed.setDescription(
            ctx.translate`${
              ctx.emojiSuccess
            } Le changement de pseudo est terminé !\n\n**${nameSuccess}** ${
              nameSuccess > 1
                ? "membres ont été renommés"
                : "membre a été renommé"
            } avec succès !\n**${nameError}** ${
              nameError > 1
                ? "membres n'ont pas pu être renommés"
                : "membre n'a pas pu être renommé"
            } !\n**${nameIgnored}** ${
              nameIgnored > 1
                ? "membres ont été ignorés"
                : "membre a été ignoré"
            } !`
          );
          return msg.edit({ embeds: [embed] }).catch(() => null);
        }
      });

      collectorConfirm.on("end", async (collected, reason) => {
        if (reason === "idle") {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le changement de pseudo a été annulé !`
          );
          return msg.edit({ embeds: [embed] }).catch(() => null);
        }
      });
    } else if (subCommand === "afficher") {
      if (!baseNickname[0])
        return ctx.error(
          ctx.translate`Aucun changement de pseudo n'a été configuré sur ce serveur !`
        );

      const data = JSON.parse(baseNickname[0].data);
      const fallbackNickname = ctx.translate`Aucun`;
      const nicknameAll = data.find((d) => d.type === "all")
        ? data.find((d) => d.type === "all").name
        : fallbackNickname;
      const nicknameHumans = data.find((d) => d.type === "user")
        ? data.find((d) => d.type === "user").name
        : fallbackNickname;
      const nicknameBots = data.find((d) => d.type === "bot")
        ? data.find((d) => d.type === "bot").name
        : fallbackNickname;
      const roleNicknames = data.filter((d) => d.type === "role");
      const roleValues = roleNicknames.length
        ? `\n${roleNicknames
            .map((d) => {
              const targetRole = ctx.getRole(d.roleId);
              return ` - \`${d.name}\`  (${
                targetRole ? targetRole : `\`${d.roleId}\``
              })`;
            })
            .join("\n")}`
        : `\`${fallbackNickname}\``;

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Changement de pseudo`)
        .setColor(ctx.colors.blue)
        .setDescription(
          ctx.translate`- **Tous les membres** : \`${nicknameAll}\`\n- **Humains** : \`${nicknameHumans}\`\n- **Bots** : \`${nicknameBots}\`\n- **Rôle** : ${roleValues}`
        )
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        });

      return ctx.send({ embeds: [embed] });
    } else if (subCommand === "supprimer") {
      const type = ctx.options.getString("type");
      const selectedRole = ctx.options.getRole("rôle") || null;

      if (type === "role" && !selectedRole)
        return ctx.error(ctx.translate`Vous devez spécifier un rôle !`);
      if (!baseNickname[0])
        return ctx.error(
          ctx.translate`Aucun changement de pseudo n'a été configuré sur ce serveur !`
        );

      let data = JSON.parse(baseNickname[0].data);
      let members = (await ctx.guild.members.fetch()).map((m) => m);
      let nameSuccess = 0;
      let nameError = 0;
      let nameIgnored = 0;
      let hasOldNickname = null;

      switch (type) {
        case "user":
          if (!data.find((d) => d.type === "user"))
            return ctx.error(
              ctx.translate`Aucun changement de pseudo n'a été configuré pour les humains !`
            );

          members = members.filter((member) => !member.user.bot);

          hasOldNickname = data.find((d) => d.type === "user").name;
          data = data.filter((d) => d.type !== "user");
          break;
        case "bot":
          if (!data.find((d) => d.type === "bot"))
            return ctx.error(
              ctx.translate`Aucun changement de pseudo n'a été configuré pour les bots !`
            );

          members = members.filter((member) => member.user.bot);

          hasOldNickname = data.find((d) => d.type === "bot").name;
          data = data.filter((d) => d.type !== "bot");
          break;
        case "role":
          if (
            !data.find((d) => d.type === "role" && d.roleId === selectedRole.id)
          )
            return ctx.error(
              ctx.translate`Aucun changement de pseudo n'a été configuré pour ce rôle !`
            );

          members = members.filter((member) =>
            member.roles.cache.has(selectedRole.id)
          );

          hasOldNickname = data.find(
            (d) => d.type === "role" && d.roleId === selectedRole.id
          ).name;
          data = data.filter((d) => d.roleId !== selectedRole.id);
          break;
        default:
          if (!data.find((d) => d.type === "all"))
            return ctx.error(
              ctx.translate`Aucun changement de pseudo n'a été configuré pour tous les membres !`
            );

          hasOldNickname = data.find((d) => d.type === "all").name;
          break;
      }

      const embed = new EmbedBuilder()
        .setDescription(
          ctx.translate`Êtes-vous sûr de vouloir supprimer le préfixe de **${
            members.length
          }** ${members.length > 1 ? "membres" : "membre"} ?`
        )
        .setColor(ctx.colors.blue);

      const msg = await ctx.send({
        embeds: [embed],
        components: ctx.messageFormatter.question(
          `yes`,
          `${ctx.emojiSuccess}`,
          `no`,
          `${ctx.emojiError}`
        ),
      });

      const filter = (button) => button.user.id === ctx.user.id;
      const collectorConfirm = msg.createMessageComponentCollector({
        filter,
        max: 1,
        idle: 5 * 60 * 1000,
      });

      collectorConfirm.on("collect", async (buttonConfirm) => {
        await buttonConfirm.deferUpdate();
        collectorConfirm.stop();

        if (buttonConfirm.customId === "no") {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le changement de pseudo a été annulé !`
          );
          return msg
            .edit({
              embeds: [embed],
              components: [],
            })
            .catch(() => null);
        } else {
          embed.setDescription(
            ctx.translate(":clock10: Le changement de pseudo est en cours ...")
          );
          await msg
            .edit({
              embeds: [embed],
              components: [],
            })
            .catch(() => null);

          await ctx.database
            .table("guild_nickname")
            .update({
              data: JSON.stringify(data),
            })
            .where({ guild_id: ctx.guild.id });

          for (const member of members) {
            let oldName = member.nickname;
            if (!oldName) continue;

            // If the old nickname no contains the nickname, we ignore it
            if (!oldName.startsWith(hasOldNickname)) {
              nameIgnored++;
              continue;
            }

            oldName = oldName.replace(hasOldNickname, "");

            await member
              .setNickname(`${oldName}`)
              .then(() => nameSuccess++)
              .catch(() => nameError++);
          }

          embed.setDescription(
            ctx.translate`${
              ctx.emojiSuccess
            } Le changement de pseudo est terminé !\n\n**${nameSuccess}** ${
              nameSuccess > 1
                ? "membres ont été renommés"
                : "membre a été renommé"
            } avec succès !\n**${nameError}** ${
              nameError > 1
                ? "membres n'ont pas pu être renommés"
                : "membre n'a pas pu être renommé"
            } !\n**${nameIgnored}** ${
              nameIgnored > 1
                ? "membres ont été ignorés"
                : "membre a été ignoré"
            } !`
          );
          return msg.edit({ embeds: [embed] }).catch(() => null);
        }
      });

      collectorConfirm.on("end", async (collected, reason) => {
        if (reason === "idle") {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le changement de pseudo a été annulé !`
          );
          return msg.edit({ embeds: [embed] }).catch(() => null);
        }
      });
    }
  }
};
