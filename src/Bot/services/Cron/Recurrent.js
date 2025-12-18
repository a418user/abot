const { SimpleIntervalJob, Task } = require('toad-scheduler');

module.exports = class CronRecurrent {
    constructor(event) {
        this.client = event.client
        this.database = event.database
        this.utils = event.utils
    }

    async handle() {
        await this.utils.sleep(5 * 1000);
        const database = await this.database.table('guild_recurrent').select();

        for (let i = 0; i < database.length; i++) {
            const data = database[i];

            // Check if the task is already scheduled
            //const existingJob = this.client.scheduler.getById(`${data.channel_id}`);
            //if (existingJob) continue;

            const task = new Task(`${data.channel_id}`, () => {
                    /* Get the guild */
                    const guild = this.client.guilds.cache.get(data.guild_id);
                    if (!guild) return;

                    /* Get the channel */
                    const channel = guild.channels.cache.get(data.channel_id);
                    if (!channel) return;

                    /* Send the message */
                    channel.send({ content: data.message });
                }, (err) => { console.log(err) }
            );

            const job = new SimpleIntervalJob({
                seconds: data.time,
                runImmediately: false
            }, task, {
                id: `${data.channel_id}`,
                preventOverrun: true
            });

            this.client.scheduler.addSimpleIntervalJob(job);
        }
    }
}
