const { CronJob } = require('cron');

module.exports = class CronStatistics {
    constructor(event) {
        this.client = event.client
        this.database = event.database
        this.utils = event.utils
    }

    async channels() {
        const guildStatistics = await this.database.table('guild_statistics').select();
        if (!guildStatistics[0]) return

        for (const statistics of guildStatistics) {
            const guild = this.client.guilds.cache.get(statistics.guild_id);
            if (!guild) continue;

            if (!guild.members.me.permissions.has('ManageChannels')) continue;

            const channel1 = await guild.channels.cache.get(statistics.channel1_id);
            const channel2 = await guild.channels.cache.get(statistics.channel2_id);
            const channel3 = await guild.channels.cache.get(statistics.channel3_id);

            const members = await guild.members.fetch();
            const bots = members.filter(member => member.user.bot);
            const humans = members.filter(member => !member.user.bot);

            if (channel1 && !channel1.name.includes(String(humans.size))) {
                channel1.setName(`${statistics.channel1_name?statistics.channel1_name:"👤・Humains :"} ${humans.size}`).catch(() => null);
            }
            if (channel2 && !channel2.name.includes(String(bots.size))) {
                channel2.setName(`${statistics.channel2_name?statistics.channel2_name:"🤖・Bots :"} ${bots.size}`).catch(() => null);
            }
            if (channel3 && !channel3.name.includes(String(members.size))) {
                channel3.setName(`${statistics.channel3_name?statistics.channel3_name:"👤👥・Total :"} ${members.size}`).catch(() => null);
            }
        }
    }

    async handle() {
        // Check statistics every hour
        const job = new CronJob('0 * * * *', async () => await this.channels(), null, true, 'Europe/Paris')

        // Start the cron job
        job.start()
    }
}