const Events = require('../../managers/structures/Events');

const PingBotMessage = require('../../services/Client/PingBotMessage');
const AbsenceMention = require('../../services/Pub/AbsenceMention');
const PubSent = require('../../services/Pub/PubSent');
const ChomeurMessage = require('../../services/System/ChomeurMessage');
const LevelsMessage = require('../../services/Levels/LevelsMessage');
const SuggestionMessage = require('../../services/Suggestion/SuggestionMessage');

module.exports = class MessageCreate extends Events {
    constructor (client) {
        super(client, 'messageCreate')
        this.pingBotMessage = new PingBotMessage(this)
        this.absenceMention = new AbsenceMention(this)
        this.pubSent = new PubSent(this)
        this.chomeurMessage = new ChomeurMessage(this)
        this.levelsMessage = new LevelsMessage(this)
        this.suggestionMessage = new SuggestionMessage(this)
    }

    async handle (message) {
        /* Ping bot message */
        await this.pingBotMessage.handle(message);

        /* Absence mention */
        await this.absenceMention.handle(message);

        /* Pub sent */
        await this.pubSent.handle(message);

        /* Chomeur message */
        await this.chomeurMessage.handle(message);

        /* Levels message */
        await this.levelsMessage.handle(message);

        /* Suggestion message */
        await this.suggestionMessage.handle(message);
    }
}
