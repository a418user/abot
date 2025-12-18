const { PermissionsBitField } = require('discord.js');

module.exports = class PrivateRoomSystem {
    constructor (event) {
        this.client = event.client
        this.database = event.database
        this.privateRoom = event.privateRoom
    }

    async handle (oldState, newState) {
        const data = await this.database.table('guild_voice_settings').where('guildId', oldState.guild.id).first();
        if (!data) return;

        const state = newState.channelId !== null ? newState : oldState;

        // Join channel
        if ((!oldState.channelId && newState.channelId) || (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId && newState.channelId === data.channelStartId)) {
            if (newState.channelId !== data.channelStartId) return

            // Set the user limit to 1
            if (newState.channel.userLimit !== 1 && (newState.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels) || newState.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator))) await newState.channel.setUserLimit(1).catch(() => null);

            // Already in a channel
            const voiceUser = await this.database.table('user_voice').select().where({ ownerId: newState.member.id });
            if (voiceUser[0]) return

            // No permission to create a new channel & move members
            if ((!newState.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels) || !newState.guild.members.me.permissions.has(PermissionsBitField.Flags.MoveMembers)) && !newState.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) return

            const permissionOverwrites = []
            const permissions = JSON.parse(data.permissions);
            const rolesManager = JSON.parse(data.rolesManager);
            const rolesAccepted = JSON.parse(data.rolesAccepted);
            const rolesRefused = JSON.parse(data.rolesRefused);

            permissionOverwrites.push({
                id: newState.guild.id,
                type: 0,
                allow: permissions.everyone.accepted,
                deny: permissions.everyone.refused
            });

            permissionOverwrites.push({
                id: newState.member.id,
                type: 1,
                allow: permissions.owner.accepted,
                deny: permissions.owner.refused
            });

            // Permissions Protect
            if (data.permissionsProtect) {
                for (const roleId of rolesManager) {
                    if (!newState.guild.roles.cache.has(roleId)) continue

                    permissionOverwrites.push({
                        id: roleId,
                        type: 0,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                    });
                }

                for (const roleId of rolesAccepted) {
                    if (!newState.guild.roles.cache.has(roleId)) continue

                    permissionOverwrites.push({
                        id: roleId,
                        type: 0,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                    });
                }

                for (const roleId of rolesRefused) {
                    if (!newState.guild.roles.cache.has(roleId)) continue

                    permissionOverwrites.push({
                        id: roleId,
                        type: 0,
                        deny: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.ViewChannel],
                    });
                }
            }

            // Creation of the channel
            const channelPrivateRoom = await newState.guild.channels.create({
                name: data.channelName.replace('{username}', newState.member.displayName),
                type: 2,
                parent: data.categoryId,
                reason: 'Private Room',
                userLimit: data.channelLimit,
                permissionOverwrites
            });

            await newState.setChannel(channelPrivateRoom);

            let channelPrivateRoomWaiting = null;
            if (data.waitingChannel) {
                // Edit the permissionOverwrites
                permissionOverwrites[0].allow = [PermissionsBitField.Flags.ViewChannel];
                permissionOverwrites[0].deny = [PermissionsBitField.Flags.Speak];

                permissionOverwrites[1].allow = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Speak];

                channelPrivateRoomWaiting = await newState.guild.channels.create({
                    name: data.channelWaitingName.replace('{username}', newState.member.displayName),
                    type: 2,
                    parent: data.categoryId,
                    reason: 'Private Room',
                    permissionOverwrites
                });
            }

            const msg = await newState.channel.send({
                content: `${newState.member}`,
                embeds: [this.privateRoom.displayEmbed(state, {
                    mentionable: { roles: [], members: [] },
                    membersAdmin: [],
                    membersBanned: []
                })],
                components: this.privateRoom.displayButtons({
                    isHidden: false,
                    isPrivate: false,
                    isMute: false
                })
            });

            await this.database.table('user_voice').insert({
                channelId: channelPrivateRoom.id,
                channelWaitingId: channelPrivateRoomWaiting ? channelPrivateRoomWaiting.id : null,
                ownerId: newState.member.id,
                messageId: msg.id
            });
        }
        // Leave channel
        else if ((!newState.channelId && oldState.channelId) || (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId)) {
            if (oldState?.channel?.parentId !== data.categoryId) return

            const voiceUser = await this.database.table('user_voice').select().where("channelId", oldState.channel.id);
            if (!voiceUser[0]) return

            // Nobody in the channel
            if (oldState.channel.members.size === 0) {
                // Delete the channel
                oldState.channel.delete().catch(() => null);

                // Delete the waiting channel
                const waitingChannel = oldState.guild.channels.cache.get(voiceUser[0].channelWaitingId);
                if (waitingChannel) waitingChannel.delete().catch(() => null);

                // Delete the user in the database
                await this.database.table("user_voice").delete().where("channelId", oldState.channel.id);
                await this.database.table('user_voice_waiting').delete().where('channelId', oldState.channel.id);
            }
            else {
                // Check if the owner is present
                const isOwnerPresent = oldState.channel.members.find((member) => member.id === voiceUser[0].ownerId);
                if (isOwnerPresent) return

                const newOwner = oldState.channel.members.first();

                // Edit permissions
                const permissionOverwrites = oldState.channel.permissionOverwrites.cache.map((permission) => {
                    if (permission.id === voiceUser[0].ownerId) {
                        permission.id = newOwner.id;
                    }

                    return permission;
                });

                await oldState.channel.permissionOverwrites.set(permissionOverwrites);

                const msg = await oldState.channel.send({
                    content: `${newOwner}`,
                    embeds: [this.privateRoom.displayEmbed(state, {
                        mentionable: JSON.parse(voiceUser[0].mentionable),
                        membersAdmin: JSON.parse(voiceUser[0].membersAdmin),
                        membersBanned: JSON.parse(voiceUser[0].membersBanned)
                    })],
                    components: this.privateRoom.displayButtons({
                        isHidden: voiceUser[0].isHidden,
                        isPrivate: voiceUser[0].isPrivate,
                        isMute: voiceUser[0].isMute
                    })
                });

                await this.database.table('user_voice').update({
                    ownerId: newOwner.id,
                    messageId: msg.id
                }).where("channelId", oldState.channel.id);
            }
        }
    }
}