const schedule = require('node-schedule');

module.exports = class CronReminder {
    constructor(event) {
        this.client = event.client
        this.config = event.config
        this.database = event.database
        this.utils = event.utils
    }

    async handle() {
        await this.utils.sleep(5 * 1000);
        const baseUserPrison = await this.database.table('user_prison').select();

        for (let i = 0; i < baseUserPrison.length; i++) {
            const timing = baseUserPrison[i].time;
            if (!timing) continue;

            const guild = this.client.guilds.cache.get(baseUserPrison[i].guild_id);
            if (!guild) {
                await this.database.table('user_prison').delete().where({guild_id: baseUserPrison[i].guild_id, time: timing});
                continue;
            }

            const user = await guild.members.cache.get(baseUserPrison[i].user_id);
            if (!user) continue;

            const baseGuildPrison = await this.database.table('guild_prison').select().where("guild_id", guild.id);
            if (!baseGuildPrison[0]) {
                await this.database.table('user_prison').delete().where({guild_id: guild.id, time: timing});
                continue;
            }

            const roleToAdd = guild.roles.cache.get(baseGuildPrison[0].role_add_id);
            if (!roleToAdd) continue;

            const rolesToAdd = JSON.parse(baseUserPrison[i].roles);

            if (timing > Date.now()) {
                schedule.scheduleJob(timing, async () => {
                    await user.roles.remove(roleToAdd.id).catch(() => null);

                    if (rolesToAdd[0]) {
                        await user.roles.add(rolesToAdd).catch(() => null);
                    }

                    await this.database.table('user_prison').delete().where({guild_id: guild.id, time: timing});
                });
            }
            else {
                await user.roles.remove(roleToAdd.id).catch(() => null);

                if (rolesToAdd[0]) {
                    await user.roles.add(rolesToAdd).catch(() => null);
                }

                await this.database.table('user_prison').delete().where({time: baseUserPrison[i].time});
            }
        }
    }
}