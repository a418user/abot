const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class setMessage extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "level-up-message",
      description: "Paramétrer le message de level-up",
      options: [
        {
          type: 1,
          name: "create",
          description: "Créer un nouveau message de level-up",
          options: [
            {
              type: 7,
              name: "channel",
              description: "Le salon où le message de level-up sera envoyé",
              channel_types: [0],
            },
            {
              type: 3,
              name: "text",
              description: "Le message qui sera envoyé",
            },
          ],
        },
        {
          type: 1,
          name: "variables",
          description: "Voir toutes les variables disponibles",
        },
        {
          type: 1,
          name: "view",
          description: "Voir le message de level-up actuel",
        },
        {
          type: 1,
          name: "remove",
          description: "Supprimer le message de level-up actuel",
        },
      ],
      category: SlashCommand.Categories.Levels,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    const settings = await ctx.database
      .table("guild_levels")
      .select()
      .where("guildId", ctx.guild.id);
    const levelingSettings = settings[0]
      ? JSON.parse(settings[0].leveling)
      : {};

    const formatPreview = (template) => {
      const baseMessage =
        template ||
        ctx.translate`Félicitations {user} ! Tu viens juste de passer niveaux **{level}** ! :tada:`;
      return baseMessage
        .replace(/{user.username}/gim, ctx.user.username)
        .replace(/{user.mention}/gim, ctx.user.toString())
        .replace(/{member.nickname}/gim, ctx.member.displayName)
        .replace(/{server}/gim, ctx.guild.name)
        .replace(/{xp}/gim, 0)
        .replace(/{level}/gim, 0);
    };

    if (subCommand === "view") {
      const messagePreview = formatPreview(levelingSettings.message);

      const embed = new EmbedBuilder()
        .setTitle(ctx.translate`Les niveaux`)
        .setDescription(
          ctx.translate`Merci de faire un choix dans le menu pour configurer les messages de niveaux.`
        )
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .addFields([
          {
            name: ctx.translate`Salon`,
            value: levelingSettings.channel
              ? ctx.getChannel(levelingSettings.channel)
                ? ctx.getChannel(levelingSettings.channel).toString()
                : ctx.translate`${ctx.emojiError} Salon supprimé`
              : ctx.translate`${ctx.emojiError} Salon où les messages sont envoyés.`,
          },
          {
            name: ctx.translate`Message`,
            value: `\u007F${messagePreview}\u007F`,
          },
        ]);

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "create") {
      const channel = ctx.options.getChannel("channel");
      const text = ctx.options.getString("text");

      /* Add the channel identifier to the leveling settings. */
      if (channel) levelingSettings.channel = channel.id;

      /* Add the message to the leveling settings. */
      if (text) levelingSettings.message = text;

      /* If no channel is provided, set the default channel */
      if (!channel && levelingSettings.channel) delete levelingSettings.channel;

      /* If no message is provided, set the default message */
      if (!text && levelingSettings.message) delete levelingSettings.message;

      /* Get all the variables available */
      const variableList = [
        "{user.username}",
        "{user.mention}",
        "{member.nickname}",
        "{server}",
        "{xp}",
        "{level}",
      ];
      const variablesExample = "`" + variableList.join("`, `") + "`";
      let message = null;

      /* Check if there is at least one variable in the message */
      if (text && !variableList.some((variable) => text.includes(variable))) {
        return ctx.error(
          ctx.translate`Le message doit contenir au minimum une variable comme : ${variablesExample} !`
        );
      }

      /* Check if there is a mention everyone or here */
      if (text && (text.includes("@everyone") || text.includes("@here"))) {
        const embedConfirmation = new EmbedBuilder()
          .setDescription(
            ctx.translate`:information_source: Êtes-vous sur de vouloir mentionner \`@everyone\` ou \`@here\` dans votre message de passage de niveaux ?`
          )
          .setColor(ctx.colors.blue)
          .setFooter({
            text: "abot",
            iconURL: ctx.client.user.displayAvatarURL(),
          });

        /* Send a confirmation message */
        message = await ctx.send({
          embeds: [embedConfirmation],
          components: ctx.messageFormatter.question(
            `yes`,
            `${ctx.emojiSuccess}`,
            `no`,
            `${ctx.emojiError}`
          ),
        });

        /* Create the interaction */
        const interaction = await message
          .awaitMessageComponent({
            filter: ({ customId, user }) =>
              ["yes", "no"].includes(customId) && user.id === ctx.user.id,
            componentType: 2,
            idle: 60 * 1000,
          })
          .catch(() => null);

        /* If the interaction is null, it means that the time has expired */
        if (!interaction) {
          return message
            .edit({
              content: ctx.translate`${ctx.emojiError} La confirmation a expiré !`,
              components: [],
            })
            .catch(() => null);
        }

        /* If the user has clicked on the cancel button */
        if (interaction.customId === "no") {
          return message
            .edit({
              content: ctx.translate`${ctx.emojiError} La confirmation a été annulée !`,
              components: [],
            })
            .catch(() => null);
        }

        /* Update the interaction */
        await interaction.deferUpdate();
      }

      const channelLabel = channel
        ? channel.toString()
        : ctx.translate`le salon où sont envoyés les messages de passage de niveaux`;
      const previewMessage = formatPreview(levelingSettings.message);

      const embedFinal = new EmbedBuilder()
        .setTitle(ctx.translate`Nouveau message de passage de niveaux`)
        .setColor(ctx.colors.blue)
        .setDescription(
          ctx.translate`Voici une visualisation du message de passage de niveaux envoyé dans ${channelLabel}.`
        )
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .addFields([
          {
            name: ctx.translate`Visualisation du message`,
            value: `${previewMessage}`,
          },
        ]);

      /* Send a confirmation message */
      message = await (message
        ? message.edit.bind(message)
        : ctx.send.bind(ctx))({
        embeds: [embedFinal],
        components: ctx.messageFormatter.question(
          `yes`,
          `${ctx.emojiSuccess}`,
          `no`,
          `${ctx.emojiError}`
        ),
      }).catch(() => null);

      /* Create the interaction */
      const interaction = await message
        .awaitMessageComponent({
          filter: ({ customId, user }) =>
            ["yes", "no"].includes(customId) && user.id === ctx.user.id,
          componentType: 2,
          time: 60 * 1000,
        })
        .catch(() => null);

      /* If the interaction is null, it means that the time has expired */
      if (!interaction) {
        return message
          .edit({
            content: ctx.translate`${ctx.emojiError} La confirmation a expiré !`,
            components: [],
          })
          .catch(() => null);
      }

      /* If the user has clicked on the cancel button */
      if (interaction.customId === "no") {
        return message
          .edit({
            content: ctx.translate`${ctx.emojiError} La confirmation a été annulée !`,
            components: [],
          })
          .catch(() => null);
      }

      /* Update the interaction */
      await interaction.deferUpdate();

      /* Update the database */
      if (settings[0]) {
        await ctx.database
          .table("guild_levels")
          .update({
            leveling: JSON.stringify(levelingSettings),
          })
          .where("guildId", ctx.guild.id);
      } else {
        await ctx.database.table("guild_levels").insert({
          guildId: ctx.guild.id,
          leveling: JSON.stringify(levelingSettings),
        });
      }

      /* Update the message */
      await message
        .edit({
          content: ctx.translate`${ctx.emojiSuccess} Le message du passage de niveaux a été créé !`,
          embeds: [],
          components: [],
        })
        .catch(() => null);
    } else if (subCommand === "variables") {
      const embed = new EmbedBuilder()
        .setTitle(
          ctx.translate`Variables pour le message du passage de niveaux`
        )
        .setColor(ctx.colors.blue)
        .setFooter({
          text: "abot",
          iconURL: ctx.client.user.displayAvatarURL(),
        })
        .setDescription(
          [
            ctx.translate`\`{user.mention}\` -  Mention utilisateur`,
            ctx.translate`\`{user.username}\` -  Nom utilisateur`,
            ctx.translate`\`{member.nickname}\` -  Pseudo membre`,
            ctx.translate`\`{server}\` -  Nom du serveur`,
            ctx.translate`\`{level}\` -  Niveau`,
            ctx.translate`\`{xp}\` - XP`,
          ].join("\n")
        );

      ctx.send({ embeds: [embed] });
    } else if (subCommand === "remove") {
      if (!settings[0])
        return ctx.error(
          ctx.translate`Il n'y a aucun message de passage de niveaux à supprimer !`
        );

      /* If there is no data return */
      if (!levelingSettings.channel && !levelingSettings.message)
        return ctx.error(
          ctx.translate`Il n'y a aucun message de passage de niveaux à supprimer !`
        );

      /* Remove the channel identifier from the leveling settings. */
      delete levelingSettings.channel;

      /* Remove the message from the leveling settings. */
      delete levelingSettings.message;

      /* It's updating the settings in the database. */
      await ctx.database
        .table("guild_levels")
        .update({
          leveling: JSON.stringify(levelingSettings),
        })
        .where("guildId", ctx.guild.id);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le message de passage de niveaux a été supprimé !`,
      });
    }
  }
};
