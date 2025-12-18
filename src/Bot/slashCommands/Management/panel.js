const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class Panel extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "panel",
      description: "Afficher la configuration du bot",

      category: SlashCommand.Categories.Management,
      user_permissions: ["ManageGuild"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  formatNone(ctx, feminine = false) {
    return `\`${feminine ? ctx.translate`Aucune` : ctx.translate`Aucun`}\``;
  }

  formatChannel(ctx, channelId) {
    if (!channelId) return this.formatNone(ctx);
    const channel = ctx.getChannel(channelId);
    return channel ? channel : `\`${channelId}\``;
  }

  formatChannelLog(ctx, data) {
    const array = [];

    if (!data) return this.formatNone(ctx);

    const logSettings = Array.isArray(data) ? data[0] : data;
    if (!logSettings) return this.formatNone(ctx);

    if (logSettings.message_id)
      array.push(
        ctx.getChannel(logSettings.message_id)
          ? ctx.getChannel(logSettings.message_id)
          : `\`${logSettings.message_id}\``
      );
    if (logSettings.update_member_id)
      array.push(
        ctx.getChannel(logSettings.update_member_id)
          ? ctx.getChannel(logSettings.update_member_id)
          : `\`${logSettings.update_member_id}\``
      );
    if (logSettings.link_id)
      array.push(
        ctx.getChannel(logSettings.link_id)
          ? ctx.getChannel(logSettings.link_id)
          : `\`${logSettings.link_id}\``
      );
    if (logSettings.update_server_id)
      array.push(
        ctx.getChannel(logSettings.update_server_id)
          ? ctx.getChannel(logSettings.update_server_id)
          : `\`${logSettings.update_server_id}\``
      );
    if (logSettings.voice_id)
      array.push(
        ctx.getChannel(logSettings.voice_id)
          ? ctx.getChannel(logSettings.voice_id)
          : `\`${logSettings.voice_id}\``
      );

    if (!array[0]) return this.formatNone(ctx);
    return array.join(", ");
  }

  formatChannelGhostPingMember(ctx, data) {
    if (!data) return this.formatNone(ctx);
    const array = [];

    if (data.channel_id)
      array.push(
        ctx.getChannel(data.channel_id)
          ? ctx.getChannel(data.channel_id)
          : `\`${data.channel_id}\``
      );
    if (data.channel_id_2)
      array.push(
        ctx.getChannel(data.channel_id_2)
          ? ctx.getChannel(data.channel_id_2)
          : `\`${data.channel_id_2}\``
      );
    if (data.channel_id_3)
      array.push(
        ctx.getChannel(data.channel_id_3)
          ? ctx.getChannel(data.channel_id_3)
          : `\`${data.channel_id_3}\``
      );
    if (data.channel_id_4)
      array.push(
        ctx.getChannel(data.channel_id_4)
          ? ctx.getChannel(data.channel_id_4)
          : `\`${data.channel_id_4}\``
      );
    if (data.channel_id_5)
      array.push(
        ctx.getChannel(data.channel_id_5)
          ? ctx.getChannel(data.channel_id_5)
          : `\`${data.channel_id_5}\``
      );

    if (!array[0]) return this.formatNone(ctx);
    return array.join(", ");
  }

  formatCategory(ctx, categoryId) {
    if (!categoryId) return this.formatNone(ctx, true);
    const category = ctx.getChannel(categoryId);
    return category ? category.name : `\`${categoryId}\``;
  }

  formatRole(ctx, roleId) {
    if (!roleId) return this.formatNone(ctx);
    return ctx.getRole(roleId) ? ctx.getRole(roleId) : `\`${roleId}\``;
  }

  async run(ctx) {
    const guildPrivateRoom = await ctx.database
      .table("guild_voice_settings")
      .first()
      .where("guildId", ctx.guild.id);
    const guildReactionRole = await ctx.database
      .table("guild_reaction_role")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildAutoRole = await ctx.database
      .table("guild_auto_role")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildGhostPing = await ctx.database
      .table("guild_ghost_ping")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildWelcome = await ctx.database
      .table("guild_welcome")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildInvites = await ctx.database
      .table("guild_invite_config")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildStatistics = await ctx.database
      .table("guild_statistics")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildReport = await ctx.database
      .table("guild_report")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildSuggestion = await ctx.database
      .table("guild_suggest")
      .first()
      .where("guildId", ctx.guild.id);
    const guildRules = await ctx.database
      .table("guild_rules")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildNickname = await ctx.database
      .table("guild_nickname")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildBoost = await ctx.database
      .table("guild_boost")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildMoney = await ctx.database
      .table("guild_money")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildShop = await ctx.database
      .table("guild_shop")
      .select()
      .where("guild_id", ctx.guild.id);
    const guildForm = await ctx.database
      .table("guild_form")
      .select()
      .where("guild_id", ctx.guild.id);
    const guildPrison = await ctx.database
      .table("guild_prison")
      .first()
      .where("guild_id", ctx.guild.id);
    const guildLogs = await ctx.database
      .table("guild_log")
      .select()
      .where("guild_id", ctx.guild.id);
    const guildGhostPingMember = await ctx.database
      .table("guild_ghost_ping_member")
      .first()
      .where("guild_id", ctx.guild.id);

    const parsedReactionRoles = guildReactionRole?.roles_id
      ? JSON.parse(guildReactionRole.roles_id)
      : [];
    const parsedAutoRoles = guildAutoRole?.roles
      ? JSON.parse(guildAutoRole.roles)
      : [];
    const parsedInvites = guildInvites?.roles
      ? JSON.parse(guildInvites.roles)
      : [];
    const nicknameData = guildNickname?.data
      ? JSON.parse(guildNickname.data)
      : [];

    const formatNicknameValue = () => {
      if (!nicknameData.length) return this.formatNone(ctx);

      const findValue = (type) =>
        nicknameData.find((d) => d.type === type)?.name ?? this.formatNone(ctx);
      const roleEntries = nicknameData.filter((d) => d.type === "role");
      const formattedRoles = roleEntries.length
        ? `\n${roleEntries
            .map(
              (d) =>
                ctx.translate`- ${d.name} (${
                  ctx.getRole(d.roleId)
                    ? ctx.getRole(d.roleId)
                    : `\`${d.roleId}\``
                })`
            )
            .join("\n")}`
        : this.formatNone(ctx);

      return [
        ctx.translate`**Tous** : ${findValue("all")}`,
        ctx.translate`**Humains** : ${findValue("user")}`,
        ctx.translate`**Bots** : ${findValue("bot")}`,
        ctx.translate`**Rôles** : ${formattedRoles}`,
      ].join("\n");
    };

    const embed = new EmbedBuilder()
      .setColor(ctx.colors.blue)
      .setTitle(ctx.translate`Panel de ${ctx.client.user.displayName}`)
      .setFooter({
        text: "abot",
        iconURL: ctx.client.user.displayAvatarURL(),
      })
      .addFields([
        {
          name: `🔒 ${ctx.translate`Salons privés`}`,
          value: ctx.translate`Catégorie : ${this.formatCategory(
            ctx,
            guildPrivateRoom?.categoryId
          )}\nSalon : ${this.formatChannel(
            ctx,
            guildPrivateRoom?.channelStartId
          )}`,
          inline: true,
        },
        {
          name: `🔔 ${ctx.translate`Rôles réaction`}`,
          value:
            parsedReactionRoles.length !== 0
              ? parsedReactionRoles
                  .map((roleId) => this.formatRole(ctx, roleId))
                  .join(", ")
              : this.formatNone(ctx),
          inline: true,
        },
        {
          name: `🎭 ${ctx.translate`Rôles automatiques`}`,
          value:
            parsedAutoRoles.length !== 0
              ? parsedAutoRoles
                  .map((role) => this.formatRole(ctx, role.roleId))
                  .join(", ")
              : this.formatNone(ctx),
          inline: true,
        },
        {
          name: `👻 ${ctx.translate`Mentions supprimées`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildGhostPing?.channel_id
          )}`,
          inline: true,
        },
        {
          name: `👋 ${ctx.translate`Bienvenue`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildWelcome?.channel_welcome_id
          )}\nMessage : ${
            guildWelcome?.msg_bvn ? guildWelcome.msg_bvn : this.formatNone(ctx)
          }`,
          inline: true,
        },
        {
          name: `👋 ${ctx.translate`Départ`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildWelcome?.channel_leave_id
          )}\nMessage : ${
            guildWelcome?.msg_leave
              ? guildWelcome.msg_leave
              : this.formatNone(ctx)
          }`,
          inline: true,
        },
        {
          name: `📨 ${ctx.translate`Invitations`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildInvites?.channel_id
          )}\nRôles : ${
            parsedInvites.length !== 0
              ? parsedInvites
                  .map((role) => this.formatRole(ctx, role.roleId))
                  .join(", ")
              : this.formatNone(ctx)
          }`,
          inline: true,
        },
        {
          name: `📊 ${ctx.translate`Statistiques`}`,
          value: [
            ctx.translate`👤・Humains : ${this.formatChannel(
              ctx,
              guildStatistics?.channel1_id
            )}`,
            ctx.translate`🤖・Bots : ${this.formatChannel(
              ctx,
              guildStatistics?.channel2_id
            )}`,
            ctx.translate`👥・Total : ${this.formatChannel(
              ctx,
              guildStatistics?.channel3_id
            )}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: `📝 ${ctx.translate`Report`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildReport?.channel_id
          )}`,
          inline: true,
        },
        {
          name: `💡 ${ctx.translate`Suggestion`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildSuggestion?.channelId
          )}`,
          inline: true,
        },
        {
          name: `📜 ${ctx.translate`Règles`}`,
          value: ctx.translate`Rôle : ${this.formatRole(
            ctx,
            guildRules?.roles_id
          )}`,
          inline: true,
        },
        {
          name: `👤 ${ctx.translate`Pseudo`}`,
          value: formatNicknameValue(),
          inline: true,
        },
        {
          name: `🚀 ${ctx.translate`Boost`}`,
          value: ctx.translate`Salon : ${this.formatChannel(
            ctx,
            guildBoost?.channel_id
          )}\nMessage boost : ${
            guildBoost?.message_add
              ? guildBoost.message_add
              : this.formatNone(ctx)
          }\nMessage unBoost : ${
            guildBoost?.message_remove
              ? guildBoost.message_remove
              : this.formatNone(ctx)
          }`,
          inline: true,
        },
        {
          name: `💰 ${ctx.translate`Économie`}`,
          value: ctx.translate`Nom : ${
            guildMoney?.name ? guildMoney.name : ctx.translate`coins`
          }\nDaily : ${
            guildMoney?.daily === true ? ctx.emojiSuccess : ctx.emojiError
          }\nMontant : ${`\`${
            guildMoney?.daily_amount ? guildMoney.daily_amount : 0
          }\``}`,
          inline: true,
        },
        {
          name: `🛒 ${ctx.translate`Boutique`}`,
          value: ctx.translate`Objets : ${`\`${guildShop.length}\``}`,
          inline: true,
        },
        {
          name: `👻 ${ctx.translate`Ghost Ping`}`,
          value: ctx.translate`Salons : ${this.formatChannelGhostPingMember(
            ctx,
            guildGhostPingMember
          )}`,
          inline: true,
        },
        {
          name: `⛓️ ${ctx.translate`Prison`}`,
          value: ctx.translate`Salon : ${this.formatRole(
            ctx,
            guildPrison?.role_add_id
          )}`,
          inline: true,
        },
        {
          name: `📜 ${ctx.translate`Logs`}`,
          value: ctx.translate`Salons : ${this.formatChannelLog(
            ctx,
            guildLogs
          )}`,
          inline: true,
        },
        {
          name: `📝 ${ctx.translate`Formulaire`}`,
          value: ctx.translate`Formulaires : ${
            guildForm && guildForm.length !== 0
              ? guildForm.map((f) => `${f.form_name}`).join(", ")
              : this.formatNone(ctx)
          }`,
          inline: true,
        },
      ]);

    ctx.send({ embeds: [embed] });
  }
};
