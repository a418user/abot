module.exports = class MemberAddPrison {
    constructor (client) {
        this.client = client
        this.database = client.database
        this.utils = client.utils
    }

    async handle (member) {
        await this.utils.sleep(3 * 1000);

        const baseUserPrison = await this.database.table('user_prison').select().where({guild_id: member.guild.id, user_id: member.id});
        if (!baseUserPrison[0]) return;

        const baseGuildPrison = await this.database.table('guild_prison').select().where("guild_id", member.guild.id);
        if (!baseGuildPrison[0]) return this.database.table('user_prison').delete().where({
            guild_id: member.guild.id,
            user_id: member.id
        });

        const roleToAdd = member.guild.roles.cache.get(baseGuildPrison[0].role_add_id);
        if (!roleToAdd) return;

        const rolesToRemove = JSON.parse(baseUserPrison[0].roles);
        if (rolesToRemove[0]) {
            await member.roles.remove(rolesToRemove).catch(() => null);
        }

        await member.roles.add(roleToAdd.id).catch(() => null);
    }
}