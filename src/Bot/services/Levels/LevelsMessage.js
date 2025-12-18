const { MessageType } = require("discord.js");
module.exports = class LevelsMessage {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
    this.cooldown = new Set();
    this.translate = event.translate.bind(event);
  }

  /**
   * It returns a string that depends on the level of the user
   * @param guild -  The guild
   * @param member - The user who leveled up
   * @param level - The level the user has reached.
   * @param xp - The XP
   * @param levelingSettings - The leveling settings
   * @returns A string
   */
  _levelUpMessage(guild, member, level, xp, levelingSettings) {
    let message = this
      .translate`Félicitations ${member.toString()} ! Tu viens juste de passer niveau **${level}** ! :tada:`;

    if (levelingSettings && levelingSettings.message) {
      message = levelingSettings.message
        .replace(/{user.username}/gim, member.user.username)
        .replace(/{user.mention}/gim, member.toString())
        .replace(/{member.nickname}/gim, member.displayName)
        .replace(/{server}/gim, guild.name)
        .replace(/{xp}/gim, xp)
        .replace(/{level}/gim, level);
    }

    return message;
  }

  async handle(message) {
    // Check if the author of the message is not a bot, and if the message has been sent in a server
    if (message.author.bot || !message.guild) return;

    /* It's checking if the message is a normal message. */
    if (
      message.type !== MessageType.Default &&
      message.type !== MessageType.Reply
    )
      return;

    /* Leveling channel */
    const settings = await this.database
      .table("guild_levels")
      .select()
      .where("guildId", message.guild.id);
    const levelingSettings = settings[0]
      ? JSON.parse(settings[0].leveling)
      : {};

    /* Ignore some channels */
    if (
      levelingSettings.ignoreChannels &&
      levelingSettings.ignoreChannels.includes(message.channel.id)
    )
      return;

    let data = await this.database
      .table("user_levels")
      .select()
      .where({ guildId: message.guild.id, userId: message.author.id });
    if (!data[0]) {
      await this.database.table("user_levels").insert({
        guildId: message.guild.id,
        userId: message.author.id,
        level: 0,
        xp: 0,
      });

      data = await this.database
        .table("user_levels")
        .select()
        .where({ guildId: message.guild.id, userId: message.author.id });
    }

    // Check if the user is in the cooldown list
    if (this.cooldown.has(message.author.id)) return;

    // Edit the gain of xp obtained according to the configured value.
    let xpAdd = this.utils.randomNumber(1, 32); // 16,5 XP / message (= par minute)

    /* Level & Xp */
    let level = data[0].level;
    const xp = data[0].xp + xpAdd;

    /* Set the cooldown for 1 minute */
    this.cooldown.add(message.author.id);
    setTimeout(() => {
      this.cooldown.delete(message.author.id);
    }, 60 * 1000);

    /* Checks if the member has level up */
    const needXp = this.utils.getXpWithLevel(level + 1);

    if (needXp <= xp) {
      let channelToSend;
      if (levelingSettings && levelingSettings.channel)
        channelToSend = message.guild.channels.cache.get(
          levelingSettings.channel
        );

      /* Level up */
      level++;

      /* Update in the database */
      await this.database
        .table("user_levels")
        .update({ level, xp })
        .where({ guildId: message.guild.id, userId: message.author.id });

      /* Sending the level up message */
      if (channelToSend) {
        channelToSend
          .send({
            content: this._levelUpMessage(
              message.guild,
              message.member,
              level,
              xp,
              levelingSettings
            ),
          })
          .catch(() => null);
      }

      /* Check if the member has a role reward */
      const rolesRewards = settings[0] ? JSON.parse(settings[0].rewards) : [];
      if (!rolesRewards[0]) return;

      /* Filter the roles of ranks that the user does not have */
      const roles = rolesRewards
        .filter(
          (rr) =>
            rr.level <= level &&
            message.guild.roles.cache.has(rr.roleId) &&
            !message.member.roles.cache.has(rr.roleId)
        )
        .map((rr) => message.guild.roles.cache.get(rr.roleId));

      /* Check if there is at least one role to add */
      if (roles.length > 0) {
        /* Add roles */
        message.member.roles.add(roles).catch(() => null);
      }

      // Add the money reward for this level
      const moneyReward = rolesRewards.find((rr) => rr.level === level);
      if (moneyReward && moneyReward.money > 0) {
        const baseUserMoney = await this.database
          .table("user_money")
          .select()
          .where({ guild_id: message.guild.id, user_id: message.author.id });

        if (!baseUserMoney[0]) {
          await this.database.table("user_money").insert({
            guild_id: message.guild.id,
            user_id: message.author.id,
            money: moneyReward.money,
          });
        } else {
          await this.database
            .table("user_money")
            .update({
              money: baseUserMoney[0].money + moneyReward.money,
            })
            .where({ guild_id: message.guild.id, user_id: message.author.id });
        }
      }
    } else {
      /* Update in the database */
      return this.database
        .table("user_levels")
        .update({ xp })
        .where({ guildId: message.guild.id, userId: message.author.id });
    }
  }
};
