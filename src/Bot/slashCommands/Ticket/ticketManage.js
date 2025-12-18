const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = class Ticket extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "ticket",
      description: "Gérer les tickets",
      options: [
        {
          name: "add",
          description: "Ajouter un membre au ticket",
          type: 1,
          options: [
            {
              name: "member",
              type: 6,
              description: "Membre à ajouter au ticket",
              required: true,
            },
          ],
        },
        {
          name: "remove",
          description: "Retirer un membre du ticket",
          type: 1,
          options: [
            {
              name: "member",
              type: 6,
              description: "Membre à retirer du ticket",
              required: true,
            },
          ],
        },
        {
          name: "rename",
          description: "Renommer un ticket",
          type: 1,
          options: [
            {
              name: "name",
              description: "Nouveau nom du ticket",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "close",
          description: "Fermer un ticket",
          type: 1,
        },
        {
          name: "claim",
          description: "Attribuer un ticket",
          type: 1,
          options: [
            {
              name: "member-1",
              type: 6,
              description: "Membre à attribuer le ticket",
              required: true,
            },
            {
              name: "member-2",
              type: 6,
              description: "Membre à attribuer le ticket",
              required: false,
            },
            {
              name: "member-3",
              type: 6,
              description: "Membre à attribuer le ticket",
              required: false,
            },
            {
              name: "member-4",
              type: 6,
              description: "Membre à attribuer le ticket",
              required: false,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Ticket,
      subCommand: true,
      aliases: ["add", "remove", "move", "rename", "close", "claim"],
      user_permissions: ["ManageMessages"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const checkCategory = await ctx.ticket.checkIfCommandIsInValidChannel(
      ctx,
      "guild_ticket"
    );
    const checkCategory2 = await ctx.ticket.checkIfCommandIsInValidChannel(
      ctx,
      "guild_ticket_menu"
    );
    if (
      typeof checkCategory !== "boolean" &&
      typeof checkCategory2 !== "boolean"
    )
      return ctx.send({ content: checkCategory, flags: 64 });

    const isMenu = checkCategory2 === true;

    if (subCommand === "add") {
      const member = ctx.options.getMember("member");
      if (!member)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Ce membre n'est pas présent sur le serveur !`,
          flags: 64,
        });

      let hasMember = false;
      ctx.channel.permissionOverwrites.cache.forEach((perm) => {
        if (perm.id === member.id) hasMember = true;
      });

      if (hasMember)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Le membre est déjà dans le ticket !`,
          flags: 64,
        });

      ctx.channel.permissionOverwrites
        .edit(member.id, { ViewChannel: true, SendMessages: true })
        .then(() => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiSuccess} ${member.user} vient d'être ajouté au ticket !`,
          });
        })
        .catch((err) => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiError} Une erreur est survenue lors de l'ajout du membre ${member.user} au ticket !\n${err}`,
            flags: 64,
          });
        });
    } else if (subCommand === "remove") {
      const member = ctx.options.getMember("member");
      if (!member)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Ce membre n'est pas présent sur le serveur !`,
          flags: 64,
        });

      let hasMember = false;
      ctx.channel.permissionOverwrites.cache.forEach((perm) => {
        if (perm.id === member.id) hasMember = true;
      });

      if (!hasMember)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Le membre n'est pas dans le ticket !`,
          flags: 64,
        });

      ctx.channel.permissionOverwrites
        .delete(member.id)
        .then(() => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiSuccess} ${member.user} vient d'être retiré au ticket !`,
          });
        })
        .catch((err) => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiError} Une erreur est survenue lors du retrait du membre ${member.user} au ticket !\n${err}`,
            flags: 64,
          });
        });
    } else if (subCommand === "rename") {
      const name = ctx.options.getString("name").replace(" ", "-");
      if (name.length > 100)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Le nom du ticket ne doit pas dépasser 100 caractères !`,
          flags: 64,
        });

      const oldName = ctx.channel.name;

      await ctx.channel
        .setName(`${name.toLowerCase()}`)
        .then(async () => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiSuccess} Le nom du ticket a été changé en \`${name}\` !`,
          });

          const ticketDb = await ctx.database
            .table(isMenu ? "user_ticket_menu" : "user_ticket")
            .select("choice_type", "ticket_id", "user_id")
            .where({ ticket_id: ctx.channel.id });
          const ticketChoiceType = await ctx.database
            .table(isMenu ? "guild_ticket_menu" : "guild_ticket")
            .select()
            .where({
              guild_id: ctx.guild.id,
              choice_type: ticketDb[0].choice_type,
            });
          const nameTicket = ctx.guild.channels.cache.get(
            ticketDb[0].ticket_id
          ).name;
          const log = await ctx.guild.channels.cache.get(
            ticketChoiceType[0].log_id
          );
          const member = ctx.getMember(ticketDb[0].user_id);

          let embed;
          if (member) {
            embed = ctx.ticket.embedLogTicket(
              "#BAF60B",
              ctx.translate`Ticket : **${nameTicket}**\nAction : **Renommage**\nPar : **${ctx.user.displayName}**\nAncien nom : **${oldName}**`,
              member
            );
          } else {
            ctx.ticket.embedLogTicket(
              "#BAF60B",
              ctx.translate`Ticket : **${nameTicket}**\nAction : **Renommage**\nPar : **${ctx.user.displayName}**\nAncien nom : **${oldName}**`
            );
          }

          if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);
        })
        .catch((err) => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiError} Une erreur est survenue lors du changement de nom du ticket !\n${err}`,
            flags: 64,
          });
        });
    } else if (subCommand === "close") {
      const ticketDb = await ctx.database
        .table(isMenu ? "user_ticket_menu" : "user_ticket")
        .select("choice_type", "ticket_id", "user_id")
        .where({ ticket_id: ctx.channel.id });
      if (!ticketDb[0])
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Ce ticket n'existe pas !`,
          flags: 64,
        });

      const ticketChoiceType = await ctx.database
        .table(isMenu ? "guild_ticket_menu" : "guild_ticket")
        .select()
        .where({
          guild_id: ctx.guild.id,
          choice_type: ticketDb[0].choice_type,
        });

      const checkIfChannelExists = ctx.ticket.checkIfChannelExists(
        ctx.inter,
        ticketChoiceType[0]
      );
      if (!checkIfChannelExists)
        return ctx
          .send({
            content: ctx.translate`${ctx.client.emojiError} Le système de tickets n'est pas correctement paramétré ! Veuillez vérifier la configuration !`,
            flags: 64,
          })
          .catch(() => null);

      const embed = new EmbedBuilder()
        .setDescription(
          ctx.translate`:warning: **Êtes-vous sur de vouloir fermer ce ticket ?**`
        )
        .setColor("#2f3136");

      const msg = await ctx
        .send({
          embeds: [embed],
          components: ctx.messageFormatter.question(
            `ticket_close_yes`,
            `${ctx.client.emojiSuccess}`,
            `ticket_close_no`,
            `${ctx.client.emojiError}`
          ),
        })
        .catch(() => null);

      const filter = (button) => button.user.id === ctx.user.id;
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
          const log = await ctx.guild.channels.cache.get(
            ticketChoiceType[0].log_id
          );
          const nameTicket = ctx.guild.channels.cache.get(
            ticketDb[0].ticket_id
          ).name;
          const rolesAccess = JSON.parse(ticketChoiceType[0].roles_access);
          const member = ctx.getMember(ticketDb[0].user_id);

          let embed;
          if (member) {
            embed = ctx.ticket.embedLogTicket(
              "#f10707",
              ctx.translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`,
              member
            );
          } else {
            ctx.ticket.embedLogTicket(
              "#f10707",
              ctx.translate`Ticket : **${nameTicket}**\nAction : **Fermeture**\nPar : **${button.user.displayName}**`
            );
          }

          if (log.viewable) log.send({ embeds: [embed] }).catch(() => null);

          await ctx.channel.permissionOverwrites
            .edit(ticketDb[0].user_id, { ViewChannel: false })
            .catch(() => {});
          await ctx.channel
            .setParent(category, { lockPermissions: false })
            .catch(() => {});
          await ctx.channel.permissionOverwrites.cache.forEach((user) => {
            if (
              user.id !== ticketDb[0].user_id &&
              user.id !== ctx.guild.id &&
              user.id !== ctx.client.user.id &&
              !rolesAccess.includes(user.id)
            ) {
              user.delete().catch(() => null);
            }
          });

          const embedToSend = new EmbedBuilder()
            .setDescription(
              ctx.translate`\uD83C\uDFAB Quelle action souhaitez-vous faire ? \uD83C\uDFAB`
            )
            .setColor("#2f3136");

          const transcriptTicket = new ButtonBuilder()
            .setStyle(1)
            .setLabel(ctx.translate`Sauvegarder`)
            .setEmoji("💾")
            .setCustomId(
              isMenu ? "transcript_ticket_menu" : "transcript_ticket"
            );

          const deleteTicket = new ButtonBuilder()
            .setStyle(4)
            .setLabel(ctx.translate`Supprimer`)
            .setEmoji("📛")
            .setCustomId(isMenu ? "delete_ticket_menu" : "delete_ticket");

          const reopenTicket = new ButtonBuilder()
            .setStyle(3)
            .setLabel(ctx.translate`Ré ouvrir`)
            .setEmoji("🔓")
            .setCustomId(isMenu ? "reopen_ticket_menu" : "reopen_ticket");

          const buttonRowMenuAction = new ActionRowBuilder()
            .addComponents(transcriptTicket)
            .addComponents(deleteTicket)
            .addComponents(reopenTicket);

          ctx.channel
            .send({ embeds: [embedToSend], components: [buttonRowMenuAction] })
            .catch(() => null);
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ components: null }).catch(() => null);
          return ctx.send({
            content: ctx.translate`${ctx.client.emojiError} La commande a expiré !`,
            flags: 64,
          });
        }
      });
    } else if (subCommand === "claim") {
      if (ctx.channel.topic !== null)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Le ticket a déjà été attribué !`,
          flags: 64,
        });

      const member1 = ctx.options.getMember("member-1");
      const member2 = ctx.options.getMember("member-2");
      const member3 = ctx.options.getMember("member-3");
      const member4 = ctx.options.getMember("member-4");

      let membersMap = [];
      if (member1) membersMap.push(member1.user.displayName);
      if (member2) membersMap.push(member2.user.displayName);
      if (member3) membersMap.push(member3.user.displayName);
      if (member4) membersMap.push(member4.user.displayName);

      if (membersMap.length === 0)
        return ctx.send({
          content: ctx.translate`${ctx.client.emojiError} Aucun des membres donnés n'est présent sur le serveur !`,
          flags: 64,
        });

      const members = membersMap.join(", ");

      ctx.channel
        .setTopic(ctx.translate`Ticket géré par : ${members}`)
        .then(() => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiSuccess} Ce ticket est maintenant géré par **${members}** !`,
          });
        })
        .catch((err) => {
          ctx.send({
            content: ctx.translate`${ctx.client.emojiError} Une erreur est survenue lors de l'attribution du ticket !\n${err}`,
            flags: 64,
          });
        });
    }
  }
};
