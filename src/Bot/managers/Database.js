module.exports = class Knex {
    constructor(client) {
        this.client = client;
        this.config = client.config;
    }

    table (tableName) {
        return this.knex(tableName);
    }

    hasTable (tableName) {
        return this.knex.schema.hasTable(tableName);
    }

    async loadDatabase() {
        if (process.env.PROD === "false") {
            this.knex = require('knex')(this.config['databaseDev']);
        }
        else {
            this.knex = require('knex')(this.config['database']);

            this.knex.raw("SELECT VERSION()").then(
                (version) => console.log((version[0][0]))
            ).catch((err) => { console.log( err); throw err })
                .finally(() => {});
        }

        this.client.once('ready', async () => {await this.checkAndUpdate();});
    }

    dropColumn (tableName, columnName) {
        return this.knex.schema.table(tableName, table => {
            table.dropColumn(columnName);
        });
    }

    async upColumn (tableName, columnName, columnType, length) {
        const hasColumn = await this.knex.schema.hasColumn(tableName, columnName);
        if (hasColumn) return;
        
        if (columnType === 'string') {
            return this.knex.schema.table(tableName, table => {
                table.string(columnName, length);
            });
        }
        else if (columnType === 'integer') {
            return this.knex.schema.table(tableName, table => {
                table.integer(columnName);
            });
        }
        else if (columnType === 'bigInteger') {
            return this.knex.schema.table(tableName, table => {
                table.bigInteger(columnName);
            });
        }
        else if (columnType === 'boolean') {
            return this.knex.schema.table(tableName, table => {
                table.boolean(columnName).defaultTo(false);
            });
        }
        else if (columnType === 'json') {
            return this.knex.schema.table(tableName, table => {
                //table.json(columnName).defaultTo(JSON.stringify({ accepted: [], neutral: [], refused: [] }));
                table.json(columnName);
            });
        }
        else if (columnType === 'timestamp') {
            return this.knex.schema.table(tableName, table => {
                table.timestamp(columnName).defaultTo(this.knex.fn.now());
            });
        }
    }

    async deleteTable (tableName, ...args) {
        const base = await this.knex.table(tableName).select().where(...args);
        if (base[0]) await this.knex.table(tableName).delete().where(...args);
    }

    async checkAndUpdate () {
        // Admin dashboard
        const hasTableAdminDashboard = await this.knex.schema.hasTable("admin_dashboard");
        if (!hasTableAdminDashboard) await this.knex.schema.createTable('admin_dashboard', function(t) {
            t.increments('id').notNullable().primary();
            t.string('userId', 20);
        });

        // Anti ban
        const hasTableAntiBan = await this.knex.schema.hasTable("admin_anti_ban");
        if (!hasTableAntiBan) await this.knex.schema.createTable('admin_anti_ban', function(t) {
            t.increments('id').notNullable().primary();
            t.string('user_id', 20);
        });

        // Language of the bot
        const hasTableLanguage = await this.knex.schema.hasTable("languages");
        if (!hasTableLanguage) await this.knex.schema.createTable('languages', function(t) {
            t.increments('id').notNullable().primary();
            t.string('userId', 20);
            t.string('language', 10);
        });

        // ReactionRole
        const hasTableReactionRole = await this.knex.schema.hasTable("guild_reaction_role");
        if (!hasTableReactionRole) await this.knex.schema.createTable('guild_reaction_role', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.json('roles_id',);
            t.json('embed_data');
        });

        // Auto-role system
        const hasTableAutoRole = await this.knex.schema.hasTable("guild_auto_role");
        if (!hasTableAutoRole) await this.knex.schema.createTable('guild_auto_role', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.json('roles').defaultTo(JSON.stringify([]));
        });

        // Ghost ping mention system
        const hasTableGhostPing = await this.knex.schema.hasTable("guild_ghost_ping");
        if (!hasTableGhostPing) await this.knex.schema.createTable('guild_ghost_ping', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
        });

        // Welcome system
        const hasTableWelcome = await this.knex.schema.hasTable("guild_welcome");
        if (!hasTableWelcome) await this.knex.schema.createTable('guild_welcome', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_welcome_id', 20);
            t.string('channel_leave_id', 20);
            t.string('msg_bvn', 4050);
            t.string('msg_leave', 4050);
            t.boolean('mention').defaultTo(false);
        });

        // Invite counter config
        const hasTableInviteConfig = await this.knex.schema.hasTable("guild_invite_config");
        if (!hasTableInviteConfig) await this.knex.schema.createTable('guild_invite_config', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.json('roles').defaultTo('[]');
        });

        // Invite counter user
        const hasTableInviteUser = await this.knex.schema.hasTable("user_invite");
        if (!hasTableInviteUser) await this.knex.schema.createTable('user_invite', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('member_id', 20);
            t.string('inviter', 20);
            t.string('code', 20);
            t.bigInteger('tracked').defaultTo(0);
            t.bigInteger('fake').defaultTo(0);
            t.bigInteger('left').defaultTo(0);
            t.bigInteger('added').defaultTo(0);
        });

        // Statistics
        const hasTableStatistics = await this.knex.schema.hasTable("guild_statistics");
        if (!hasTableStatistics) await this.knex.schema.createTable('guild_statistics', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('category_id', 20);
            t.string('channel1_id', 20);
            t.string('channel2_id', 20);
            t.string('channel3_id', 20);
            t.string('channel1_name', 20);
            t.string('channel2_name', 20);
            t.string('channel3_name', 20);
        });

        // Statistics owner
        const hasTableStatisticsOwner = await this.knex.schema.hasTable("guild_statistics_owner");
        if (!hasTableStatisticsOwner) await this.knex.schema.createTable('guild_statistics_owner', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('category_id', 20);
            t.string('channel1_id', 20);
            t.string('channel2_id', 20);
            t.string('channel3_id', 20);
            t.string('channel1_name', 20);
            t.string('channel2_name', 20);
            t.string('channel3_name', 20);
        });

        // System of report
        const hasTableReport = await this.knex.schema.hasTable("guild_report");
        if (!hasTableReport) await this.knex.schema.createTable('guild_report', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
        });

        // System of rules
        const hasTableRules = await this.knex.schema.hasTable("guild_rules");
        if (!hasTableRules) await this.knex.schema.createTable('guild_rules', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('role_id', 20);
            t.json('embed_data');
        });

        // Nickname
        const hasTableNickname = await this.knex.schema.hasTable("guild_nickname");
        if (!hasTableNickname) await this.knex.schema.createTable('guild_nickname', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.json('data').defaultTo(JSON.stringify([]));
        });

        // Reminder system
        const hasTableReminder = await this.knex.schema.hasTable("guild_reminder");
        if (!hasTableReminder) await this.knex.schema.createTable('guild_reminder', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('member_id', 20);
            t.bigInteger('time');
            t.string('duration', 20);
            t.string('content', 4096);
            t.boolean('recurrent').defaultTo(false);
        });

        // Boost system
        const hasTableBoost = await this.knex.schema.hasTable("guild_boost");
        if (!hasTableBoost) await this.knex.schema.createTable('guild_boost', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.string('message_add', 4050);
            t.string('message_remove', 4050);
            t.boolean('mention').defaultTo(false);
        });

        // User money
        const hasTableUserMoney = await this.knex.schema.hasTable("user_money");
        if (!hasTableUserMoney) await this.knex.schema.createTable('user_money', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('user_id', 20);
            t.bigInteger('money');
            t.bigInteger('last_daily');
        });

        // Guild money
        const hasTableGuildMoney = await this.knex.schema.hasTable("guild_money");
        if (!hasTableGuildMoney) await this.knex.schema.createTable('guild_money', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('name', 20);
            t.boolean('daily').defaultTo(false);
            t.boolean('daily_fix').defaultTo(true);
            t.bigInteger('daily_amount');
        });

        // User shop
        const hasTableUserShop = await this.knex.schema.hasTable("user_shop");
        if (!hasTableUserShop) await this.knex.schema.createTable('user_shop', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guild_id", 20);
            t.string("user_id", 20);
            t.string('object_name', 500);
        });

        // Guild shop
        const hasTableGuildShop = await this.knex.schema.hasTable("guild_shop");
        if (!hasTableGuildShop) await this.knex.schema.createTable('guild_shop', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guild_id", 20);
            t.string('object_name', 500);
            t.bigInteger('object_price');
        });

        // Guild Form
        const hasTableGuildForm = await this.knex.schema.hasTable("guild_form");
        if (!hasTableGuildForm) await this.knex.schema.createTable('guild_form', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guild_id", 20);
            t.string('form_name', 40);
            t.string('form_description', 550);
            t.string('role_access_id', 20);
            t.string('channel_id', 20);
            t.json('questions').defaultTo(JSON.stringify([]));
        });

        // User prison
        const hasTableUserPrison = await this.knex.schema.hasTable("user_prison");
        if (!hasTableUserPrison) await this.knex.schema.createTable('user_prison', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('user_id', 20);
            t.bigInteger('time');
            t.string('reason', 4096);
            t.json('roles').defaultTo(JSON.stringify([]));
        });

        // Guild prison
        const hasTableGuildPrison = await this.knex.schema.hasTable("guild_prison");
        if (!hasTableGuildPrison) await this.knex.schema.createTable('guild_prison', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('role_add_id', 20);
        });

        // Logs system
        const hasTableLog = await this.knex.schema.hasTable("guild_log");
        if (!hasTableLog) await this.knex.schema.createTable('guild_log', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('message_id', 20);
            t.string('update_member_id', 20);
            t.string('link_id', 20);
            t.string('update_server_id', 20);
            t.string('voice_id', 20);
        });

        // Ghost ping member system
        const hasTableGhostPingMember = await this.knex.schema.hasTable("guild_ghost_ping_member");
        if (!hasTableGhostPingMember) await this.knex.schema.createTable('guild_ghost_ping_member', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.string('channel_id_2', 20);
            t.string('channel_id_3', 20);
            t.string('channel_id_4', 20);
            t.string('channel_id_5', 20);
        });

        // Private channel system
        const hasTablePrivateChannel = await this.knex.schema.hasTable("guild_private_channel");
        if (!hasTablePrivateChannel) await this.knex.schema.createTable('guild_private_channel', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.string('user_id', 20);
            t.bigInteger('time');
        });

        // Afk system
        const hasTableAFK = await this.knex.schema.hasTable("guild_afk");
        if (!hasTableAFK) await this.knex.schema.createTable('guild_afk', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('member_id', 20);
            t.string('message_id', 20);
            t.string('reason', 2000);
            t.boolean('inPause').defaultTo(false);
        });

        // Guild pub channel system
        const hasTablePubChannel = await this.knex.schema.hasTable("guild_pub_channel");
        if (!hasTablePubChannel) await this.knex.schema.createTable('guild_pub_channel', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('category_id', 20);
            t.string('verification_channel_id', 20);
            t.string('log_channel_id', 20);
            t.json('channels');
            t.json('channels_decoration');
        });

        // Blacklist pub system
        const hasTableSanctions = await this.knex.schema.hasTable("pub_blacklist");
        if (!hasTableSanctions) await this.knex.schema.createTable('pub_blacklist', function(t) {
            t.increments('id').notNullable().primary();
            t.string('user_id', 20);
            t.string('reason', 5000);
        });

        // Guild pub system
        const hasTableGuildPub = await this.knex.schema.hasTable("guild_pub");
        if (!hasTableGuildPub) await this.knex.schema.createTable('guild_pub', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.string('author_id', 20);
            t.string('message_id', 20);
            t.string('message', 5000);
            t.string('message_verification_id', 20);
            t.boolean('inVerification');
        });

        // Guild pub statistics system
        const hasTableGuildStatisticsPub = await this.knex.schema.hasTable("guild_pub_statistics");
        if (!hasTableGuildStatisticsPub) await this.knex.schema.createTable('guild_pub_statistics', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.bigInteger('verified_pubs');
        });

        // User pub statistics system
        const hasTableUserStatisticsPub = await this.knex.schema.hasTable("user_pub_statistics");
        if (!hasTableUserStatisticsPub) await this.knex.schema.createTable('user_pub_statistics', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('user_id', 20);
            t.bigInteger('verified_pubs');
        });

        // Birthday config
        const hasTableBirthayConfig = await this.knex.schema.hasTable("guild_birthday");
        if (!hasTableBirthayConfig) await this.knex.schema.createTable('guild_birthday', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
        });

        // Birthday user
        const hasTableBirthday = await this.knex.schema.hasTable("user_birthday");
        if (!hasTableBirthday) await this.knex.schema.createTable('user_birthday', function(t) {
            t.increments('id').notNullable().primary();
            t.string('user_id', 20);
            t.integer('day', 3);
            t.string('month', 10);
            t.integer('year', 4);
            t.boolean('private_age').defaultTo(false);
        });

        // Easter eggs
        const hasTableEasterEggs = await this.knex.schema.hasTable("guild_easter_eggs");
        if (!hasTableEasterEggs) await this.knex.schema.createTable('guild_easter_eggs', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
        });

        // Poll number vote
        const hasTablePollNumber = await this.knex.schema.hasTable("poll_number");
        if (!hasTablePollNumber) await this.knex.schema.createTable('poll_number', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('message_id', 20);
            t.string('channel_id', 20);
            t.string('member_id', 20);
            t.json('vote');
            t.boolean('isClosed').defaultTo(false);
            t.boolean('isMultiple').defaultTo(false);
        });

        // Backup
        const hasTableBackup = await this.knex.schema.hasTable("backups");
        if (!hasTableBackup) await this.knex.schema.createTable('backups', (t) => {
            t.increments('id').notNullable().primary();
            t.string('user_id', 20);
            t.string('serverName', 100);
            t.string('code', 20);
            t.timestamp('createAt').defaultTo(this.knex.fn.now());
        });

        // Guild Levels
        const hasTableGuildLevels = await this.knex.schema.hasTable("guild_levels");
        if (!hasTableGuildLevels) await this.knex.schema.createTable('guild_levels', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guildId", 20);
            t.json('rewards').defaultTo(JSON.stringify([]));
            t.json('leveling').defaultTo(JSON.stringify({}));
        });

        // User Levels
        const hasTableUserLevels = await this.knex.schema.hasTable("user_levels");
        if (!hasTableUserLevels) await this.knex.schema.createTable('user_levels', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guildId", 20);
            t.string("userId", 20);
            t.bigInteger("level");
            t.bigInteger("xp");
        });

        // User vocal
        const hasTableUserVocal = await this.knex.schema.hasTable("user_vocal");
        if (!hasTableUserVocal) await this.knex.schema.createTable('user_vocal', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guildId", 20);
            t.string("userId", 20);
            t.boolean("isInVocal").defaultTo(false);
            t.bigInteger("time");
            t.bigInteger("totalTime");
        });

        // Feedback
        const hasTableFeedback = await this.knex.schema.hasTable("feedback");
        if (!hasTableFeedback) await this.knex.schema.createTable('feedback', function(t) {
            t.increments('id').notNullable().primary();
            t.string("guildId", 20);
            t.string("userId", 20);
            t.string("choice", 50);
            t.string("response", 50);
        });

        // Info on the bot for the dashboard
        const hasTableDashBoardInfo = await this.knex.schema.hasTable("dashboard_info");
        if (!hasTableDashBoardInfo) await this.knex.schema.createTable('dashboard_info', function(t) {
            t.increments('id').notNullable().primary();
            t.json('commands').defaultTo('[]');
            t.json('serversNew').defaultTo('[]');
            t.json('serversLost').defaultTo('[]');
        });

        // Voice Settings
        const hasTableVoiceSettings = await this.knex.schema.hasTable("guild_voice_settings");
        if (!hasTableVoiceSettings) await this.knex.schema.createTable('guild_voice_settings', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guildId', 20);
            t.boolean('waitingChannel').defaultTo(true);
            t.boolean('permissionsProtect').defaultTo(true);
            t.string('categoryId', 20);
            t.string('channelStartId', 20);
            t.string('channelName', 100);
            t.string('channelWaitingName', 100);
            t.integer('channelLimit').defaultTo(0);
            t.json('rolesManager').defaultTo(JSON.stringify([]));
            t.json('rolesAccepted').defaultTo(JSON.stringify([]));
            t.json('rolesRefused').defaultTo(JSON.stringify([]));
            t.json('permissions').defaultTo(JSON.stringify({}));
        });

        // Voice User
        const hasTablePrivateRoomUser = await this.knex.schema.hasTable("user_voice");
        if (!hasTablePrivateRoomUser) await this.knex.schema.createTable('user_voice', function(t) {
            t.increments('id').notNullable().primary();
            t.string('channelId', 20);
            t.string('channelWaitingId', 20);
            t.string('messageId', 20);
            t.string('ownerId', 20);
            t.boolean('isAnnounce').defaultTo(true);
            t.boolean('isHidden').defaultTo(false);
            t.boolean('isPrivate').defaultTo(true);
            t.boolean('isMute').defaultTo(false);
            t.boolean('isHiddenWaiting').defaultTo(false);
            t.boolean('isPrivateWaiting').defaultTo(true);
            t.json('mentionable').defaultTo(JSON.stringify({ roles: [], members: [] }));
            t.json('membersAdmin').defaultTo(JSON.stringify([]));
            t.json('membersBanned').defaultTo(JSON.stringify([]));
        });

        // Voice User waiting
        const hasTablePrivateRoomUserWaiting = await this.knex.schema.hasTable("user_voice_waiting");
        if (!hasTablePrivateRoomUserWaiting) await this.knex.schema.createTable('user_voice_waiting', function(t) {
            t.increments('id').notNullable().primary();
            t.string('channelId', 20);
            t.string('channelWaitingId', 20);
            t.string('messageId', 20);
            t.string('userId', 20);
        });

        // System of suggestion
        const hasTableSuggest = await this.knex.schema.hasTable("guild_suggest");
        if (!hasTableSuggest) await this.knex.schema.createTable('guild_suggest', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guildId', 20);
            t.string('channelId', 20);
            t.boolean('isMessage')
            t.boolean('isThread');
            t.json('rolesBypass').defaultTo(JSON.stringify([]));
            t.json('rolesBlacklist').defaultTo(JSON.stringify([]));
        });

        // System of suggestion
        const hasTableSuggestUser = await this.knex.schema.hasTable("user_suggest");
        if (!hasTableSuggestUser) await this.knex.schema.createTable('user_suggest', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guildId', 20);
            t.string('channelId', 20);
            t.string('threadId', 20);
            t.string('messageId', 20);
            t.string('userId', 20);
            t.json('votes').defaultTo(JSON.stringify({ accepted: [], neutral: [], refused: [] }));
        });

        // Ticket system button
        const hasTableTicket = await this.knex.schema.hasTable("guild_ticket");
        if (!hasTableTicket) await this.knex.schema.createTable('guild_ticket', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('choice_type', 50);
            t.string('category_id', 20);
            t.string('category_close_id', 20);
            t.string('name_ticket', 90);
            t.json('roles_access').defaultTo(JSON.stringify([]));
            t.string('log_id', 20);
            t.string('archive_id', 20);
            t.boolean('embed_ticket').defaultTo(false);
            t.json('embed_data');
            t.string('msg_ticket', 300);
            t.json('roles_mention');
            t.bigInteger('number_ticket');
        });

        // Ticket system menu
        const hasTableTicketMenu = await this.knex.schema.hasTable("guild_ticket_menu");
        if (!hasTableTicketMenu) await this.knex.schema.createTable('guild_ticket_menu', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('choice_type', 50);
            t.string('category_id', 20);
            t.string('category_close_id', 20);
            t.string('name_ticket', 90);
            t.json('roles_access').defaultTo(JSON.stringify([]));
            t.string('log_id', 20);
            t.string('archive_id', 20);
            t.boolean('embed_ticket');
            t.json('embed_data');
            t.string('msg_ticket', 300);
            t.json('roles_mention');
            t.boolean('first_type').defaultTo(false);
            t.bigInteger('number_ticket');
            t.string('emoji', 20);
            t.string('description', 100);
        });

        const hasTableUserTicket = await this.knex.schema.hasTable("user_ticket");
        if (!hasTableUserTicket) await this.knex.schema.createTable('user_ticket', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('user_id', 20);
            t.string('ticket_id', 20);
            t.string('choice_type', 50);
        });

        const hasTableUserTicketMenu = await this.knex.schema.hasTable("user_ticket_menu");
        if (!hasTableUserTicketMenu) await this.knex.schema.createTable('user_ticket_menu', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('user_id', 20);
            t.string('ticket_id', 20);
            t.string('choice_type', 50);
        });

        // Recurrent system
        const hasTableRecurrent = await this.knex.schema.hasTable("guild_recurrent");
        if (!hasTableRecurrent) await this.knex.schema.createTable('guild_recurrent', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guild_id', 20);
            t.string('channel_id', 20);
            t.string('message', 1000);
            t.bigInteger('time');
        });

        // Guild warns
        const hasTableGuildWarns = await this.knex.schema.hasTable("guild_warns");
        if (!hasTableGuildWarns) await this.knex.schema.createTable('guild_warns', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guildId', 20);
            t.string('channelId', 20);
            t.boolean('isDm').defaultTo(false);
        });

        // User warns
        const hasTableUserWarns = await this.knex.schema.hasTable("user_warns");
        if (!hasTableUserWarns) await this.knex.schema.createTable('user_warns', function(t) {
            t.increments('id').notNullable().primary();
            t.string('guildId', 20);
            t.string('authorId', 20);
            t.string('memberId', 20);
            t.string('date', 20);
            t.string('reason', 300);
            t.string('proofId', 40);
        });
    }
}
