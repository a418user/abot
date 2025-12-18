const Events = require('../../managers/structures/Events');

const SlashCommandsService = require('../../services/Client/SlashCommandsService.js');
const ReactionRole = require('../../services/System/ReactionRole');
const RulesButton = require('../../services/System/RulesButton');
const TicketButtonService = require('../../services/System/TicketButton');
const AbsenceButton = require('../../services/Pub/AbsenceButton');
const PubButton = require('../../services/Pub/PubButton');
const PollButton = require('../../services/System/PollButton');
const FeedbackMenu = require('../../services/System/FeedbackMenu');
const PrivateRoomButton = require('../../services/PrivateRoom/PrivateRoomButton.js');
const PrivateRoomMenu = require('../../services/PrivateRoom/PrivateRoomMenu.js');
const SuggestionButton = require('../../services/Suggestion/SuggestionButton.js');

module.exports = class InteractionCreate extends Events {
    constructor (client) {
        super(client, 'interactionCreate')
        this.slashCommandsService = new SlashCommandsService(this)
        this.reactionRole = new ReactionRole(this)
        this.rulesButton = new RulesButton(this)
        this.ticketButtonService = new TicketButtonService(this)
        this.absenceButton = new AbsenceButton(this)
        this.pubButton = new PubButton(this)
        this.pollButton = new PollButton(this)
        this.feedbackMenu = new FeedbackMenu(this)
        this.privateRoomButton = new PrivateRoomButton(this)
        this.privateRoomMenu = new PrivateRoomMenu(this)
        this.suggestionButton = new SuggestionButton(this)
    }

    async handle (inter) {
        /* Slash Commands */
        await this.slashCommandsService.handle(inter);

        /* Reaction Role */
        await this.reactionRole.handle(inter);

        /* Rules Button */
        await this.rulesButton.handle(inter);

        /* Ticket */
        await this.ticketButtonService.handle(inter);

        /* Absence */
        await this.absenceButton.handle(inter);

        /* Pub */
        await this.pubButton.handle(inter);

        /* Poll */
        await this.pollButton.handle(inter);

        /* Feedback Menu */
        await this.feedbackMenu.handle(inter);

        /* Private Room Button */
        await this.privateRoomButton.handle(inter);

        /* Private Room Menu */
        await this.privateRoomMenu.handle(inter);

        /* Suggestion Button */
        await this.suggestionButton.handle(inter);
    }
}
