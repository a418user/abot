const SlashCommand = require("../../managers/structures/SlashCommands.js");
const backup = require("discord-backup");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = class Backup extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "backups",
      description: "Gérer la sauvegarde du serveur",
      options: [
        {
          name: "créer",
          description: "Créer une sauvegarde du serveur",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer une sauvegarde",
          type: 1,
          options: [
            {
              name: "id",
              description: "Id de la sauvegarde",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "détails",
          description: "Afficher les détails d'une sauvegarde",
          type: 1,
          options: [
            {
              name: "id",
              description: "Id de la sauvegarde",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "charger",
          description: "Charger une sauvegarde",
          type: 1,
          options: [
            {
              name: "id",
              description: "Id de la sauvegarde",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "liste",
          description: "Afficher la liste des sauvegardes",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Management,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    backup.setStorageFolder(path.join(__dirname, "../../backups"));

    if (subCommand === "créer") {
      const options = {
        maxMessagesPerChannel: 50,
        jsonSave: true,
        jsonBeautify: true,
        saveImages: "base64",
      };

      const msg = await ctx.send({
        content: ctx.translate`:clock10: La création de la sauvegarde est en cours...`,
      });
      await backup
        .create(ctx.guild, options)
        .then(async (backupData) => {
          await msg.edit({
            content: `${
              ctx.emojiSuccess
            } ${ctx.translate`La sauvegarde du serveur **${ctx.guild.name}** a été créée avec succès ! Son id est : \`${backupData.id}\`\n\n:information_source: **Conservez bien cet id !**`}`,
          });

          await ctx.database.table("backups").insert({
            user_id: ctx.user.id,
            serverName: ctx.guild.name,
            code: backupData.id,
          });
        })
        .catch((err) => {
          const errorDetails =
            typeof err === "string" ? err : JSON.stringify(err);
          msg.edit({
            content: `${
              ctx.emojiError
            } ${ctx.translate`Une erreur est survenue :`}\n${errorDetails}`,
          });
        });
    } else if (subCommand === "supprimer") {
      const backupId = ctx.options.getString("id");

      await backup
        .remove(backupId)
        .then(async () => {
          await ctx.send({
            content: `${
              ctx.emojiSuccess
            } ${ctx.translate`La sauvegarde **${backupId}** a été supprimée !`}`,
          });

          const backupData = await ctx.database
            .table("backups")
            .select()
            .where("code", backupId)
            .first();
          if (backupData) {
            await ctx.database
              .table("backups")
              .delete()
              .where("code", backupId);
          }
        })
        .catch((err) => {
          if (err === "No backup found")
            return ctx.error(
              ctx.translate`La sauvegarde avec l'idée ${backupId} n'a pas été trouvée !`
            );
          else
            return ctx.error(
              `${ctx.translate`Une erreur est survenue :`}\n${
                typeof err === "string" ? err : JSON.stringify(err)
              }`
            );
        });
    } else if (subCommand === "détails") {
      const backupId = ctx.options.getString("id");

      backup
        .fetch(backupId)
        .then((backupInfos) => {
          const embed = new EmbedBuilder()
            .setTitle(ctx.translate`Informations sur la sauvegarde`)
            .addFields([
              {
                name: ctx.translate`Backup Id`,
                value: `\`${backupInfos.id}\``,
              },
              {
                name: ctx.translate`Nom du serveur`,
                value: `${backupInfos.data.name}`,
              },
              {
                name: ctx.translate`Serveur Id`,
                value: `\`${backupInfos.data.guildID}\``,
              },
              { name: ctx.translate`Taille`, value: `${backupInfos.size} kb` },
              {
                name: ctx.translate`Créé le`,
                value: `<t:${(
                  backupInfos.data.createdTimestamp / 1000
                ).toFixed()}:d>`,
              },
            ])
            .setColor("#FF0000");

          ctx.send({ embeds: [embed] });
        })
        .catch((err) => {
          if (err === "No backup found")
            return ctx.error(
              ctx.translate`La sauvegarde avec l'idée ${backupId} n'a pas été trouvée !`
            );
          else
            return ctx.error(
              `${ctx.translate`Une erreur est survenue :`}\n${
                typeof err === "string" ? err : JSON.stringify(err)
              }`
            );
        });
    } else if (subCommand === "charger") {
      const backupId = ctx.options.getString("id");

      backup
        .fetch(backupId)
        .then(async () => {
          const embed = new EmbedBuilder()
            .setDescription(
              ctx.translate`:information_source: **Êtes-vous sur de vouloir charger la sauvegarde ?**`
            )
            .setColor(ctx.colors.blue);

          const msg = await ctx.send({
            embeds: [embed],
            components: ctx.messageFormatter.question(
              "yes",
              `${ctx.emojiSuccess}`,
              "no",
              `${ctx.emojiError}`
            ),
          });

          const filter = (button) => button.user.id === ctx.user.id;
          const collector = msg.createMessageComponentCollector({
            filter,
            time: 2 * 60 * 1000,
            max: 1,
            componentType: 2,
          });

          collector.on("collect", async (button) => {
            collector.stop();
            if (button.customId === "no") {
              await msg.delete().catch(() => null);
            } else if (button.customId === "yes") {
              await button.deferUpdate();

              embed.setDescription(
                ctx.translate`:clock10: **Chargement de la sauvegarde en cours...**`
              );

              await button.message.edit({
                embeds: [embed],
                components: [],
              });

              await backup
                .load(backupId, ctx.guild, {
                  clearGuildBeforeRestore: false,
                  maxMessagesPerChannel: 3,
                })
                .then(async () => {
                  embed.setDescription(
                    `${
                      ctx.emojiSuccess
                    } ${ctx.translate`**La sauvegarde a été chargée avec succès !**`}`
                  );

                  await button.message.edit({ embeds: [embed] });
                })
                .catch((err) => {
                  console.log(err);
                  if (err === "No backup found")
                    return button.followUp(
                      ctx.translate`La sauvegarde avec l'idée ${backupId} n'a pas été trouvée !`
                    );
                  else
                    return button.followUp(
                      `${ctx.translate`Une erreur est survenue :`}\n${
                        typeof err === "string" ? err : JSON.stringify(err)
                      }`
                    );
                });
            }
          });

          collector.on("end", (_, reason) => {
            if (reason === "time")
              return ctx.error(ctx.translate`La commande a expiré !`);
          });
        })
        .catch(() => {
          return ctx.error(
            ctx.translate`La sauvegarde avec l'idée ${backupId} n'a pas été trouvée !`
          );
        });
    } else if (subCommand === "liste") {
      const backups = await ctx.database
        .table("backups")
        .select()
        .where("user_id", ctx.user.id);
      if (!backups[0])
        return ctx.error(ctx.translate`Aucune sauvegarde n'a été trouvée !`);

      const embed = new EmbedBuilder()
        .setTitle(
          ctx.translate`Liste des sauvegardes de ${ctx.user.displayName}`
        )
        .setDescription(
          backups
            .map(
              (backup) =>
                ctx.translate`- **${backup.serverName}** : \`${backup.code}\``
            )
            .join("\n")
        )
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        });

      ctx.send({ embeds: [embed] });
    }
  }
};
