const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = class PrivateRoomWaiting {
    constructor (event) {
        this.client = event.client
        this.database = event.database
        this.privateRoom = event.privateRoom
    }

    async handle (oldState, newState) {
        const state = newState.channelId !== null ? newState : oldState;

        const voiceUser = await this.database.table('user_voice').where('channelWaitingId', state.channelId).first();
        if (!voiceUser || voiceUser.ownerId === state.member.id) return;

        // Join channel
        if ((!oldState.channelId && newState.channelId) || (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId)) {
            const embed = new EmbedBuilder()
                .setColor(state.guild.members.me.displayHexColor)
                .setDescription(`> \`${state.member.user.username}\` **souhaite** rejoindre ton salon vocal.`)
                .setFooter({ text: `User ID : ${state.member.id}` })

            const buttonAccept = new ButtonBuilder()
                .setCustomId('waiting_accept')
                .setEmoji(`${this.client.emojiSuccess}`)
                .setStyle(2)

            const buttonRefuse = new ButtonBuilder()
                .setCustomId('waiting_refuse')
                .setEmoji(`${this.client.emojiError}`)
                .setStyle(2)

            const buttonBan = new ButtonBuilder()
                .setCustomId('waiting_ban')
                .setEmoji('🔨')
                .setStyle(2)

            const actionRow = new ActionRowBuilder()
                .addComponents(buttonAccept)
                .addComponents(buttonRefuse)
                .addComponents(buttonBan)

            const channel = state.guild.channels.cache.get(voiceUser.channelId);

            const msg = await channel.send({ embeds: [embed], components: [actionRow] });

            await this.database.table('user_voice_waiting').insert({
                channelId: voiceUser.channelId,
                channelWaitingId: state.channelId,
                messageId: msg.id,
                userId: state.member.id
            });
        }
        // Leave channel
        else if ((!newState.channelId && oldState.channelId) || (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId)) {
            const userVoiceWaiting = await this.database.table('user_voice_waiting').where('channelWaitingId', state.channelId).first();
            if (!userVoiceWaiting) return;

            const channel = state.guild.channels.cache.get(voiceUser.channelId);

            const msg = await channel.messages.fetch(userVoiceWaiting.messageId).catch(() => null);
            if (msg) await msg.edit({ components: [] }).catch(() => null);

            await this.database.table('user_voice_waiting').delete().where('channelWaitingId', state.channelId);
        }
    }
}