module.exports = class MemberNicknameUpdate {
    constructor (client) {
        this.client = client
        this.database = client.database
    }

    async handle (oldMember, newMember) {
        if (oldMember.roles.cache.size === newMember.roles.cache.size) return

        const baseNickname = await this.database.table('guild_nickname').select().where("guild_id", oldMember.guild.id);
        if (!baseNickname[0]) return

        const data = JSON.parse(baseNickname[0].data);
        if (!data[0]) return

        const roles = data.filter(d => d.type === 'role');
        if (!roles) return

        // Remove role
        if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            oldMember.roles.cache.forEach(r => {
                if (!newMember.roles.cache.has(r.id) && roles.find(role => role.roleId === r.id)) {
                    const oldName = oldMember.nickname;
                    if (!oldName) return

                    const role = roles.find(role => role.roleId === r.id);
                    if (!oldName.startsWith(role.name)) return
                    const newName = oldName.replace(role.name, '');

                    oldMember.setNickname(newName).catch(() => null);
                }
            })
        }
        else if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            const oldName = oldMember.nickname ? oldMember.nickname : oldMember.user.displayName;

            newMember.roles.cache.forEach(r => {
                if (!oldMember.roles.cache.has(r.id) && roles.find(role => role.roleId === r.id)) {
                    const role = roles.find(role => role.roleId === r.id);
                    if (oldName.startsWith(role.name)) return

                    oldMember.setNickname(`${role.name}${oldName}`).catch(() => null);
                }
            })
        }
    }
}