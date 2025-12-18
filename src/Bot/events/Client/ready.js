const Events = require("../../managers/structures/Events");

const FetchInvites = require("../../services/Invite/FetchInvites");
const CronStatistics = require("../../services/Cron/Statistics");
const CronStatisticsOwner = require("../../services/Cron/StatisticsOwner");
const Reminder = require("../../services/Cron/Reminder");
const Prison = require("../../services/Cron/Prison");
const PrivateChannel = require("../../services/Cron/PrivateChannel");
const CronBirthday = require("../../services/Cron/Birthday");
const CronRecurrent = require("../../services/Cron/Recurrent");

module.exports = class Ready extends Events {
  constructor(client) {
    super(client, "ready");
    this.fetchInvites = new FetchInvites(this);
    this.cronStatistics = new CronStatistics(this);
    this.cronStatisticsOwner = new CronStatisticsOwner(this);
    this.reminder = new Reminder(this);
    this.prison = new Prison(this);
    this.privateChannel = new PrivateChannel(this);
    this.cronBirthday = new CronBirthday(this);
    this.cronRecurrent = new CronRecurrent(this);
  }

  async handle() {
    this.logger.ready(this.client.user.displayName + " est connecté !");
    await this.client.user.setStatus("online");
    await this.client.user.setActivity("abot V1", { type: 3 });

    this.messageFormatter.init();

    // Load Statistics for the Dashboard
    await this.client.statistics.restoreCommandsPerDay();

    // Fetch all the invites
    await this.fetchInvites.handle();

    // Start the cron statistics
    await this.cronStatistics.handle();

    // Start the cron statistics owner
    await this.cronStatisticsOwner.handle();

    // Start the cron reminder
    await this.reminder.handle();

    // Start the cron prison
    await this.prison.handle();

    // Start the cron private channel
    await this.privateChannel.handle();

    // Start the cron birthday
    await this.cronBirthday.handle();

    // Start the cron recurrent
    await this.cronRecurrent.handle();
  }
};
