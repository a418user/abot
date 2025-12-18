const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder, Role } = require("discord.js");

module.exports = class Voice extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "vocal-privé",
      description: "Gérer les salons vocaux temporaires",
      options: [
        {
          name: "add",
          description: "Ajouter un utilisateur/rôle au salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur ou rôle à ajouter",
              type: 9,
              required: true,
            },
          ],
        },
        {
          name: "remove",
          description: "Retirer un utilisateur/rôle du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur ou rôle à retirer",
              type: 9,
              required: true,
            },
          ],
        },
        {
          name: "add-admin",
          description: "Ajouter un administrateur au salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur à ajouter",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "remove-admin",
          description: "Retirer un administrateur du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur à retirer",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "ban",
          description: "Bannir un utilisateur du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur à bannir",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "unban",
          description: "Débannir un utilisateur du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur à débannir",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "hide",
          description: "Cacher le salon vocal",
          type: 1,
          options: [
            {
              name: "channel",
              description: "Salon vocal à cacher",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Salon vocal",
                  value: "vocal",
                },
                {
                  name: "Salon d'attente",
                  value: "waiting",
                },
              ],
            },
          ],
        },
        {
          name: "reveal",
          description: "Afficher le salon vocal",
          type: 1,
          options: [
            {
              name: "channel",
              description: "Salon vocal à afficher",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Salon vocal",
                  value: "vocal",
                },
                {
                  name: "Salon d'attente",
                  value: "waiting",
                },
              ],
            },
          ],
        },
        {
          name: "kick",
          description: "Expulser un utilisateur du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Utilisateur à expulser",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "limit",
          description: "Définir une limite de personnes dans le salon vocal",
          type: 1,
          options: [
            {
              name: "limit",
              description: "Nombre de personnes maximum",
              type: 4,
              required: true,
              min_value: 0,
              max_value: 99,
            },
          ],
        },
        {
          name: "lock",
          description: "Verrouiller le salon vocal",
          type: 1,
          options: [
            {
              name: "channel",
              description: "Salon vocal à verrouiller",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Salon vocal",
                  value: "vocal",
                },
                {
                  name: "Salon d'attente",
                  value: "waiting",
                },
              ],
            },
          ],
        },
        {
          name: "unlock",
          description: "Déverrouiller le salon vocal",
          type: 1,
          options: [
            {
              name: "channel",
              description: "Salon vocal à déverrouiller",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Salon vocal",
                  value: "vocal",
                },
                {
                  name: "Salon d'attente",
                  value: "waiting",
                },
              ],
            },
          ],
        },
        {
          name: "mute",
          description: "Rendre muet tous les membres du salon vocal",
          type: 1,
        },
        {
          name: "unmute",
          description: "Autoriser tous les membres du salon vocal à parler",
          type: 1,
        },
        {
          name: "rename",
          description: "Renommer le salon vocal",
          type: 1,
          options: [
            {
              name: "nom",
              description: "Nouveau nom du salon vocal",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "transfer",
          description: "Transférer la propriété du salon vocal",
          type: 1,
          options: [
            {
              name: "cible",
              description: "Nouveau propriétaire du salon vocal",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "annonce",
          description: "Activer/Désactiver les annonces du salon vocal",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.General,
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const voiceUser = await ctx.database
      .table("user_voice")
      .where("channelId", ctx.channel.id)
      .first();
    if (!voiceUser)
      return ctx.error(
        ctx.translate`Ce salon vocal n'est pas un salon vocal personnalisé !`
      );

    if (ctx.user.id !== voiceUser.ownerId)
      return ctx.error(
        ctx.translate`Vous n'êtes pas le propriétaire de ce salon vocal !`
      );

    const subCommand = ctx.options.getSubcommand();

    const embed = new EmbedBuilder().setColor(ctx.me.displayHexColor);

    if (subCommand === "add") {
      const target = ctx.options.getMentionable("cible");

      let mentionableMembers = JSON.parse(voiceUser.mentionable).members;
      let mentionableRoles = JSON.parse(voiceUser.mentionable).roles;

      if (target instanceof Role) {
        if (mentionableRoles.includes(target.id)) {
          return ctx.error(
            ctx.translate`Ce rôle est déjà ajouté au salon vocal !`
          );
        } else {
          mentionableRoles.push(target.id);

          // Add permissions to the channel
          await ctx.channel.permissionOverwrites
            .create(target.id, { ViewChannel: true })
            .catch(() => null);
        }
      } else {
        if (mentionableMembers.includes(target.id)) {
          return ctx.error(
            ctx.translate`Cet utilisateur est déjà ajouté au salon vocal !`
          );
        } else {
          mentionableMembers.push(target.id);

          // Add permissions to the channel
          await ctx.channel.permissionOverwrites
            .create(target.id, { ViewChannel: true })
            .catch(() => null);
        }
      }

      const message = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (message) {
        await message.edit({
          embeds: [
            ctx.privateRoom.displayEmbed(ctx, {
              mentionable: {
                members: mentionableMembers,
                roles: mentionableRoles,
              },
              membersAdmin: JSON.parse(voiceUser.membersAdmin),
              membersBanned: JSON.parse(voiceUser.membersBanned),
            }),
          ],
          components: ctx.privateRoom.displayButtons({
            isHidden: voiceUser.isHidden,
            isPrivate: voiceUser.isPrivate,
            isMute: voiceUser.isMute,
          }),
        });
      }

      await ctx.database
        .table("user_voice")
        .update({
          mentionable: JSON.stringify({
            members: mentionableMembers,
            roles: mentionableRoles,
          }),
        })
        .where({ channelId: ctx.channel.id });

      const targetLabelAdd =
        target instanceof Role
          ? ctx.translate`Le rôle **${target}**`
          : ctx.translate`L'utilisateur **${target}**`;
      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} ${targetLabelAdd} a été ajouté au salon vocal !`
      );
      return ctx.send({ embeds: [embed] });
    } else if (subCommand === "remove") {
      const target = ctx.options.getMentionable("cible");

      let mentionableMembers = JSON.parse(voiceUser.mentionable).members;
      let mentionableRoles = JSON.parse(voiceUser.mentionable).roles;

      if (target instanceof Role) {
        if (!mentionableRoles.includes(target.id)) {
          return ctx.error(
            ctx.translate`Ce rôle n'est pas ajouté au salon vocal !`
          );
        } else {
          mentionableRoles = mentionableRoles.filter((id) => id !== target.id);

          // Remove permissions from the channel
          await ctx.channel.permissionOverwrites
            .delete(target.id)
            .catch(() => null);
        }
      } else {
        if (!mentionableMembers.includes(target.id)) {
          return ctx.error(
            ctx.translate`Cet utilisateur n'est pas ajouté au salon vocal !`
          );
        } else {
          mentionableMembers = mentionableMembers.filter(
            (id) => id !== target.id
          );

          // Remove permissions from the channel
          await ctx.channel.permissionOverwrites
            .delete(target.id)
            .catch(() => null);
        }
      }

      const message = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (message) {
        await message.edit({
          embeds: [
            ctx.privateRoom.displayEmbed(ctx, {
              mentionable: {
                members: mentionableMembers,
                roles: mentionableRoles,
              },
              membersAdmin: JSON.parse(voiceUser.membersAdmin),
              membersBanned: JSON.parse(voiceUser.membersBanned),
            }),
          ],
          components: ctx.privateRoom.displayButtons({
            isHidden: voiceUser.isHidden,
            isPrivate: voiceUser.isPrivate,
            isMute: voiceUser.isMute,
          }),
        });
      }

      await ctx.database
        .table("user_voice")
        .update({
          mentionable: JSON.stringify({
            members: mentionableMembers,
            roles: mentionableRoles,
          }),
        })
        .where({ channelId: ctx.channel.id });

      const targetLabelRemove =
        target instanceof Role
          ? ctx.translate`Le rôle **${target}**`
          : ctx.translate`L'utilisateur **${target}**`;
      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} ${targetLabelRemove} a été retiré du salon vocal !`
      );
      return ctx.send({ embeds: [embed] });
    } else if (subCommand === "add-admin") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // Get the list of the members admins of the voice channel
      const membersAdmin = JSON.parse(voiceUser.membersAdmin);
      const isAdmin = membersAdmin.includes(member.id);
      if (isAdmin)
        return ctx.error(
          ctx.translate`Ce membre est déjà administrateur du salon vocal !`
        );

      // Add the member to the list of the members admins of the voice channel
      membersAdmin.push(member.id);

      await ctx.database
        .table("user_voice")
        .update({ membersAdmin: JSON.stringify(membersAdmin) })
        .where({ channelId: ctx.channel.id });

      // Edit the permissions
      await ctx.channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        Connect: true,
        ManageChannels: true,
        ManageRoles: true,
        Speak: true,
      });

      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} L'utilisateur ${member} a été ajouté en tant qu'administrateur du salon vocal !`
      );
      await ctx.send({ embeds: [embed] });

      // Edit the message
      const msg = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (!msg || msg.size > 1) return;

      await msg.edit({
        embeds: [
          ctx.privateRoom.displayEmbed(ctx, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: membersAdmin,
            membersBanned: JSON.parse(voiceUser.membersBanned),
          }),
        ],
      });
    } else if (subCommand === "remove-admin") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // Get the list of the members admins of the voice channel
      const membersAdmin = JSON.parse(voiceUser.membersAdmin);
      const isAdmin = membersAdmin.includes(member.id);
      if (!isAdmin)
        return ctx.error(
          ctx.translate`Ce membre n'est pas administrateur du salon vocal !`
        );

      // Remove the member from the list of the members admins of the voice channel
      membersAdmin.splice(membersAdmin.indexOf(member.id), 1);

      await ctx.database
        .table("user_voice")
        .update({ membersAdmin: JSON.stringify(membersAdmin) })
        .where({ channelId: ctx.channel.id });

      // Edit the permissions
      await ctx.channel.permissionOverwrites.delete(member);

      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} L'utilisateur ${member} a été retiré du rôle d'administrateur du salon vocal !`
      );
      await ctx.send({ embeds: [embed] });

      // Edit the message
      const msg = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (!msg || msg.size > 1) return;

      await msg.edit({
        embeds: [
          ctx.privateRoom.displayEmbed(ctx, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: membersAdmin,
            membersBanned: JSON.parse(voiceUser.membersBanned),
          }),
        ],
      });
    } else if (subCommand === "ban") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // Get the list of the members banned from the voice channel
      const membersBanned = JSON.parse(voiceUser.membersBanned);
      const isBanned = membersBanned.includes(member.id);
      if (isBanned)
        return ctx.error(
          ctx.translate`Ce membre est déjà banni du salon vocal !`
        );

      // Add the member to the list of the members banned from the voice channel
      membersBanned.push(member.id);

      await ctx.database
        .table("user_voice")
        .update({ membersBanned: JSON.stringify(membersBanned) })
        .where({ channelId: ctx.channel.id });

      // Kick the member from the voice channel
      if (ctx.channel.members.has(member.id)) {
        await member.voice.disconnect().catch(() => null);
      }

      // Ban the member from the voice channel
      await ctx.channel.permissionOverwrites
        .edit(member, { Connect: false })
        .then(async () => {
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} L'utilisateur ${member} a été banni du salon vocal !`
          );
          await ctx.send({ embeds: [embed] });
        })
        .catch(async () => {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Une erreur est survenue lors du bannissement de ${member} du salon vocal !`
          );
          await ctx.send({ embeds: [embed] });
        });

      // Get the waiting channel
      const waitingChannel = ctx.getChannel(voiceUser.channelWaitingId);
      if (waitingChannel) {
        await waitingChannel.permissionOverwrites.edit(member, {
          Connect: false,
        });
      }

      // Edit the message
      const msg = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (!msg || msg.size > 1) return;

      await msg.edit({
        embeds: [
          ctx.privateRoom.displayEmbed(ctx, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: JSON.parse(voiceUser.membersAdmin),
            membersBanned: membersBanned,
          }),
        ],
      });
    } else if (subCommand === "unban") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // Get the list of the members banned from the voice channel
      const membersBanned = JSON.parse(voiceUser.membersBanned);
      const isBanned = membersBanned.includes(member.id);
      if (!isBanned)
        return ctx.error(
          ctx.translate`Ce membre n'est pas banni du salon vocal !`
        );

      // Remove the member from the list of the members banned from the voice channel
      membersBanned.splice(membersBanned.indexOf(member.id), 1);

      await ctx.database
        .table("user_voice")
        .update({ membersBanned: JSON.stringify(membersBanned) })
        .where({ channelId: ctx.channel.id });

      await ctx.channel.permissionOverwrites
        .delete(member)
        .then(async () => {
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} L'utilisateur ${member} a été débanni du salon vocal !`
          );
          await ctx.send({ embeds: [embed] });
        })
        .catch(async () => {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Une erreur est survenue lors du débannissement de ${member} du salon vocal !`
          );
          await ctx.send({ embeds: [embed] });
        });

      // Get the waiting channel
      const waitingChannel = ctx.getChannel(voiceUser.channelWaitingId);
      if (waitingChannel) {
        await waitingChannel.permissionOverwrites.delete(member);
      }

      // Edit the message
      const msg = await ctx.channel.messages
        .fetch(voiceUser.messageId)
        .catch(() => null);
      if (!msg || msg.size > 1) return;

      await msg.edit({
        embeds: [
          ctx.privateRoom.displayEmbed(ctx, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: JSON.parse(voiceUser.membersAdmin),
            membersBanned: membersBanned,
          }),
        ],
      });
    } else if (subCommand === "hide") {
      const channel = ctx.options.getString("channel");

      if (channel === "vocal") {
        if (voiceUser.isHidden) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon vocal est déjà caché !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          await ctx.channel.permissionOverwrites.edit(
            ctx.guild.roles.everyone,
            { ViewChannel: false }
          );

          await ctx.database
            .table("user_voice")
            .update({ isHidden: true })
            .where({ channelId: ctx.channel.id });

          const visibilityText = voiceUser.isHidden
            ? ctx.translate`visible`
            : ctx.translate`invisible`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon vocal est désormais ${visibilityText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      } else {
        if (voiceUser.isHiddenWaiting) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon d'attente est déjà caché !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          const channelWaiting = ctx.getChannel(voiceUser.channelWaitingId);
          if (channelWaiting)
            await channelWaiting.permissionOverwrites.edit(
              ctx.guild.roles.everyone,
              { ViewChannel: false }
            );

          await ctx.database
            .table("user_voice")
            .update({ isHiddenWaiting: true })
            .where({ channelId: ctx.channel.id });

          const waitingVisibilityText = voiceUser.isHiddenWaiting
            ? ctx.translate`visible`
            : ctx.translate`invisible`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon d'attente est désormais ${waitingVisibilityText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      }
    } else if (subCommand === "reveal") {
      const channel = ctx.options.getString("channel");

      if (channel === "vocal") {
        if (!voiceUser.isHidden) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon vocal n'est pas caché !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          await ctx.channel.permissionOverwrites.edit(
            ctx.guild.roles.everyone,
            { ViewChannel: true }
          );

          await ctx.database
            .table("user_voice")
            .update({ isHidden: false })
            .where({ channelId: ctx.channel.id });

          const visibilityText = voiceUser.isHidden
            ? ctx.translate`visible`
            : ctx.translate`invisible`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon vocal est désormais ${visibilityText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      } else {
        if (!voiceUser.isHiddenWaiting) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon d'attente n'est pas caché !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          const channelWaiting = ctx.getChannel(voiceUser.channelWaitingId);
          if (channelWaiting)
            await channelWaiting.permissionOverwrites.edit(
              ctx.guild.roles.everyone,
              { ViewChannel: true }
            );

          await ctx.database
            .table("user_voice")
            .update({ isHiddenWaiting: false })
            .where({ channelId: ctx.channel.id });

          const waitingVisibilityText = voiceUser.isHiddenWaiting
            ? ctx.translate`visible`
            : ctx.translate`invisible`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon d'attente est désormais ${waitingVisibilityText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      }
    } else if (subCommand === "kick") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      if (!ctx.channel.members.has(member.id))
        return ctx.error(
          ctx.translate`Ce membre n'est pas dans le salon vocal !`
        );

      await member.voice
        .disconnect()
        .then(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} ${member} a été expulsé du salon vocal !`
          );
          return ctx.send({ embeds: [embed] });
        })
        .catch(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Une erreur est survenue lors de l'expulsion de ${member} du salon vocal !`
          );
          return ctx.send({ embeds: [embed] });
        });
    } else if (subCommand === "limit") {
      const limit = ctx.options.getInteger("limit");

      await ctx.channel
        .setUserLimit(limit)
        .then(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} La limite du salon vocal a été définie à \`${limit}\` !`
          );
          return ctx.send({ embeds: [embed] });
        })
        .catch(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Une erreur est survenue lors de la définition de la limite du salon vocal !`
          );
          return ctx.send({ embeds: [embed] });
        });
    } else if (subCommand === "lock") {
      const channel = ctx.options.getString("channel");

      if (channel === "vocal") {
        if (voiceUser.isPrivate) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon vocal est déjà verrouillé !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          await ctx.channel.permissionOverwrites.edit(
            ctx.guild.roles.everyone,
            { Connect: false }
          );

          await ctx.database
            .table("user_voice")
            .update({ isPrivate: true })
            .where({ channelId: ctx.channel.id });

          const privateStateText = voiceUser.isPrivate
            ? ctx.translate`public`
            : ctx.translate`privé`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon vocal est désormais ${privateStateText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      } else {
        if (voiceUser.isPrivateWaiting) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon d'attente est déjà verrouillé !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          const channelWaiting = ctx.getChannel(voiceUser.channelWaitingId);
          if (channelWaiting)
            await channelWaiting.permissionOverwrites.edit(
              ctx.guild.roles.everyone,
              { Connect: false }
            );

          await ctx.database
            .table("user_voice")
            .update({ isPrivateWaiting: true })
            .where({ channelId: ctx.channel.id });

          const privateWaitingText = voiceUser.isPrivateWaiting
            ? ctx.translate`public`
            : ctx.translate`privé`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon d'attente est désormais ${privateWaitingText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      }
    } else if (subCommand === "unlock") {
      const channel = ctx.options.getString("channel");

      if (channel === "vocal") {
        if (!voiceUser.isPrivate) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon vocal n'est pas verrouillé !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          await ctx.channel.permissionOverwrites.edit(
            ctx.guild.roles.everyone,
            { Connect: true }
          );

          await ctx.database
            .table("user_voice")
            .update({ isPrivate: false })
            .where({ channelId: ctx.channel.id });

          const privateStateText = voiceUser.isPrivate
            ? ctx.translate`public`
            : ctx.translate`privé`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon vocal est désormais ${privateStateText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      } else {
        if (!voiceUser.isPrivateWaiting) {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Le salon d'attente n'est pas verrouillé !`
          );

          return ctx.send({ embeds: [embed] });
        } else {
          const channelWaiting = ctx.getChannel(voiceUser.channelWaitingId);
          if (channelWaiting)
            await channelWaiting.permissionOverwrites.edit(
              ctx.guild.roles.everyone,
              { Connect: true }
            );

          await ctx.database
            .table("user_voice")
            .update({ isPrivateWaiting: false })
            .where({ channelId: ctx.channel.id });

          const privateWaitingText = voiceUser.isPrivateWaiting
            ? ctx.translate`public`
            : ctx.translate`privé`;
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon d'attente est désormais ${privateWaitingText} !`
          );

          return ctx.send({ embeds: [embed] });
        }
      }
    } else if (subCommand === "mute") {
      if (voiceUser.isMute) {
        embed.setDescription(
          ctx.translate`${ctx.emojiError} Le salon vocal est déjà muté !`
        );

        return ctx.send({ embeds: [embed] });
      } else {
        await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, {
          Speak: false,
        });

        await ctx.database
          .table("user_voice")
          .update({ isMute: true })
          .where({ channelId: ctx.channel.id });

        const muteStateText = voiceUser.isMute
          ? ctx.translate`démuté`
          : ctx.translate`muté`;
        embed.setDescription(
          ctx.translate`${ctx.emojiSuccess} Le salon vocal a été ${muteStateText} !`
        );

        return ctx.send({ embeds: [embed] });
      }
    } else if (subCommand === "unmute") {
      if (!voiceUser.isMute) {
        embed.setDescription(
          ctx.translate`${ctx.emojiError} Le salon vocal n'est pas muté !`
        );

        return ctx.send({ embeds: [embed] });
      } else {
        await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, {
          Speak: true,
        });

        await ctx.database
          .table("user_voice")
          .update({ isMute: false })
          .where({ channelId: ctx.channel.id });

        const muteStateText = voiceUser.isMute
          ? ctx.translate`démuté`
          : ctx.translate`muté`;
        embed.setDescription(
          ctx.translate`${ctx.emojiSuccess} Le salon vocal a été ${muteStateText} !`
        );

        return ctx.send({ embeds: [embed] });
      }
    } else if (subCommand === "rename") {
      const name = ctx.options.getString("nom");

      await ctx.channel
        .setName(name)
        .then(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiSuccess} Le salon vocal a été renommé !`
          );
          return ctx.send({ embeds: [embed] });
        })
        .catch(() => {
          embed.setDescription(
            ctx.translate`${ctx.emojiError} Une erreur est survenue lors du renommage du salon vocal !`
          );
          return ctx.send({ embeds: [embed] });
        });
    } else if (subCommand === "transfer") {
      const member = ctx.options.getMember("cible");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );

      // If the member is already the owner of the voice channel
      if (member.id === voiceUser.ownerId)
        return ctx.error(
          ctx.translate`Ce membre est déjà propriétaire du salon vocal !`
        );

      // If the member is a bot
      if (member.user.bot)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas transférer la propriété du salon vocal à un bot !`
        );

      // Edit permissions
      const permissionOverwrites = ctx.channel.permissionOverwrites.cache.map(
        (permission) => {
          if (permission.id === voiceUser.ownerId) {
            permission.id = member.id;
          }

          return permission;
        }
      );

      await ctx.channel.permissionOverwrites.set(permissionOverwrites);

      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} La propriété du salon vocal a été transférée à ${member} !`
      );

      await ctx.send({ embeds: [embed] });

      const msg = await ctx.channel.send({
        content: `${member}`,
        embeds: [
          ctx.privateRoom.displayEmbed(ctx, {
            mentionable: JSON.parse(voiceUser.mentionable),
            membersAdmin: JSON.parse(voiceUser.membersAdmin),
            membersBanned: JSON.parse(voiceUser.membersBanned),
          }),
        ],
        components: ctx.privateRoom.displayButtons({
          isHidden: voiceUser.isHidden,
          isPrivate: voiceUser.isPrivate,
          isMute: voiceUser.isMute,
        }),
      });

      await ctx.database
        .table("user_voice")
        .update({
          ownerId: member.id,
          messageId: msg.id,
        })
        .where({ channelId: ctx.channel.id });
    } else if (subCommand === "annonce") {
      await ctx.database
        .table("user_voice")
        .update({ isAnnounce: !voiceUser.isAnnounce })
        .where({ channelId: ctx.channel.id });

      const announceStateText = voiceUser.isAnnounce
        ? ctx.translate`désactivées`
        : ctx.translate`activées`;
      embed.setDescription(
        ctx.translate`${ctx.emojiSuccess} Les annonces du salon vocal ont été ${announceStateText} !`
      );

      return ctx.send({ embeds: [embed] });
    }
  }
};
