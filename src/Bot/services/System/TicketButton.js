const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  PermissionsBitField,
  AttachmentBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");
const FormData = require("form-data");
const axios = require("axios");

module.exports = class TicketButton {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.config = event.config;
    this.colors = event.colors;
    this.messageFormatter = event.messageFormatter;
    this.ticket = event.ticket;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    if (!inter.isButton()) return;

    if (
      !inter.customId.includes("create_ticket") &&
      inter.customId !== "create_ticket_menu" &&
      inter.customId !== "close_ticket_menu" &&
      inter.customId !== "reopen_ticket_menu" &&
      inter.customId !== "delete_ticket_menu" &&
      inter.customId !== "transcript_ticket_menu" &&
      inter.customId !== "claim_ticket_menu" &&
      inter.customId !== "close_ticket" &&
      inter.customId !== "reopen_ticket" &&
      inter.customId !== "delete_ticket" &&
      inter.customId !== "transcript_ticket" &&
      inter.customId !== "claim_ticket"
    )
      return;

    await inter.deferUpdate();

    if (
      !inter.guild.members.me.permissions.has(
        PermissionsBitField.Flags.Administrator
      ) &&
      !inter.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    )
      return inter
        .followUp({
          content: this
            .translate`${this.client.emojiError} Je n'ai pas la permission de gérer les salons !`,
          flags: 64,
        })
        .catch(() => null);

    const guild = inter.guild;
    const user = inter.member;

    if (inter.customId === "create_ticket_menu") {
      const baseTicket = await this.database
        .table("guild_ticket_menu")
        .select("choice_type", "emoji", "description")
        .where({ guild_id: inter.guild.id });
      if (!baseTicket[0]) return;

      const checkIfHasTicketOpen = await this.ticket.checkIfHasTicketOpen(
        inter,
        "user_ticket_menu",
        baseTicket[0].choice_type
      );
      if (checkIfHasTicketOpen)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Vous avez déjà un ticket d'ouvert <#${checkIfHasTicketOpen.channel_id}> !`,
            flags: 64,
          })
          .catch(() => null);

      const getAllTypeTickets = this.ticket.getAllTypeTickets(
        inter,
        baseTicket
      );

      const menuType = new StringSelectMenuBuilder()
        .setPlaceholder(this.translate`Choisir une catégorie`)
        .setMinValues(1)
        .setMaxValues(1)
        .setCustomId("choice_type")
        .addOptions(
          getAllTypeTickets.map((type) => {
            return {
              label: this.ticket.formatString(type.choice_type),
              description: type.description,
              emoji: type.emoji,
              value: type.choice_type.toLowerCase(),
            };
          })
        )
        .addOptions({
          label: this.translate`Annuler`,
          description: this.translate`Annuler la création d'un ticket`,
          emoji: "🔒",
          value: "cancel_menu",
        });

      const embedType = new EmbedBuilder()
        .setDescription(
          this
            .translate`:information_source: **Veuillez choisir une catégorie afin d'ouvrir un ticket.**`
        )
        .setColor(inter.guild.members.me.displayHexColor);

      const ActionRowType = new ActionRowBuilder().addComponents(menuType);

      const msgMenu = await inter
        .followUp({
          embeds: [embedType],
          components: [ActionRowType],
          flags: 64,
        })
        .catch(() => null);

      const collectorMenu = msgMenu.createMessageComponentCollector({
        componentType: 3,
        max: 1,
        time: 2 * 60 * 1000,
      });

      collectorMenu.on("collect", async (menu) => {
        collectorMenu.stop();
        await menu.deferUpdate();
        const choice = menu.values[0];
        inter.deleteReply(msgMenu.id).catch(() => null);

        if (choice === "cancel_menu")
          return menu
            .followUp({
              content: this
                .translate`${this.client.emojiError} Vous avez annulé la création d'un ticket !`,
              flags: 64,
            })
            .catch(() => null);

        const ticketChoiceType = await this.database
          .table("guild_ticket_menu")
          .select()
          .where({
            guild_id: inter.guild.id,
            choice_type: choice,
          });

        const checkIfChannelExists = this.ticket.checkIfChannelExists(
          inter,
          ticketChoiceType[0]
        );
        if (!checkIfChannelExists)
          return inter
            .followUp({
              content: this
                .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
              flags: 64,
            })
            .catch(() => null);

        const categoryDb = ticketChoiceType[0].category_id;
        const logDb = guild.channels.cache.get(ticketChoiceType[0].log_id);
        const nameChannelDb = ticketChoiceType[0].name_ticket;
        const numberTicket = ticketChoiceType[0].number_ticket;
        const msgDb = ticketChoiceType[0].msg_ticket;
        const rolesMentionDb = ticketChoiceType[0].roles_mention;
        const rolesAccess = JSON.parse(ticketChoiceType[0].roles_access);

        let nameChannel;
        if (!nameChannelDb) {
          nameChannel = "ticket";
        } else if (nameChannelDb.toLowerCase() === "author") {
          nameChannel = inter.user.username;
        } else {
          nameChannel = nameChannelDb.replace(" ", "-");
        }

        const ticketCreate = await guild.channels
          .create({
            name: `${nameChannel.toLowerCase()}-${numberTicket}`,
            type: 0,
            parent: categoryDb,
            permissionOverwrites: [
              {
                id: guild.id,
                type: 0,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: inter.user.id,
                type: 1,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks,
                  PermissionsBitField.Flags.AttachFiles,
                ],
              },
              {
                id: this.client.user.id,
                type: 1,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks,
                  PermissionsBitField.Flags.AttachFiles,
                ],
              },
            ].concat(
              rolesAccess.map((roleId) => {
                return {
                  id: roleId,
                  type: 0,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.AttachFiles,
                  ],
                };
              })
            ),
            reason: this.translate`Nouveau ticket de ${user.tag}`,
          })
          .catch(() => null);

        await this.database.table("user_ticket_menu").insert({
          guild_id: guild.id,
          user_id: user.id,
          ticket_id: ticketCreate.id,
          choice_type: choice,
        });

        await this.database
          .table("guild_ticket_menu")
          .update({ number_ticket: numberTicket + 1 })
          .where({
            guild_id: inter.guild.id,
            choice_type: choice,
          });

        if (logDb.viewable)
          logDb
            .send({
              embeds: [
                this.ticket.embedLogTicket(
                  "#03ee2d",
                  this
                    .translate`Ticket : **${ticketCreate.name}**\nAction : **Création**`,
                  user
                ),
              ],
            })
            .catch(() => null);

        const ticketClaim = new ButtonBuilder()
          .setEmoji("📢")
          .setLabel(this.translate`Réclamer`)
          .setStyle(2)
          .setCustomId("claim_ticket_menu");

        const ticketTranscript = new ButtonBuilder()
          .setEmoji("📄")
          .setLabel(this.translate`Sauvegarder`)
          .setStyle(2)
          .setCustomId("transcript_ticket_menu");

        const closeTicket = new ButtonBuilder()
          .setEmoji("🔒")
          .setLabel(this.translate`Fermer`)
          .setStyle(2)
          .setCustomId("close_ticket_menu");

        const buttonRowCreate = new ActionRowBuilder()
          .addComponents(ticketClaim)
          .addComponents(ticketTranscript)
          .addComponents(closeTicket);

        let firstMsg = `${user} `;

        if (rolesMentionDb) {
          for (const roleId of JSON.parse(rolesMentionDb)) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
              firstMsg += ` ${role} `;
            }
          }
        }

        firstMsg += `\n`;

        if (!msgDb) {
          firstMsg += `${this.client.emojiSuccess} **Votre ticket est ouvert !**`;
        } else {
          firstMsg += `${msgDb}`;
        }

        await ticketCreate
          .send({
            content: `${firstMsg}`,
            components: [buttonRowCreate],
          })
          .then((msg) => {
            msg.pin();
          })
          .catch(() => null);
      });

      collectorMenu.on("end", (collected, reason) => {
        if (reason === "time")
          return inter.followUp({
            content: this
              .translate`${this.client.emojiError} La création de ticket a expiré !`,
            flags: 64,
          });
      });
    } else if (inter.customId === "claim_ticket_menu") {
      const ticketDb = await this.database
        .table("user_ticket_menu")
        .select()
        .where({ ticket_id: inter.channel.id });

      if (inter.user.id === ticketDb[0].user_id)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'avez pas la permission de faire cela !`,
          flags: 64,
        });

      inter.channel
        .setTopic(this.translate`Ticket géré par : ${inter.member.displayName}`)
        .then(() => {
          inter.followUp({
            content: this
              .translate`${this.client.emojiSuccess} Le ticket est maintenant géré par : **${inter.member.displayName}** !`,
          });
        })
        .catch((err) => {
          inter.followUp({
            content: this.translate`Une erreur est survenue !\n${err}`,
          });
        });
    } else if (inter.customId === "transcript_ticket_menu") {
      // Check if the user who made the interaction has the permissions to manageMessages
      if (
        !inter.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
      )
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'avez pas la permission de faire cela !`,
          flags: 64,
        });

      const ticketDb = await this.database
        .table("user_ticket_menu")
        .select()
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket_menu")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });
      if (!ticketChoiceType[0]) return;

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      // Get the data of the guild ticket
      const channelTranscriptId = ticketChoiceType[0].archive_id;
      if (!channelTranscriptId)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Le salon des transcripts des tickets n'existe pas !`,
          flags: 64,
        });

      const channelTranscript =
        inter.guild.channels.cache.get(channelTranscriptId);
      if (!channelTranscript)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Le salon des transcripts des tickets n'existe pas !`,
          flags: 64,
        });
      if (!channelTranscript.viewable)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Je n'ai pas la permission de voir le salon des transcripts des tickets !`,
          flags: 64,
        });

      const msgWait = await inter
        .followUp({
          content: this
            .translate`:clock10: Génération du transcript en cours...`,
        })
        .catch(() => null);

      let transcriptBuffer = await discordTranscripts.createTranscript(
        inter.channel,
        {
          returnType: "buffer",
          filename: `ticket_${inter.channel.name}.html`,
          saveImages: true,
          poweredBy: false,
        }
      );

      if (Buffer.byteLength(transcriptBuffer) > 18990000) {
        transcriptBuffer = await discordTranscripts.createTranscript(
          inter.channel,
          {
            returnType: "buffer",
            filename: `ticket_${inter.channel.name}.html`,
            saveImages: false,
            poweredBy: false,
          }
        );
      }

      const form = new FormData();
      form.append(
        "files[]",
        transcriptBuffer,
        `ticket_${inter.channel.name}.html`
      );
      form.append("name", `ticket_${inter.channel.name}.html`);

      const response = await axios
        .post(`${this.config["media"]["mediaLink"]}/upload`, form, {
          headers: {
            ...form.getHeaders(),
            "x-api-key": this.config["media"]["mediaTokenTicket"],
            "Content-Type": "multipart/form-data",
            accept: "application/vnd.chibisafe.json",
            albumuuid: this.config["media"]["mediaAlbumTicketId"],
          },
        })
        .catch(() => null);

      if (!response && !response?.data) {
        const attachment = new AttachmentBuilder()
          .setFile(transcriptBuffer)
          .setName(`ticket_${inter.channel.name}.html`);
        // Send the transcript in the channel transcript
        channelTranscript
          .send({
            content: this
              .translate`> Transcript du ticket : **${inter.channel.name}**`,
            files: [attachment],
          })
          .then(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiSuccess} Le transcript du ticket a bien été envoyé dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          })
          .catch(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiError} Une erreur est survenue lors de l'envoi du transcript dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          });
      } else {
        // Send the transcript in the channel transcript
        channelTranscript
          .send({
            content: this
              .translate`> Transcript du ticket : **[${inter.channel.name}](${response.data.url})**`,
          })
          .then(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiSuccess} Le transcript du ticket a bien été envoyé dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          })
          .catch(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiError} Une erreur est survenue lors de l'envoi du transcript dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          });
      }
    } else if (inter.customId === "close_ticket_menu") {
      const ticketDb = await this.database
        .table("user_ticket_menu")
        .select()
        .where({ ticket_id: inter.channel.id });
      const baseTicket = await this.database
        .table("guild_ticket_menu")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });
      if (!baseTicket[0]) return;

      const ticketChoiceType = await this.database
        .table("guild_ticket_menu")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const embed = new EmbedBuilder()
        .setDescription(
          this
            .translate`:warning: **Êtes-vous sûr(e) de vouloir fermer ce ticket ?**`
        )
        .setColor(inter.guild.members.me.displayHexColor);

      const msg = await inter.channel
        .send({
          embeds: [embed],
          components: this.messageFormatter.question(
            `ticket_close_yes`,
            `${this.client.emojiSuccess}`,
            `ticket_close_no`,
            `${this.client.emojiError}`
          ),
        })
        .catch(() => null);

      const filter = (button) => button.user.id === inter.user.id;
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 2 * 60 * 1000,
        componentType: 2,
        max: 1,
      });

      collector.on("collect", async (button) => {
        collector.stop();
        await button.deferUpdate();
        msg.delete().catch(() => null);

        if (button.customId === "ticket_close_yes") {
          const category = ticketChoiceType[0].category_close_id;
          const log = await button.guild.channels.cache.get(
            ticketChoiceType[0].log_id
          );
          const nameTicket = button.guild.channels.cache.get(
            ticketDb[0].ticket_id
          ).name;
          const rolesAccess = JSON.parse(ticketChoiceType[0].roles_access);
          const member = button.guild.members.cache.get(ticketDb[0].user_id);

          let embed;
          if (member) {
            embed = this.ticket.embedLogTicket(
              "#f10707",
              this
                .translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`,
              member
            );
          } else {
            this.ticket.embedLogTicket(
              "#f10707",
              this
                .translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`
            );
          }

          if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);

          await inter.channel.permissionOverwrites
            .edit(ticketDb[0].user_id, { ViewChannel: false })
            .catch(() => {});
          await inter.channel
            .setParent(category, { lockPermissions: false })
            .catch(() => {});
          await inter.channel.permissionOverwrites.cache.forEach((user) => {
            if (
              user.id !== ticketDb[0].user_id &&
              user.id !== inter.guild.id &&
              user.id !== inter.client.user.id &&
              !rolesAccess.includes(user.id)
            ) {
              user.delete().catch(() => null);
            }
          });

          const embedToSend = new EmbedBuilder()
            .setDescription(
              this.translate`🎫 Quelle action souhaitez-vous faire ? 🎫`
            )
            .setColor("#2f3136");

          const transcriptTicket = new ButtonBuilder()
            .setStyle(1)
            .setLabel(this.translate`Sauvegarder`)
            .setEmoji("💾")
            .setCustomId("transcript_ticket_menu");

          const deleteTicket = new ButtonBuilder()
            .setStyle(4)
            .setLabel(this.translate`Supprimer`)
            .setEmoji("📛")
            .setCustomId("delete_ticket_menu");

          const reopenTicket = new ButtonBuilder()
            .setStyle(3)
            .setLabel(this.translate`Ré ouvrir`)
            .setEmoji("🔓")
            .setCustomId("reopen_ticket_menu");

          const buttonRowMenuAction = new ActionRowBuilder()
            .addComponents(transcriptTicket)
            .addComponents(deleteTicket)
            .addComponents(reopenTicket);

          inter.channel
            .send({ embeds: [embedToSend], components: [buttonRowMenuAction] })
            .catch(() => null);
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ components: null }).catch(() => null);
          return inter.followUp({
            content: this
              .translate`${this.client.emojiError} La fermeture du ticket a expiré !`,
            flags: 64,
          });
        }
      });
    } else if (inter.customId === "reopen_ticket_menu") {
      const ticketDb = await this.database
        .table("user_ticket_menu")
        .select()
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket_menu")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });
      if (!ticketChoiceType[0]) return;

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const category = ticketChoiceType[0].category_id;
      const log = await inter.guild.channels.cache.get(
        ticketChoiceType[0].log_id
      );
      const nameTicket = inter.guild.channels.cache.get(
        ticketDb[0].ticket_id
      ).name;
      const roleTicketOpen = inter.guild.roles.cache.get(
        ticketChoiceType[0].role_open_id
      );

      await inter.channel
        .setParent(category, { lockPermissions: false })
        .catch(() => null);
      await inter.channel.permissionOverwrites
        .edit(ticketDb[0].user_id, { ViewChannel: true })
        .catch(() => null);

      inter
        .followUp({
          content: this
            .translate`${this.client.emojiSuccess} Le ticket a bien été ré-ouvert !`,
          flags: 64,
        })
        .catch(() => null);
      inter.message.delete().catch(() => null);

      const member = inter.guild.members.cache.get(ticketDb[0].user_id);
      let embed;
      if (member) {
        if (roleTicketOpen)
          await member.roles.add(roleTicketOpen.id).catch(() => null);
        embed = this.ticket.embedLogTicket(
          "#BAF60B",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Ré ouverture**\nPar : **${inter.user.displayName}**`,
          member
        );
      } else {
        embed = this.ticket.embedLogTicket(
          "#BAF60B",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Ré ouverture**\nPar : **${inter.user.displayName}**`
        );
      }

      if (log.viewable) await log.send({ embeds: [embed] }).catch(() => null);
    } else if (inter.customId === "delete_ticket_menu") {
      const ticketDb = await this.database
        .table("user_ticket_menu")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket_menu")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });
      if (!ticketChoiceType[0]) return;

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const log = await inter.guild.channels.cache.get(
        ticketChoiceType[0].log_id
      );
      const nameTicket = inter.guild.channels.cache.get(
        ticketDb[0].ticket_id
      ).name;
      const member = inter.guild.members.cache.get(ticketDb[0].user_id);

      await this.database
        .table("user_ticket_menu")
        .delete()
        .where({ ticket_id: inter.channel.id })
        .catch(() => null);
      await inter.channel.delete().catch(() => null);

      let embed;
      if (member) {
        embed = this.ticket.embedLogTicket(
          "#f10707",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Suppression**\nPar : **${inter.user.displayName}**`,
          member
        );
      } else {
        embed = this.ticket.embedLogTicket(
          "#f10707",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Suppression**\nPar : **${inter.user.displayName}**`
        );
      }

      if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);
    } else if (inter.customId.includes("create_ticket")) {
      const type = inter.customId.split("_")[2];
      if (!type)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Une erreur est survenue !`,
            flags: 64,
          })
          .catch(() => null);

      const baseTicket = await this.database
        .table("guild_ticket")
        .select()
        .where({ guild_id: inter.guild.id, choice_type: type });
      if (!baseTicket[0]) return;

      const checkIfHasTicketOpen = await this.ticket.checkIfHasTicketOpen(
        inter,
        "user_ticket",
        type
      );
      if (checkIfHasTicketOpen)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Vous avez déjà un ticket d'ouvert <#${checkIfHasTicketOpen.channel_id}> !`,
            flags: 64,
          })
          .catch(() => null);

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        baseTicket[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const categoryDb = baseTicket[0].category_id;
      const logDb = guild.channels.cache.get(baseTicket[0].log_id);
      const nameChannelDb = baseTicket[0].name_ticket;
      const numberTicket = baseTicket[0].number_ticket;
      const msgDb = baseTicket[0].msg_ticket;
      const rolesMentionDb = baseTicket[0].roles_mention;
      const rolesAccess = JSON.parse(baseTicket[0].roles_access);

      let nameChannel;
      if (!nameChannelDb) {
        nameChannel = "ticket";
      } else if (nameChannelDb.toLowerCase() === "author") {
        nameChannel = inter.user.username;
      } else {
        nameChannel = nameChannelDb.replace(" ", "-");
      }

      const ticketCreate = await guild.channels
        .create({
          name: `${nameChannel.toLowerCase()}-${numberTicket}`,
          type: 0,
          parent: categoryDb,
          permissionOverwrites: [
            {
              id: guild.id,
              type: 0,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: inter.user.id,
              type: 1,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
              ],
            },
            {
              id: this.client.user.id,
              type: 1,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
              ],
            },
          ].concat(
            rolesAccess.map((roleId) => {
              return {
                id: roleId,
                type: 0,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks,
                  PermissionsBitField.Flags.AttachFiles,
                ],
              };
            })
          ),
          reason: this.translate`Nouveau ticket de ${user.displayName}`,
        })
        .catch(() => null);

      await this.database.table("user_ticket").insert({
        guild_id: guild.id,
        user_id: user.id,
        ticket_id: ticketCreate.id,
        choice_type: type,
      });

      await this.database
        .table("guild_ticket")
        .update({ number_ticket: numberTicket + 1 })
        .where({
          guild_id: inter.guild.id,
          choice_type: type,
        });

      if (logDb.viewable)
        logDb
          .send({
            embeds: [
              this.ticket.embedLogTicket(
                "#03ee2d",
                this
                  .translate`Ticket : **${ticketCreate.name}**\nAction : **Création**`,
                user
              ),
            ],
          })
          .catch(() => null);

      const ticketClaim = new ButtonBuilder()
        .setEmoji("📢")
        .setLabel(this.translate`Réclamer`)
        .setStyle(2)
        .setCustomId("claim_ticket");

      const ticketTranscript = new ButtonBuilder()
        .setEmoji("📄")
        .setLabel(this.translate`Sauvegarder`)
        .setStyle(2)
        .setCustomId("transcript_ticket");

      const closeTicket = new ButtonBuilder()
        .setEmoji("🔒")
        .setStyle(2)
        .setCustomId("close_ticket");

      const buttonRowCreate = new ActionRowBuilder()
        .addComponents(ticketClaim)
        .addComponents(ticketTranscript)
        .addComponents(closeTicket);

      let firstMsg = `${user} `;

      if (rolesMentionDb) {
        for (const roleId of JSON.parse(rolesMentionDb)) {
          const role = guild.roles.cache.get(roleId);
          if (role) {
            firstMsg += ` ${role} `;
          }
        }
      }

      firstMsg += `\n`;

      if (!msgDb) {
        firstMsg += this
          .translate`${this.client.emojiSuccess} **Votre ticket est ouvert !**`;
      } else {
        firstMsg += `${msgDb}`;
      }

      await ticketCreate
        .send({
          content: `${firstMsg}`,
          components: [buttonRowCreate],
        })
        .then((msg) => {
          msg.pin();
        })
        .catch(() => null);
    } else if (inter.customId === "claim_ticket") {
      const ticketDb = await this.database
        .table("user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });

      if (inter.user.id === ticketDb[0].user_id)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'avez pas la permission de faire cela !`,
          flags: 64,
        });

      inter.channel
        .setTopic(this.translate`Ticket géré par : ${inter.member.displayName}`)
        .then(() => {
          inter.followUp({
            content: this
              .translate`${this.client.emojiSuccess} Le ticket est maintenant géré par : **${inter.member.displayName}** !`,
          });
        })
        .catch((err) => {
          inter.followUp({
            content: this.translate`Une erreur est survenue !\n${err}`,
          });
        });
    } else if (inter.customId === "transcript_ticket") {
      // Check if the user who made the interaction has the permissions to manageMessages
      if (
        !inter.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
      )
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Vous n'avez pas la permission de faire cela !`,
          flags: 64,
        });

      const ticketDb = await this.database
        .table("user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      // Get the data of the guild ticket
      const channelTranscriptId = ticketChoiceType[0].archive_id;
      if (!channelTranscriptId)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Le salon des transcripts des tickets n'existe pas !`,
          flags: 64,
        });

      const channelTranscript =
        inter.guild.channels.cache.get(channelTranscriptId);
      if (!channelTranscript)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Le salon des transcripts des tickets n'existe pas !`,
          flags: 64,
        });
      if (!channelTranscript.viewable)
        return inter.followUp({
          content: this
            .translate`${this.client.emojiError} Je n'ai pas la permission de voir le salon des transcripts des tickets !`,
          flags: 64,
        });

      const msgWait = await inter
        .followUp({
          content: this
            .translate`:clock10: Génération du transcript en cours...`,
        })
        .catch(() => null);

      let transcriptBuffer = await discordTranscripts.createTranscript(
        inter.channel,
        {
          returnType: "buffer",
          filename: `ticket_${inter.channel.name}.html`,
          saveImages: true,
          poweredBy: false,
        }
      );

      if (Buffer.byteLength(transcriptBuffer) > 18990000) {
        transcriptBuffer = await discordTranscripts.createTranscript(
          inter.channel,
          {
            returnType: "buffer",
            filename: `ticket_${inter.channel.name}.html`,
            saveImages: false,
            poweredBy: false,
          }
        );
      }

      const form = new FormData();
      form.append(
        "files[]",
        transcriptBuffer,
        `ticket_${inter.channel.name}.html`
      );
      form.append("name", `ticket_${inter.channel.name}.html`);

      const response = await axios
        .post(`${this.config["media"]["mediaLink"]}/upload`, form, {
          headers: {
            ...form.getHeaders(),
            "x-api-key": this.config["media"]["mediaTokenTicket"],
            "Content-Type": "multipart/form-data",
            accept: "application/vnd.chibisafe.json",
            albumuuid: this.config["media"]["mediaAlbumTicketId"],
          },
        })
        .catch(() => null);

      if (!response && !response?.data) {
        const attachment = new AttachmentBuilder()
          .setFile(transcriptBuffer)
          .setName(`ticket_${inter.channel.name}.html`);
        // Send the transcript in the channel transcript
        channelTranscript
          .send({
            content: this
              .translate`> Transcript du ticket : **${inter.channel.name}**`,
            files: [attachment],
          })
          .then(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiSuccess} Le transcript du ticket a bien été envoyé dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          })
          .catch(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiError} Une erreur est survenue lors de l'envoi du transcript dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          });
      } else {
        // Send the transcript in the channel transcript
        channelTranscript
          .send({
            content: this
              .translate`> Transcript du ticket : **[${inter.channel.name}](${response.data.url})**`,
          })
          .then(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiSuccess} Le transcript du ticket a bien été envoyé dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          })
          .catch(() => {
            msgWait
              .edit({
                content: this
                  .translate`${this.client.emojiError} Une erreur est survenue lors de l'envoi du transcript dans le salon des transcripts des tickets !`,
              })
              .catch(() => null);
          });
      }
    } else if (inter.customId === "close_ticket") {
      const ticketDb = await this.database
        .table("user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });
      const baseTicket = await this.database
        .table("guild_ticket")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });
      if (!baseTicket[0]) return;

      const ticketChoiceType = await this.database
        .table("guild_ticket")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const embed = new EmbedBuilder()
        .setDescription(
          this
            .translate`:warning: **Êtes-vous sûr(e) de vouloir fermer ce ticket ?**`
        )
        .setColor(inter.guild.members.me.displayHexColor);

      const msg = await inter.channel
        .send({
          embeds: [embed],
          components: this.messageFormatter.question(
            `ticket_close_yes`,
            `${this.client.emojiSuccess}`,
            `ticket_close_no`,
            `${this.client.emojiError}`
          ),
        })
        .catch(() => null);

      const filter = (button) => button.user.id === inter.user.id;
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 2 * 60 * 1000,
        componentType: 2,
        max: 1,
      });

      collector.on("collect", async (button) => {
        collector.stop();
        await button.deferUpdate();
        msg.delete().catch(() => null);

        if (button.customId === "ticket_close_yes") {
          const category = ticketChoiceType[0].category_close_id;
          const log = await button.guild.channels.cache.get(
            ticketChoiceType[0].log_id
          );
          const nameTicket = button.guild.channels.cache.get(
            ticketDb[0].ticket_id
          ).name;
          const member = button.guild.members.cache.get(ticketDb[0].user_id);
          const roleTicketOpen = button.guild.roles.cache.get(
            ticketChoiceType[0].role_open_id
          );

          let embed;
          if (member) {
            if (roleTicketOpen)
              await member.roles.remove(roleTicketOpen.id).catch(() => null);
            embed = this.ticket.embedLogTicket(
              "#f10707",
              this
                .translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`,
              member
            );
          } else {
            this.ticket.embedLogTicket(
              "#f10707",
              this
                .translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`
            );
          }

          if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);

          await inter.channel.permissionOverwrites
            .edit(ticketDb[0].user_id, { ViewChannel: false })
            .catch(() => {});
          await inter.channel
            .setParent(category, { lockPermissions: false })
            .catch(() => {});
          await inter.channel.permissionOverwrites.cache.forEach((user) => {
            if (
              user.id === ticketDb[0].user_id ||
              user.id === inter.guild.id ||
              user.id === this.client.user.id
            )
              return;
            if (
              user.id === ticketChoiceType[0].role1_id ||
              user.id === ticketChoiceType[0].role2_id ||
              user.id === ticketChoiceType[0].role3_id
            )
              return;
            user.delete().catch(() => {});
          });

          const embedToSend = new EmbedBuilder()
            .setDescription(
              this.translate`🎫 Quelle action souhaitez-vous faire ? 🎫`
            )
            .setColor("#2f3136");

          const transcriptTicket = new ButtonBuilder()
            .setStyle(1)
            .setLabel(this.translate`Sauvegarder`)
            .setEmoji("💾")
            .setCustomId("transcript_ticket");

          const deleteTicket = new ButtonBuilder()
            .setStyle(4)
            .setLabel(this.translate`Supprimer`)
            .setEmoji("📛")
            .setCustomId("delete_ticket");

          const reopenTicket = new ButtonBuilder()
            .setStyle(3)
            .setLabel(this.translate`Ré ouvrir`)
            .setEmoji("🔓")
            .setCustomId("reopen_ticket");

          const buttonRowMenuAction = new ActionRowBuilder()
            .addComponents(transcriptTicket)
            .addComponents(deleteTicket)
            .addComponents(reopenTicket);

          inter.channel
            .send({ embeds: [embedToSend], components: [buttonRowMenuAction] })
            .catch(() => null);
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ components: null }).catch(() => null);
          return inter.followUp({
            content: this
              .translate`${this.client.emojiError} La commande a expiré !`,
            flags: 64,
          });
        }
      });
    } else if (inter.customId === "reopen_ticket") {
      const ticketDb = await this.database
        .table("user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const category = ticketChoiceType[0].category_id;
      const log = await inter.guild.channels.cache.get(
        ticketChoiceType[0].log_id
      );
      const nameTicket = inter.guild.channels.cache.get(
        ticketDb[0].ticket_id
      ).name;
      const roleTicketOpen = inter.guild.roles.cache.get(
        ticketChoiceType[0].role_open_id
      );

      await inter.channel
        .setParent(category, { lockPermissions: false })
        .catch(() => null);
      await inter.channel.permissionOverwrites
        .edit(ticketDb[0].user_id, { ViewChannel: true })
        .catch(() => null);

      inter
        .followUp({
          content: this
            .translate`${this.client.emojiSuccess} Le ticket a bien été ré-ouvert !`,
          flags: 64,
        })
        .catch(() => null);
      inter.message.delete().catch(() => null);

      const member = inter.guild.members.cache.get(ticketDb[0].user_id);
      let embed;
      if (member) {
        if (roleTicketOpen)
          await member.roles.add(roleTicketOpen.id).catch(() => null);
        embed = this.ticket.embedLogTicket(
          "#BAF60B",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Ré ouverture**\nPar : **${inter.user.displayName}**`,
          member
        );
      } else {
        embed = this.ticket.embedLogTicket(
          "#BAF60B",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Ré ouverture**\nPar : **${inter.user.displayName}**`
        );
      }

      if (log.viewable) await log.send({ embeds: [embed] }).catch(() => null);
    } else if (inter.customId === "delete_ticket") {
      const ticketDb = await this.database
        .table("user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: inter.channel.id });
      const ticketChoiceType = await this.database
        .table("guild_ticket")
        .select()
        .where({
          guild_id: inter.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = this.ticket.checkIfChannelExists(
        inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return inter
          .followUp({
            content: this
              .translate`${this.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const log = await inter.guild.channels.cache.get(
        ticketChoiceType[0].log_id
      );
      const nameTicket = inter.guild.channels.cache.get(
        ticketDb[0].ticket_id
      ).name;
      const member = inter.guild.members.cache.get(ticketDb[0].user_id);

      await this.database
        .table("user_ticket")
        .delete()
        .where({ ticket_id: inter.channel.id })
        .catch(() => null);
      await inter.channel.delete().catch(() => null);

      let embed;
      if (member) {
        embed = this.ticket.embedLogTicket(
          "#f10707",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Suppression**\nPar : **${inter.user.displayName}**`,
          member
        );
      } else {
        embed = this.ticket.embedLogTicket(
          "#f10707",
          this
            .translate`Ticket : **${nameTicket}**\nAction : **Suppression**\nPar : **${inter.user.displayName}**`
        );
      }

      if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);
    }
  }
};
