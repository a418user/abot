const { Client } = require("discord.js");

const Logger = require("./loggers/Logger");
const SlashLogger = require("./loggers/SlashLogger");

const Functions = require("./utils/Functions");
const MessageFormatter = require("./utils/MessageFormatter");
const EventsHandler = require("./handlers/EventsHandler");
const SlashCommandsHandler = require("./handlers/SlashCommandsHandler");
const Translate = require("./handlers/TranslateHandler");
const Database = require("./Database");

const PrivateRoomHandler = require("./handlers/PrivateRoomHandler");
const GiveawaysHandler = require("./handlers/GiveawaysHandler");
const InvitesHandler = require("./handlers/InvitesHandler");
const TicketsHandler = require("./handlers/TicketsHandler");

const Statistics = require("./utils/Statistics");
const Dashboard = require("../../Dashboard/structures/Server.js");
const Api = require("../../Api/index.js");

const { ToadScheduler } = require("toad-scheduler");

require('dotenv').config();

module.exports = class Bot extends Client {
    constructor(options) {
        super(options)
        this.config = require("../../../config.json")

        this.logger = new Logger()
        this.slashLogger = new SlashLogger()

        this.functions = new Functions(this)
        this.messageFormatter = new MessageFormatter(this)

        this.eventsHandler = new EventsHandler(this)
        this.slashCommandsHandler = new SlashCommandsHandler(this)

        this.languages = new Translate(this)
        this.database = new Database(this)

        this.privateRoomHandler = new PrivateRoomHandler(this)
        this.giveawaysHandler = new GiveawaysHandler(this)
        this.invitesHandler = new InvitesHandler(this)
        this.ticketsHandler = new TicketsHandler(this)

        this.statistics = new Statistics(this);
        this.dashboard = new Dashboard(this, process.env.PROD === "false");
        this.api = new Api(this);

        this.scheduler = new ToadScheduler();
    }

    async start() {
        await this.database.loadDatabase();
        await this.eventsHandler.loadEvents();
        await this.slashCommandsHandler.loadSlashCommands();
        await this.languages.load();

        this.giveawaysHandler.loadGiveaway();

        if (process.env.dev_mode) await this.login(process.env.DEV_TOKEN);
        else await this.login(process.env.TOKEN);

        if (process.env.DISABLE_DASHBOARD === "false") await this.dashboard.start();
        if (process.env.DISABLE_API === "false") await this.api.start();
    }
}
