const schedule = require("node-schedule");
const { EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = class CronReminder {
  constructor(event) {
    this.client = event.client;
    this.config = event.config;
    this.database = event.database;
    this.utils = event.utils;
    this.colors = event.colors;
  }

  async handle() {
    await this.utils.sleep(5 * 1000);
    const data = await this.database.table("guild_reminder").select();

    for (let i = 0; i < data.length; i++) {
      const timing = data[i].time;

      if (timing > Date.now()) {
        const guild = this.client.guilds.cache.get(data[i].guild_id);
        if (!guild) {
          await this.database
            .table("guild_reminder")
            .delete()
            .where({ guild_id: data[i].guild_id, time: timing });
          continue;
        }

        const user = await guild.members.cache.get(data[i].member_id);
        if (!user) {
          await this.database
            .table("guild_reminder")
            .delete()
            .where({ guild_id: guild.id, time: timing });
          continue;
        }

        const content = data[i].content;

        schedule.scheduleJob(timing, async () => {
          const embed = new EmbedBuilder()
            .setColor(this.colors.blue)
            .setTitle("📌 Rappel")
            .setDescription(content)
            .setFooter({
              text: "abot",
              iconURL: this.client.user.displayAvatarURL(),
            });

          user.send({ embeds: [embed] }).catch(() => null);

          await this.isRecurrent(data[i].id);
        });
      } else {
        await this.isRecurrent(data[i].id);
      }
    }
  }

  async isRecurrent(id) {
    const data = await this.database
      .table("guild_reminder")
      .select()
      .where({ id })
      .first();
    if (!data) return;

    if (Boolean(data.recurrent) === true) {
      const guild = this.client.guilds.cache.get(data.guild_id);
      if (!guild)
        return this.database.table("guild_reminder").delete().where({ id });

      const user = await guild.members.cache.get(data.member_id);
      if (!user)
        return this.database.table("guild_reminder").delete().where({ id });

      const timing = Date.now() + ms(data.duration);

      schedule.scheduleJob(timing, async () => {
        const embed = new EmbedBuilder()
          .setColor(this.colors.blue)
          .setTitle("📌 Rappel")
          .setDescription(data.content)
          .setFooter({
            text: "abot",
            iconURL: this.client.user.displayAvatarURL(),
          });

        user.send({ embeds: [embed] }).catch(() => null);

        await this.isRecurrent(id);
      });
    } else {
      await this.database.table("guild_reminder").delete().where({ id });
    }
  }
};
