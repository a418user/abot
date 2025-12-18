module.exports = class Event {
    constructor(client, name, rest= false) {
        this.client = client
        this.name = name
        this.rest = rest
    }

    get logger() {
        return this.client.logger;
    }

    get slashLogger() {
        return this.client.slashLogger;
    }

    get database () {
        return this.client.database;
    }

    get config () {
        return this.client.config;
    }

    get utils() {
        return this.client.functions;
    }

    get messageFormatter() {
        return this.client.messageFormatter;
    }

    setLanguage (userId) {
        const selectedLanguage = this.getLanguage(userId) || this.config['system']['defaultLanguage'];
        this.client.languages.use(selectedLanguage);
    }

    translate(text, ...values) {
        return this.client.languages.translate(text, ...values);
    }

    getLanguage (userId) {
        return this.client.languages.getLanguage(userId);
    }

    get privateRoom() {
        return this.client.privateRoomHandler
    }

    get ticket () {
        return this.client.ticketsHandler;
    }

    get emojiSuccess () {
        return this.client.emojiSuccess;
    }

    get emojiError () {
        return this.client.emojiError;
    }

    get colors () {
        return this.config.colors;
    }

    get emojis () {
        return this.config.emojis;
    }

    get invitesManager () {
        return this.client.invitesHandler;
    }

    async verificationChannelLog (data, type, guildId) {
        const baseLog = await this.database.table("guild_log").select(type).where("guild_id", guildId);
        if (!baseLog[0]) return false

        const logId = (Object.values(baseLog[0]))[0];
        const channel = data.guild.channels.cache.get(logId);
        if (!channel) return false

        if (!data.guild.members.me.permissions.has('Administrator')) {
            if (!channel.viewable) return false
            if (!channel.permissionsFor(this.client.user.id).any(['EmbedLinks', 'SendMessages'])) return false
        }
        return channel
    }

    async addVerifiedPubToMember(interaction, member) {
        // Get the pubs of the user
        const pubs = await this.database.table("user_pub_statistics").select().where({
            guild_id: interaction.guild.id,
            user_id: member.id
        });

        if (!pubs[0]) {
            // Add the pub to the user
            await this.database.table("user_pub_statistics").insert({
                guild_id: interaction.guild.id,
                user_id: member.id,
                verified_pubs: 1
            });
        }
        else {
            // Add the pub to the user
            await this.database.table("user_pub_statistics").update({
                verified_pubs: pubs[0].verified_pubs + 1
            }).where({
                guild_id: interaction.guild.id,
                user_id: member.id
            });
        }
    }

    async addVerifiedPubToChannel(interaction, channelId) {
        // Get the pubs of the channel
        const pubs = await this.database.table("guild_pub_statistics").select().where({
            guild_id: interaction.guild.id,
            channel_id: channelId
        });

        if (!pubs[0]) {
            // Add the pub to the channel
            await this.database.table("guild_pub_statistics").insert({
                guild_id: interaction.guild.id,
                channel_id: channelId,
                verified_pubs: 1
            });
        }
        else {
            // Add the pub to the channel
            await this.database.table("guild_pub_statistics").update({
                verified_pubs: pubs[0].verified_pubs + 1
            }).where({
                guild_id: interaction.guild.id,
                channel_id: channelId
            });
        }
    }
}
