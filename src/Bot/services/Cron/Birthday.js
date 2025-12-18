const schedule = require("node-schedule");

module.exports = class CronBirthday {
  constructor(event) {
    this.client = event.client;
    this.config = event.config;
    this.database = event.database;
    this.translate = event.translate.bind(event);
  }

  async handle() {
    // Define rules
    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 0;
    rule.tz = "Europe/Paris";

    schedule.scheduleJob(rule, async () => {
      const birthday = await this.database.table("user_birthday").select();
      if (!birthday[0]) return;

      const guilds = await this.database.table("guild_birthday").select();

      for (const guildData of guilds) {
        const guild = this.client.guilds.cache.get(guildData.guild_id);
        if (!guild) continue;

        const channel = guild.channels.cache.get(guildData.channel_id);
        if (!channel) continue;

        // Get date
        const date = new Date();
        const currentMonth = date.getMonth() + 1;
        const currentDay = date.getDate();

        // Check for all db birthday
        for (const birth of birthday) {
          if (
            Number(birth.month) === currentMonth &&
            Number(birth.day) === currentDay
          ) {
            const member = await guild.members
              .fetch(birth.user_id)
              .catch(() => null);
            if (!member) return;

            channel
              ?.send({
                content: this
                  .translate`:tada: Nous souhaitons un joyeux anniversaire à ${member} !`,
              })
              .catch(() => null);
          }
        }
      }
    });
  }
};
