module.exports = class MemberGhostPing {
    constructor (client) {
        this.client = client
        this.database = client.database
        this.utils = client.utils
    }

    async sendMessage (channel, member) {
        return channel.send({ content: `${member}`})
            .then((msg) => {
                setTimeout(() => {
                    msg.delete().catch(() => null);
                }, 5 * 1000);
            })
            .catch(() => null);
    }

    async handle (member) {
        const base = await this.database.table('guild_ghost_ping_member').select().where({guild_id: member.guild.id});
        if (!base[0]) return;

        const channel = member.guild.channels.cache.get(base[0].channel_id);
        const channel2 = member.guild.channels.cache.get(base[0].channel_id_2);
        const channel3 = member.guild.channels.cache.get(base[0].channel_id_3);
        const channel4 = member.guild.channels.cache.get(base[0].channel_id_4);
        const channel5 = member.guild.channels.cache.get(base[0].channel_id_5);

        if (channel) await this.sendMessage(channel, member);
        if (channel2) await this.sendMessage(channel2, member);
        if (channel3) await this.sendMessage(channel3, member);
        if (channel4) await this.sendMessage(channel4, member);
        if (channel5) await this.sendMessage
    }
}