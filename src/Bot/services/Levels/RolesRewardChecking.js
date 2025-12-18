module.exports = class RolesRewardChecking {
    constructor(event) {
        this.client = event.client
        this.database = event.database
    }

    async handle (oldMember, newMember) {
        /* It's checking if the member is pending or the old member is not pending. */
        if (newMember.pending || !oldMember.pending) return

        const settings = await this.database.table('guild_levels').select().where('guildId', oldMember.guild.id);
        const rolesRewards = settings[0] ? JSON.parse(settings[0].rewards) : []
        if (!rolesRewards[0]) return

        const userData = await this.database.table('user_levels').select().where({ guildId: oldMember.guild.id, userId: oldMember.user.id });
        if (!userData[0]) return

        /* Filter the roles of ranks that the user does not have */
        const roles = rolesRewards
            .filter((rr) => rr.level <= userData[0].level && newMember.guild.roles.cache.has(rr.roleId) && !newMember.roles.cache.has(rr.roleId))
            .map((rr) => newMember.guild.roles.cache.get(rr.roleId))

        /* Check if there is at least one role to add */
        if (roles.length < 1) return

        /* Add roles */
        newMember.roles.add(roles).catch(() => null);
    }
}