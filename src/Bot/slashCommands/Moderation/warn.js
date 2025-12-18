const SlashCommand = require("../../managers/structures/SlashCommands.js");
const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
} = require("discord.js");
const axios = require("axios");
const FormData = require("form-data");

module.exports = class Warn extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "warn",
      description: "Gérer les avertissements",
      options: [
        {
          name: "nouveau",
          description: "Avertir un membre",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à avertir",
              type: 6,
              required: true,
            },
            {
              name: "raison",
              type: 3,
              description: "Raison de l'avertissement",
              required: true,
            },
            {
              name: "preuve",
              type: 11,
              description: "Preuve de l'avertissement",
              required: false,
            },
          ],
        },
        {
          name: "liste",
          description: "Obtenir tous les avertissements d'un membre",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre pour obtenir la liste",
              type: 6,
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  /**
   * Get url of a Discord image
   * @param {String} url
   * @returns {Promise<String>}
   * */
  async downloadImageToDataURL(url) {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    return response.data;
  }

  /**
   * Get the image of a proof
   * @param proofId
   * @return {Promise<null>}
   */
  async getImage(proofId) {
    const response = await axios
      .get(
        `${this.config["media"]["mediaLink"]}/album/${this.config["media"]["mediaAlbumWarnId"]}`,
        {
          headers: {
            "x-api-key": this.config["media"]["mediaTokenWarn"],
            "Content-Type": "multipart/form-data",
            accept: "application/vnd.chibisafe.json",
          },
        }
      )
      .catch(() => null);

    // Check if the response is valid
    let imageUrl = null;
    if (response && response.data && response.data.files) {
      const data = response.data.files.find((f) => f.uuid === proofId);
      if (!data) return null;
      return data.url;
    }

    return imageUrl;
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "nouveau") {
      const member = ctx.options.getMember("membre");
      const user = ctx.options.getUser("membre");
      const reason = ctx.options.getString("raison");
      let proof = ctx.options.getAttachment("preuve") || null;

      // Check if the member is in the guild
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // Get the guild warns data
      const guildData = await ctx.database
        .table("guild_warns")
        .where("guildId", ctx.guild.id)
        .first();
      if (!guildData)
        return ctx.error(
          ctx.translate`Le système d'avertissements n'est pas configuré sur ce serveur !`
        );

      // Send confirmation message
      ctx.success(ctx.translate`Le membre a été averti avec succès !`);

      const embedModeration = new EmbedBuilder()
        .setAuthor({
          name: ctx.translate`${ctx.client.user.displayName} Modération`,
          iconURL: `${
            ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
          }`,
        })
        .setColor("#ec2222")
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .addFields([
          {
            name: ctx.translate`Information :`,
            value: ctx.translate`» **${member.user.displayName}** (\`${member.id}\`) a été averti par **${ctx.user.displayName}** avec comme raison : **${reason}**`,
          },
        ])
        .setFooter({
          text: `${ctx.user.displayName}`,
          iconURL: `${ctx.user.displayAvatarURL()}`,
        });

      // Send a message to the channel
      const channel = ctx.getChannel(guildData.channelId);
      if (channel && channel?.isSendable())
        channel.send({ embeds: [embedModeration] }).catch(() => null);

      // Send a message to the member
      if (Boolean(guildData.isDm)) {
        const embedDm = new EmbedBuilder()
          .setAuthor({
            name: ctx.translate`${ctx.client.user.displayName} Modération`,
            iconURL: `${
              ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
            }`,
          })
          .setColor("#ec2222")
          .setThumbnail(
            ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
          )
          .addFields([
            {
              name: ctx.translate`Information :`,
              value: ctx.translate`» Vous avez reçu un nouvel avertissement sur le serveur **${ctx.guild.name}** pour la raison : **${reason}**`,
            },
          ])
          .setFooter({
            text: `${ctx.guild.name}`,
            iconURL: `${
              ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
            }`,
          });

        try {
          // Send a direct message to the member
          await user.send({ embeds: [embedDm] });
        } catch {
          ctx.error(
            ctx.translate`Impossible d'envoyer un message privé à ce membre, il a probablement désactivé les messages privés de la part des membres du serveur !`
          );
        }
      }

      // Check if the proof is an image
      if (proof && !proof.contentType.includes("image")) proof = null;

      // Get a new url for the proof
      let fileId = null;
      if (proof) {
        const proofBase64 = await this.downloadImageToDataURL(proof.url);
        const idCard = `${ctx.user.id}-${Date.now()}.png`;
        const form = new FormData();
        form.append("files[]", proofBase64, idCard);
        form.append("name", idCard);

        const response = await axios
          .post(`${ctx.config["media"]["mediaLink"]}/upload`, form, {
            headers: {
              ...form.getHeaders(),
              "x-api-key": this.config["media"]["mediaTokenWarn"],
              "Content-Type": "multipart/form-data",
              accept: "application/vnd.chibisafe.json",
              albumuuid: this.config["media"]["mediaAlbumWarnId"],
            },
          })
          .catch(() => null);

        // Check if the response is valid
        if (response || response.data || response.data.url) {
          fileId = response.data.uuid;
        }
      }

      await ctx.database.table("user_warns").insert({
        guildId: ctx.guild.id,
        authorId: ctx.user.id,
        memberId: member.id,
        reason: reason,
        date: ctx.inter.createdTimestamp,
        proofId: fileId,
      });
    } else if (subCommand === "liste") {
      const member = ctx.options.getUser("membre");

      let warns = await ctx.database
        .table("user_warns")
        .select()
        .where({ guildId: ctx.guild.id, memberId: member.id })
        .orderBy("date");
      if (!warns[0])
        return ctx.error(ctx.translate`Ce membre n'a aucun avertissement !`);

      function displayEmbed(data, increment) {
        let fields = ``;

        for (const row of data) {
          fields += ctx.translate`**\`${String(increment)}.\`** **${
            row.reason
          }** le <t:${(row.date / 1000).toFixed()}:d>\n`;
          increment++;
        }

        return new EmbedBuilder()
          .setThumbnail(member.displayAvatarURL())
          .setColor(ctx.me.displayHexColor)
          .setAuthor({
            name: ctx.translate`Liste des avertissements de ${member.displayName}`,
            iconURL: `${
              ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
            }`,
          })
          .setDescription(fields);
      }

      function displaySelectMenu(data, increment) {
        const fields = [];

        for (const row of data) {
          fields.push({
            label: String(increment),
            value: `${row.id}`,
            emoji: "📃",
          });

          increment++;
        }

        return new StringSelectMenuBuilder()
          .setCustomId("warns_select_menu")
          .setPlaceholder(ctx.translate`Choisir une sanction`)
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(fields);
      }

      const allWarns = warns.sort((a, b) => (a.id < b.id ? -1 : 1));
      const numberPerPage = 10;
      const data_list = ctx.utils.getNumberPacket(allWarns, numberPerPage);
      let page = 1;
      let increment = (page - 1) * numberPerPage + 1;

      let msg;
      const filter = (button) => button.user.id === ctx.user.id;

      if (data_list.length === 1) {
        msg = await ctx.send({
          embeds: [displayEmbed(data_list[page - 1], increment)],
          components: [
            {
              type: 1,
              components: [displaySelectMenu(data_list[page - 1], increment)],
            },
          ],
        });
      } else {
        const pageLabel = ctx.translate`Page ${page}/${data_list.length}`;
        const component1 = ctx.messageFormatter.pages(
          pageLabel,
          page,
          data_list.length
        );
        const component2 = [
          {
            type: 1,
            components: [displaySelectMenu(data_list[page - 1], increment)],
          },
        ];
        const components = component1.concat(component2);
        msg = await ctx.send({
          embeds: [displayEmbed(data_list[page - 1], increment)],
          components: components,
        });
      }

      const collector = msg.createMessageComponentCollector({
        filter,
        idle: 5 * 60 * 1000,
        componentType: 2,
      });
      const collectorMenu = msg.createMessageComponentCollector({
        filter,
        idle: 5 * 60 * 1000,
        componentType: 3,
      });

      collector.on("collect", async (button) => {
        if (button.customId.includes("warns_details")) {
          await button.deferUpdate();
          const id = button.customId.split("_")[2];

          const warn = warns.find((w) => w.id === Number(id));
          if (!warn)
            return button.followUp({
              content: `${
                ctx.emojiError
              } ${ctx.translate`L'infraction n'existe plus !`}`,
              ephemeral: true,
            });

          const moderator = `${
            ctx.guild.members.cache.get(warn.authorId)
              ? ctx.guild.members.cache.get(warn.authorId).user.displayName
              : `\`${warn.authorId}\``
          }`;
          let image = null;
          if (warn.proofId) image = await this.getImage(warn.proofId);

          const embed = new EmbedBuilder()
            .setColor(ctx.me.displayHexColor)
            .setThumbnail(member.displayAvatarURL())
            .setAuthor({
              name: ctx.translate`Liste des avertissements de ${member.displayName}`,
              iconURL: `${
                ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
              }`,
            })
            .setImage(image)
            .setDescription(
              ctx.translate`**Raison :** ${warn.reason}\n**Date :** <t:${(
                warn.date / 1000
              ).toFixed()}:d>\n**Modérateur :** ${moderator}`
            );

          return button.message.edit({
            embeds: [embed],
          });
        } else if (button.customId.includes("warns_delete")) {
          await button.deferUpdate();
          const id = button.customId.split("_")[2];

          const embedAsk = new EmbedBuilder()
            .setDescription(
              ctx.translate`Souhaitez-vous supprimer l'infraction ?\n\n:information_source: **Cette action est irréversible !**`
            )
            .setColor(ctx.me.displayHexColor);

          const msgAsk = await button.channel.send({
            embeds: [embedAsk],
            components: ctx.messageFormatter.question(
              `yes`,
              `${ctx.emojiSuccess}`,
              `no`,
              `${ctx.emojiError}`
            ),
          });

          const collectorAsk = msgAsk.createMessageComponentCollector({
            filter,
            time: 2 * 60 * 1000,
            componentType: 2,
          });
          collectorAsk.on("collect", async (buttonAsk) => {
            await buttonAsk.deferUpdate();
            msgAsk.delete().catch(() => null);
            collectorAsk.stop();
            if (buttonAsk.customId !== "yes") return;

            const check = await ctx.database
              .table("user_warns")
              .select("id")
              .where({ memberId: member.id, guildId: ctx.guild.id, id });
            if (!check[0])
              return button.followUp({
                content: `${
                  ctx.emojiError
                } ${ctx.translate`L'infraction n'existe plus !`}`,
                ephemeral: true,
              });

            await ctx.database
              .table("user_warns")
              .delete()
              .where({ id, guildId: ctx.guild.id });
            await button.followUp({
              content: `${
                ctx.emojiSuccess
              } ${ctx.translate`L'infraction a bien été supprimée !`}`,
              ephemeral: true,
            });

            // Delete the image if exists
            const warn = warns.find((w) => w.id === Number(id));
            if (warn.proofId) {
              await axios
                .delete(
                  `${ctx.config["media"]["mediaLink"]}/file/${warn.proofId}`,
                  {
                    headers: {
                      "x-api-key": this.config["media"]["mediaTokenWarn"],
                      "Content-Type": "multipart/form-data",
                      accept: "application/vnd.chibisafe.json",
                    },
                  }
                )
                .catch(() => null);
            }

            warns = await ctx.database
              .table("user_warns")
              .select()
              .where({ memberId: member.id, guildId: ctx.guild.id });
            if (!warns[0]) {
              collectorMenu.stop();
              const embed = new EmbedBuilder()
                .setThumbnail(member.displayAvatarURL())
                .setColor(ctx.me.displayHexColor)
                .setAuthor({
                  name: ctx.translate`Liste des avertissements de ${member.displayName}`,
                  iconURL: `${
                    ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
                  }`,
                })
                .setDescription(
                  ctx.translate`Ce membre n'a aucun avertissement !`
                );

              return button.message.edit({
                embeds: [embed],
                components: [],
              });
            }

            const allWarns = warns.sort((a, b) => (a.id < b.id ? -1 : 1));
            const numberPerPage = 10;
            const data_list = ctx.utils.getNumberPacket(
              allWarns,
              numberPerPage
            );
            page = 1;
            increment = (page - 1) * numberPerPage + 1;

            if (data_list.length === 1) {
              await button.message.edit({
                embeds: [displayEmbed(data_list[page - 1], increment)],
                components: [
                  {
                    type: 1,
                    components: [
                      displaySelectMenu(data_list[page - 1], increment),
                    ],
                  },
                ],
              });
            } else {
              const pageLabel = ctx.translate`Page ${page}/${data_list.length}`;
              const component1 = ctx.messageFormatter.pages(
                pageLabel,
                page,
                data_list.length
              );
              const component2 = [
                {
                  type: 1,
                  components: [
                    displaySelectMenu(data_list[page - 1], increment),
                  ],
                },
              ];
              const components = component1.concat(component2);

              await button.message.edit({
                embeds: [displayEmbed(data_list[page - 1], increment)],
                components: components,
              });
            }
          });
        } else if (["left", "right"].includes(button.customId)) {
          await button.deferUpdate();
          button.customId === "warns_left" ? page-- : page++;
          increment = (page - 1) * numberPerPage + 1;
          const pageLabel = ctx.translate`Page ${page}/${data_list.length}`;
          const component1 = ctx.messageFormatter.pages(
            pageLabel,
            page,
            data_list.length
          );
          const component2 = [
            {
              type: 1,
              components: [displaySelectMenu(data_list[page - 1], increment)],
            },
          ];
          const components = component1.concat(component2);

          await msg.edit({
            embeds: [displayEmbed(data_list[page - 1], increment)],
            components: components,
          });
        }
      });

      collectorMenu.on("collect", async (menu) => {
        await menu.deferUpdate();
        const choice = menu.values[0];

        const buttonDetails = new ButtonBuilder()
          .setCustomId(`warns_details_${choice}`)
          .setLabel(ctx.translate`Détails de la sanction`)
          .setStyle(2)
          .setEmoji("📝");

        const buttonDelete = new ButtonBuilder()
          .setCustomId(`warns_delete_${choice}`)
          .setLabel(ctx.translate`Supprimer la sanction`)
          .setStyle(4)
          .setEmoji("🗑️");

        if (data_list.length === 1) {
          return menu.message.edit({
            components: [
              {
                type: 1,
                components: [buttonDetails, buttonDelete],
              },
              {
                type: 1,
                components: [displaySelectMenu(data_list[page - 1], increment)],
              },
            ],
          });
        } else {
          const pageLabel = ctx.translate`Page ${page}/${data_list.length}`;
          const component1 = ctx.messageFormatter.pages(
            pageLabel,
            page,
            data_list.length
          );
          component1[0].components.push(buttonDetails, buttonDelete);

          const component2 = [
            {
              type: 1,
              components: [displaySelectMenu(data_list[page - 1], increment)],
            },
          ];
          const components = component1.concat(component2);

          return menu.message.edit({
            embeds: [displayEmbed(data_list[page - 1], increment)],
            components: components,
          });
        }
      });

      collectorMenu.on("end", (_, reason) => {
        if (reason === "idle")
          return msg.edit({ components: [] }).catch(() => null);
      });
    }
  }
};
