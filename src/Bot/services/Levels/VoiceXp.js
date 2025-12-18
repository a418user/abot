module.exports = class VoiceXp {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
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

  async checkStart(state) {
    /* Leveling channel */
    const settings = await this.database
      .table("guild_levels")
      .select()
      .where("guildId", state.guild.id);
    const levelingSettings = settings[0]
      ? JSON.parse(settings[0].leveling)
      : {};

    /* Ignore some channels */
    if (
      levelingSettings.ignoreChannels &&
      levelingSettings.ignoreChannels.includes(state.channel.id)
    )
      return;

    const data = await this.database.table("user_vocal").where({
      guildId: state.guild.id,
      userId: state.member.id,
    });

    if (!data[0]) {
      await this.database.table("user_vocal").insert({
        guildId: state.guild.id,
        userId: state.member.id,
        isInVocal: true,
        time: Date.now(),
      });
    } else {
      // If the user is already in a voice channel, we don't do anything
      if (Boolean(data[0].isInVocal) === true) return;

      await this.database
        .table("user_vocal")
        .update({
          isInVocal: true,
          time: Date.now(),
        })
        .where({
          guildId: state.guild.id,
          userId: state.member.id,
        });
    }
  }

  async checkStop(data, state) {
    if (!data[0] || Boolean(data[0].isInVocal) === false) return;

    if (!state.member) return;

    const timeInVocal = Date.now() - data[0].time;

    await this.database
      .table("user_vocal")
      .update({
        isInVocal: false,
        totalTime: data[0].totalTime + timeInVocal,
      })
      .where({
        guildId: state.guild.id,
        userId: state.member.id,
      });

    /* Get the xp of the member */
    let levelData = await this.database
      .table("user_levels")
      .select()
      .where({ guildId: state.guild.id, userId: state.member.id });
    if (!levelData[0]) {
      await this.database.table("user_levels").insert({
        guildId: state.guild.id,
        userId: state.member.id,
        level: 0,
        xp: 0,
      });

      levelData = await this.database
        .table("user_levels")
        .select()
        .where({ guildId: state.guild.id, userId: state.member.id });
    }

    const xpAdd = this.utils.randomNumber(1, 7); // 8 XP / message (= par minute) soit 480 XP / heure

    // Convert time in seconds
    const timeInSeconds = Math.floor(timeInVocal / 1000);

    // Add cooldown of 60 seconds like message xp
    const timeWithCooldown = Math.floor(timeInSeconds / 60);

    // Get the value of the xp
    const value = xpAdd * timeWithCooldown;

    /* Level & Xp */
    let level = levelData[0].level;
    const xp = levelData[0].xp + value;

    /* Checks if the member has level up */
    const newLevel = this.utils.getLevelWithXp(xp);

    if (level !== newLevel) {
      /* Leveling channel */
      const settings = await this.database
        .table("guild_levels")
        .select()
        .where("guildId", state.guild.id);
      const levelingSettings = settings[0]
        ? JSON.parse(settings[0].leveling)
        : {};

      let channelToSend;
      if (levelingSettings && levelingSettings.channel)
        channelToSend = state.guild.channels.cache.get(
          levelingSettings.channel
        );

      /* Update in the database */
      await this.database
        .table("user_levels")
        .update({ level: newLevel, xp })
        .where({ guildId: state.guild.id, userId: state.member.id });

      /* Sending the level up message */
      if (channelToSend) {
        channelToSend
          .send({
            content: this._levelUpMessage(
              state.guild,
              state.member,
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
            state.guild.roles.cache.has(rr.roleId) &&
            !state.member.roles.cache.has(rr.roleId)
        )
        .map((rr) => state.guild.roles.cache.get(rr.roleId));

      /* Check if there is at least one role to add */
      if (roles.length > 0) {
        /* Add roles */
        state.member.roles.add(roles).catch(() => null);
      }

      // Add the money reward for this level
      const moneyReward = rolesRewards.find((rr) => rr.level === level);
      if (moneyReward && moneyReward.money > 0) {
        const baseUserMoney = await this.database
          .table("user_money")
          .select()
          .where({ guild_id: state.guild.id, user_id: state.user.id });

        if (!baseUserMoney[0]) {
          await this.database.table("user_money").insert({
            guild_id: state.guild.id,
            user_id: state.user.id,
            money: moneyReward.money,
          });
        } else {
          await this.database
            .table("user_money")
            .update({
              money: baseUserMoney[0].money + moneyReward.money,
            })
            .where({ guild_id: state.guild.id, user_id: state.user.id });
        }
      }
    } else {
      /* Update in the database */
      return this.database
        .table("user_levels")
        .update({ xp })
        .where({ guildId: state.guild.id, userId: state.member.id });
    }
  }

  async handle(oldState, newState) {
    // When a user joins a voice channel
    if (!oldState.channelId) {
      // Check if there is at least 2 users in the voice channel
      if (newState.channel.members.size === 2) {
        // For each member in the voice channel
        for (const member of newState.channel.members.values()) {
          const newData = {
            guild: newState.guild,
            channel: newState.channel,
            member,
          };

          await this.checkStart(newData);
        }
      } else if (newState.channel.members.size > 2) {
        await this.checkStart(newState);
      }
    } else if (!newState.channelId) {
      // Check if the user is a bot
      if (oldState.member.user.bot) return;

      // If there is only one user in the voice channel, stop the xp for him
      if (oldState.channel.members.size === 1) {
        for (const member of oldState.channel.members.values()) {
          const dataMember = await this.database.table("user_vocal").where({
            guildId: oldState.guild.id,
            userId: member.id,
          });

          const newData = {
            guild: oldState.guild,
            member,
          };

          await this.checkStop(dataMember, newData);
        }
      }

      // Stop the xp for the user who left the voice channel
      const data = await this.database.table("user_vocal").where({
        guildId: oldState.guild.id,
        userId: oldState.member.id,
      });

      await this.checkStop(data, oldState);
    }
    // Stop when user is selfDeaf
    else if (oldState.selfDeaf === false && newState.selfDeaf === true) {
      // Check if the user is a bot
      if (newState.member.user.bot) return;

      const data = await this.database.table("user_vocal").where({
        guildId: newState.guild.id,
        userId: newState.member.id,
      });

      // Stop the xp for the user who is selfDeaf
      await this.checkStop(data, newState);
    }
    // Enable when user is not anymore selfDeaf
    else if (oldState.selfDeaf === true && newState.selfDeaf === false) {
      // Check if the user is a bot
      if (newState.member.user.bot) return;

      // Enable the xp for the user who is not anymore selfDeaf
      await this.checkStart(newState);
    }
    // Stop when user is selfMute
    else if (oldState.selfMute === false && newState.selfMute === true) {
      // Check if the user is a bot
      if (newState.member.user.bot) return;

      const data = await this.database.table("user_vocal").where({
        guildId: newState.guild.id,
        userId: newState.member.id,
      });

      // Stop the xp for the user who is selfDeaf
      await this.checkStop(data, newState);
    }
    // Enable when user is not anymore selfMute
    else if (oldState.selfMute === true && newState.selfMute === false) {
      // Check if the user is a bot
      if (newState.member.user.bot) return;

      // Enable the xp for the user who is not anymore selfDeaf
      await this.checkStart(newState);
    }
  }
};
