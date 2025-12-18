module.exports = class MemberNicknameAdd {
    constructor (client) {
        this.client = client
        this.database = client.database
    }

    async handle (member) {
        const baseNickname = await this.database.table('guild_nickname').select().where("guild_id", member.guild.id);
        if (!baseNickname[0]) return

        const data = JSON.parse(baseNickname[0].data);
        if (!data[0]) return

        const all = data.find(d => d.type === 'all');
        const user = data.find(d => d.type === 'user');
        const bot = data.find(d => d.type === 'bot');

        const oldName = member.nickname ? member.nickname : member.user.displayName;

        if (member.user.bot && bot) {
            await member.setNickname(`${bot.name}${oldName}`).catch(() => null);
        }
        else if (!member.user.bot && user) {
            await member.setNickname(`${user.name}${oldName}`).catch(() => null);
        }
        else if (all) {
            await member.setNickname(`${all.name}${oldName}`).catch(() => null);
        }
    }
}