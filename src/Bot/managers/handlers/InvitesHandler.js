const { Collection } = require('discord.js');

module.exports = class InvitesHandler {
    constructor(client) {
        this.client = client;

        this.inviteCache = new Collection();
        this.getInviteCache = (guild) => this.inviteCache.get(guild.id);
        this.resetInviteCache = (guild) => this.inviteCache.delete(guild.id);
        this.getEffectiveInvites = (inviteData = {}) => inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left || 0;
        this.cacheInvite = (invite, isVanity) => ({
            code: invite.code,
            uses: invite.uses,
            maxUses: invite.maxUses,
            inviterId: isVanity ? "VANITY" : invite.inviter?.id,
        });

        this.checkInviteRewards = async (guild, inviterData = {}, isAdded) => {
            const settings = await this.client.database.table('guild_invite_config').select().where({ guild_id: guild.id });

            if (settings[0] && inviterData?.member_id) {
                const roles = JSON.parse(settings[0].roles);

                const inviter = await guild.members.fetch(inviterData?.member_id).catch(() => null);
                if (!inviter) return;

                const invites = this.getEffectiveInvites(inviterData);
                roles.forEach((reward) => {
                    if (isAdded) {
                        if (invites >= reward.invites && !inviter.roles.cache.has(reward.roleId)) {
                            inviter.roles.add(reward.roleId);
                        }
                    } else if (invites < reward.invites && inviter.roles.cache.has(reward.roleId)) {
                        inviter.roles.remove(reward.roleId);
                    }
                });
            }
        };
    }

    /**
     * This function caches all invites for the provided guild
     * @param guild
     */
    async cacheGuildInvites(guild) {
        if (!guild.members.me.permissions.has("ManageGuild")) return new Collection();
        const invites = await (guild?.invites
            ? guild.invites.fetch()
            : guild.fetchInvites());

        const tempMap = new Collection();
        invites.forEach((inv) => tempMap.set(inv.code, this.cacheInvite(inv)));
        if (guild.vanityURLCode) {
            tempMap.set(guild.vanityURLCode, this.cacheInvite(await guild.fetchVanityData(), true));
        }

        this.inviteCache.set(guild.id, tempMap);
        return tempMap;
    }

    /**
     * Track inviter by comparing new invites with cached invites
     * @param {import("discord.js").GuildMember} member
     */
    async trackJoinedMember(member) {
        const { guild } = member;

        if (member.user.bot) return {};

        const cachedInvites = this.inviteCache.get(guild.id);
        const newInvites = await this.cacheGuildInvites(guild);

        // return if no cached data
        if (!cachedInvites) return {};
        let usedInvite;

        // compare newInvites with cached invites
        usedInvite = newInvites.find(
            (inv) => inv.uses !== 0 && cachedInvites.get(inv.code) && cachedInvites.get(inv.code).uses < inv.uses
        );

        // Special case: Invitation was deleted after member's arrival and
        // just before GUILD_MEMBER_ADD (https://github.com/Androz2091/discord-invites-tracker/blob/29202ee8e85bb1651f19a466e2c0721b2373fefb/index.ts#L46)
        if (!usedInvite) {
            cachedInvites
                .sort((a, b) => (a.deletedTimestamp && b.deletedTimestamp ? b.deletedTimestamp - a.deletedTimestamp : 0))
                .forEach((invite) => {
                    if (
                        !newInvites.get(invite.code) && // If the invitation is no longer present
                        invite.maxUses > 0 && // If the invitation was indeed an invitation with a limited number of uses
                        invite.uses === invite.maxUses - 1 // What if the invitation was about to reach the maximum number of uses
                    ) {
                        usedInvite = invite;
                    }
                });
        }

        let inviterData = {};
        if (usedInvite) {
            const inviterId = usedInvite.code === guild.vanityURLCode ? "VANITY" : usedInvite.inviterId;

            // log invite data
            const memberData = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: member.id });
            if (!memberData[0]) {
                await this.client.database.table('user_invite').insert({
                    guild_id: guild.id,
                    member_id: member.id,
                    inviter: inviterId,
                    code: usedInvite.code
                });
            }
            else {
                await this.client.database.table('user_invite').update({
                    inviter: inviterId,
                    code: usedInvite.code
                }).where({ guild_id: guild.id, member_id: member.id });
            }

            // increment inviter's invites
            let inviterDb = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: inviterId });
            if (!inviterDb[0]) {
                await this.client.database.table('user_invite').insert({
                    guild_id: guild.id,
                    member_id: inviterId,
                    tracked: 1
                });
            }
            else {
                await this.client.database.table('user_invite').update({
                    tracked: inviterDb[0].tracked + 1
                }).where({ guild_id: guild.id, member_id: inviterId });
            }

            inviterDb = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: inviterId });
            inviterData = inviterDb[0];
        }

        await this.checkInviteRewards(guild, inviterData, true);
        return inviterData;
    }

    /**
     * Fetch inviter data from database
     * @param {import("discord.js").Guild} guild
     * @param {import("discord.js").User} user
     */
    async trackLeftMember(guild, user) {
        if (user.bot) return {};

        const inviteData = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: user.id });

        let inviterData = {};
        if (inviteData[0] &&  inviteData[0].inviter) {
            const inviterId = inviteData[0].inviter === "VANITY" ? "VANITY" : inviteData[0].inviter;
            let inviterDb = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: inviterId });
            if (!inviterDb[0]) {
                await this.client.database.table('user_invite').insert({
                    guild_id: guild.id,
                    member_id: inviterId,
                    left: 1
                });
            }
            else {
                await this.client.database.table('user_invite').update({
                    left: inviterDb[0].left + 1
                }).where({ guild_id: guild.id, member_id: inviterId });
            }

            inviterDb = await this.client.database.table('user_invite').select().where({ guild_id: guild.id, member_id: inviterId });
            inviterData = inviterDb[0];
        }

        await this.checkInviteRewards(guild, inviterData, false);
        return inviterData;
    }
}