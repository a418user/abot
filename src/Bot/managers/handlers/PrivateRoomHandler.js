const { EmbedBuilder, ButtonBuilder, MentionableSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
module.exports = class PrivateRoomHandler {
    constructor(client) {
        this.client = client
    }

    displayEmbed(state, data) {
        const members = data.mentionable.members
            .filter((member) => state.guild.members.cache.has(member))
            .map((member) => state.guild.members.cache.get(member));

        const roles = data.mentionable.roles
            .filter((role) => state.guild.roles.cache.has(role))
            .map((role) => state.guild.roles.cache.get(role));

        const admin = data.membersAdmin
            .filter((member) => state.guild.members.cache.has(member))
            .map((member) => state.guild.members.cache.get(member));

        const banned = data.membersBanned
            .filter((member) => state.guild.members.cache.has(member))
            .map((member) => state.guild.members.cache.get(member));

        return new EmbedBuilder()
            .setColor(state.guild.members.me.displayHexColor)
            .addFields([
                {
                    name: '» Utilisateurs & Rôles ajoutés',
                    value: members.length > 0 && roles.length > 0 ? `${members.join('\n')}\n${roles.join('\n')}` : members.length > 0 ? members.join('\n') : roles.length > 0 ? roles.join('\n') : 'Aucun',
                    inline: true
                },
                {
                    name: '» Utilisateurs admins',
                    value: admin.length > 0 ? admin.join('\n') : 'Aucun',
                    inline: true
                },
                {
                    name: '» Utilisateurs bannis',
                    value: banned.length > 0 ? banned.join('\n') : 'Aucun',
                    inline: true
                }
            ])
    }

    displayButtons(data) {
        const buttonVisible = new ButtonBuilder()
            .setCustomId('room_visible')
            .setEmoji('👁️')
            .setStyle(2)

        const buttonPrivate = new ButtonBuilder()
            .setCustomId('room_private')
            .setEmoji(data.isPrivate ? '🔒' : '🔓')
            .setStyle(2)

        const buttonMute = new ButtonBuilder()
            .setCustomId('room_mute')
            .setEmoji(data.isMute ? '🔇' : '🔊')
            .setStyle(2)

        const buttonRename = new ButtonBuilder()
            .setCustomId('room_rename')
            .setEmoji('✏️')
            .setStyle(2)

        const menu = new MentionableSelectMenuBuilder()
            .setCustomId('room_mentionable')
            .setPlaceholder('➜ Ajouter membre(s) et rôle(s)')
            .setMinValues(0)
            .setMaxValues(20)

        return [new ActionRowBuilder()
            .addComponents(buttonVisible, buttonPrivate, buttonMute, buttonRename),
            new ActionRowBuilder()
                .addComponents(menu)]
    }
}