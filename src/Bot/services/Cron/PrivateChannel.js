const schedule = require('node-schedule');

module.exports = class PrivateChannel {
    constructor(event) {
        this.client = event.client
        this.database = event.database
        this.utils = event.utils
    }

    async handle() {
        await this.utils.sleep(5 * 1000);
        const data = await this.database.table('guild_private_channel').select();

        for (let i = 0; i < data.length; i++) {
            const timing = data[i].time;

            const guild = this.client.guilds.cache.get(data[i].guild_id);
            if (!guild) {
                await this.database.table('guild_private_channel').delete().where({guild_id: data[i].guild_id, time: timing});
                continue;
            }

            const channel = guild.channels.cache.get(data[i].channel_id);
            if (!channel) {
                await this.database.table('guild_private_channel').delete().where({guild_id: guild.id, time: timing});
                continue;
            }

            if (timing > Date.now()) {
                schedule.scheduleJob(timing, async () => {
                    await channel.delete().catch(() => null);
                    await this.database.table('guild_private_channel').delete().where({
                        guild_id: guild.id,
                        time: timing
                    });
                });
            }
            else {
                await channel.delete().catch(() => null);
                await this.database.table('guild_private_channel').delete().where({time: data[i].time});
            }
        }
    }
}