const SlashCommand = require("../../managers/structures/SlashCommands.js");
const ms = require("ms");
const { EmbedBuilder } = require("discord.js");

module.exports = class Mute extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "mute",
      description: "Gérer les mute",
      options: [
        {
          name: "ajouter",
          description: "Muter un membre",
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à muter",
              type: 6,
              required: true,
            },
            {
              name: "temps",
              description: "Temps du mute (1s/1m/1h/1d)",
              type: 3,
              required: true,
            },
            {
              name: "raison",
              description: "Raison du mute",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "retirer",
          description: `Unmute un membre`,
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à unmute",
              type: 6,
              required: true,
            },
          ],
        },
        {
          name: "check",
          description: `Afficher le temps du mute d'un membre`,
          type: 1,
          options: [
            {
              name: "membre",
              description: "Membre à check",
              type: 6,
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ModerateMembers"],
      bot_permissions: ["ModerateMembers", "EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "ajouter") {
      const member = ctx.options.getMember("membre");
      const time = ctx.options.getString("temps");
      const reason = ctx.options.getString("raison");

      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );
      if (member.isCommunicationDisabled())
        return ctx.error(ctx.translate`Ce membre est déjà exclu !`);

      if (!member.moderatable)
        return ctx.error(ctx.translate`Je ne peux pas exclure ce membre !`);
      if (member.id === ctx.user.id)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas vous exclure vous même !`
        );
      if (member.id === ctx.client.user.id)
        return ctx.error(ctx.translate`Vous ne pouvez pas m'exclure !`);
      if (member.id === ctx.guild.ownerId)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas exclure le propriétaire du serveur !`
        );

      if (
        member.roles.highest.position >=
        ctx.guild.members.me.roles.highest.position
      )
        return ctx.error(ctx.translate`Je ne peux pas exclure ce membre !`);
      if (
        member.roles.highest.position >= ctx.member.roles.highest.position &&
        ctx.user.id !== ctx.guild.ownerId
      )
        return ctx.error(
          ctx.translate`Vous ne pouvez pas exclure ce membre car il est plus haut hiérarchiquement !`
        );

      const timeInMs = ms(time);
      if (!timeInMs)
        return ctx.error(ctx.translate`Le temps indiqué est incorrect !`);
      if (timeInMs > 604800000)
        return ctx.error(
          ctx.translate`Veuillez indiquer une durée de 7 jours ou moins ! \`(1s/m/h/d)\``
        );

      let muteReason = reason;
      if (!muteReason) muteReason = ctx.translate`Aucune raison donnée`;

      try {
        await member.timeout(timeInMs, muteReason);
      } catch {
        return ctx.error(ctx.translate`Je ne peux pas exclure ce membre !`);
      }

      try {
        member.send(
          ctx.translate`Vous avez été mute sur le serveur **${ctx.guild.name}** pour **${muteReason}** pendant **${time}** !`
        );
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setTitle(ctx.translate`Mute`)
        .setDescription(
          ctx.translate`**${member.user.displayName}** a été mute par \`${
            ctx.user.displayName
          }\` jusqu'au <t:${Math.floor(
            (Date.now() + timeInMs) / 1000
          )}:f> pour **${muteReason}** !`
        );

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "retirer") {
      const member = ctx.options.getMember("membre");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );
      if (!member.isCommunicationDisabled())
        return ctx.error(ctx.translate`Ce membre n'est pas exclu !`);

      if (!member.moderatable)
        return ctx.error(ctx.translate`Je ne peux pas exclure ce membre !`);
      if (member.id === ctx.user.id)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas vous exclure vous même !`
        );
      if (member.id === ctx.client.user.id)
        return ctx.error(ctx.translate`Vous ne pouvez pas m'exclure !`);
      if (member.id === ctx.guild.ownerId)
        return ctx.error(
          ctx.translate`Vous ne pouvez pas exclure le propriétaire du serveur !`
        );

      if (
        member.roles.highest.position >=
        ctx.guild.members.me.roles.highest.position
      )
        return ctx.error(ctx.translate`Je ne peux pas exclure ce membre !`);
      if (
        member.roles.highest.position >= ctx.member.roles.highest.position &&
        ctx.user.id !== ctx.guild.ownerId
      )
        return ctx.error(
          ctx.translate`Vous ne pouvez pas exclure ce membre car il est plus haut hiérarchiquement !`
        );

      try {
        await member.timeout(null);
      } catch {
        return ctx.error(ctx.translate`Je ne peux pas dé-exclure ce membre !`);
      }

      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setTitle(ctx.translate`Unmute`)
        .setDescription(
          ctx.translate`**${member.user.displayName}** a été unmute par \`${ctx.user.displayName}\` !`
        );

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "check") {
      const member = ctx.options.getMember("membre");
      if (!member)
        return ctx.error(
          ctx.translate`Ce membre n'est pas présent sur le serveur !`
        );
      if (!member.isCommunicationDisabled())
        return ctx.error(ctx.translate`Ce membre n'est pas exclu !`);

      ctx.send({
        content: ctx.translate`**${
          member.user.displayName
        }** ne sera plus mute <t:${(
          member.communicationDisabledUntilTimestamp / 1000
        ).toFixed()}:R> !`,
      });
    }
  }
};
