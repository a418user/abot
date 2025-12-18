const axios = require('axios');

module.exports = class CommandContext {
    constructor (client, command, interaction) {
        this.client = client
        this.command = command
        this.inter = interaction
        this.options = interaction.options
    }

    get config () {
        return this.client.config;
    }

    get database () {
        return this.client.database;
    }

    get utils() {
        return this.client.functions;
    }

    get messageFormatter() {
        return this.client.messageFormatter;
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

    translate(text, ...values) {
        const selectedLanguage = this.getLanguage(this.user.id) || this.config['system']['defaultLanguage'];
        this.client.languages.use(selectedLanguage);
        return this.client.languages.translate(text, ...values);
    }

    getLanguage (userId) {
        return this.client.languages.getLanguage(userId);
    }

    get invitesManager () {
        return this.client.invitesHandler;
    }

    get guild () {
        return this.inter.guild;
    }

    get me () {
        return this.guild.members.me;
    }

    get user () {
        return this.member.user;
    }

    get member () {
        return this.inter.member;
    }

    get channel () {
        return this.inter.channel;
    }

    async getUser (id) {
        const user = this.client.users.cache.get(id);
        if (user) return user

        let data = null;
        try {
            data = await axios.get(`https://discord.com/api/users/${id}`, {
                headers: {
                    'User-Agent': this.client.user.displayName,
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${this.client.token}`
                }
            });
        } catch {
            return undefined
        }

        return (data.data || undefined);
    }

    getMember (memberId) {
        return this.guild.members.cache.get(memberId);
    }

    getChannel (channelId) {
        return this.guild.channels.cache.get(channelId);
    }

    getRole (roleId) {
        return this.guild.roles.cache.get(roleId);
    }
    
    getGuild (guildId) {
        return this.client.guilds.cache.get(guildId);
    }
    
    async send (content) {
        if (this.inter && !this.inter.replied) {
            if (typeof content === 'string') {
                content = {
                    content,
                    flags: 64
                }
            }

            this.inter.reply(content)

            return this.inter.fetchReply()
                .then((data) => data)
                .catch(() => null)
        }

        return this.channel?.send(content)
    }

    success (content) {
        return this.send(this.messageFormatter.success(content));
    }

    error (content) {
        return this.send(this.messageFormatter.error(content));
    }
}
