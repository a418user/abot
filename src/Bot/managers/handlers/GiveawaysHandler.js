const { GiveawaysManager } = require('discord-giveaways');

module.exports = class GiveawayManager {
    constructor(client) {
        this.client = client;
        this.config = client.config;
    }

    loadGiveaway () {
        this.client.giveaways = new GiveawaysManager(this.client, {
            storage: './giveaways.json',
            hasGuildMembersIntent: true,
            default: {
                botsCanWin: false,
                embedColor: this.config.colors.blue,
                embedColorEnd: this.config.colors.pink,
                reaction: '🎉',
            }
        });
    }
}