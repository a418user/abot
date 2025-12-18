module.exports = class FetchInvites {
  constructor(event) {
    this.client = event.client;
    this.database = event.database;
    this.utils = event.utils;
    this.logger = event.logger;
    this.invitesManager = event.invitesManager;
    this.translate = event.translate.bind(event);
  }

  async handle() {
    // Wait that the bot start
    await this.utils.sleep(2000);

    // Get all guilds which the system is enabled
    const invitesConfig = await this.database
      .table("guild_invite_config")
      .select();
    const enabledGuildWord = invitesConfig.length > 1 ? 'servers' : 'server';
    this.logger.debug(`Invite system initialized for ${invitesConfig.length} ${enabledGuildWord}.`);

    for (const guild of this.client.guilds.cache.values()) {
      // Verify if the guild has invites enabled
      if (!invitesConfig.find((config) => config.guild_id === guild.id))
        continue;

      // Add the guild to the cache
      await this.invitesManager.cacheGuildInvites(guild);
    }

    this.logger.debug('Invites cached successfully.');
  }
};
