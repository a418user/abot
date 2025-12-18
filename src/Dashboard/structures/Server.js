const Log = require('./Logger.js');
const Util = require('../structures/Util');

const { Client } = require("@linux123123/jspteroapi");
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const favicon = require('serve-favicon');
const path = require('path');

module.exports = class Dashboard {
    constructor(client, isDev = false) {
        /* Get config */
        this.client = client
        this.isDev = isDev
        this.database = client.database
        this.statistics = client.statistics
        this.config = require('../../../config.json')
        this.sessionSecret = this.config["dashboard"]["sessionSecret"]
        this.port = this.config["dashboard"]["port"]
        this.link = this.config["dashboard"][this.isDev ? 'linkDev' : 'link']
        this.functions = client.functions

        /* Load pterodactyl config */
        this.pterodactylClient = new Client(`${this.config["pterodactyl"]["url"]}`, `${this.config["pterodactyl"]["apiKeyClient"]}`);
        this.serverId = this.config["pterodactyl"]["serverId"];

        /* Define app */
        this.server = express();
        this.http = require('http').createServer(this.server);
        this.io = require('socket.io')(this.http);

        /* Define parameters */
        this.server.engine("html", require("ejs").renderFile)
            .set('views', path.join(__dirname, '../views'))
            .set('view engine', 'ejs')
            .set('port', this.port)
            .use(session({
                secret: this.sessionSecret,
                resave: false,
                saveUninitialized: true
            }))
            .use(express.json())
            .use(bodyParser.urlencoded({extended: true}))
            .use(express.static(path.join(__dirname, '../public')))
            .use(favicon(path.join(__dirname, '../public', 'assets', 'favicon.ico')))
            .use((req, res, next) => {
                req.client = this.client;
                req.functions = this.functions;
                req.database = this.database;
                req.pterodactyl = this.pterodactylClient;
                req.pterodactylServerId = this.serverId;
                req.util = Util
                req.botInvite = this.config["system"]["linkInviteBot"]
                next();
            })

        /* Passport Middleware */
        require('../auth/passport.js')(passport);
        this.server.use(passport.initialize())
            .use(passport.session())

        /* Define Routes */
        this.server.use("/", require("../routes/index.js"))
            .use("/profile", require("../routes/profile.js"))
            .use("/settings", require("../routes/settings.js"))
            .use("/administration", require("../routes/administration.js"))
            .use("/servers", require("../routes/servers.js"))
            .use("/messages", require("../routes/messages.js"))
            .use("/logs", require("../routes/logs.js"))
            .use("/roles", require("../routes/roles.js"))
            .use("/voice", require("../routes/voice.js"))
            .use("/suggestions", require("../routes/suggestions.js"))
            .use("/channels", require("../routes/channels.js"))
            .use("/economy", require("../routes/economy.js"))
            .use("/levels", require("../routes/levels.js"))
            .get("*", (req,res) => res.redirect("/"));
    }

    async start() {
        /* Start server */
        this.http.listen(this.port, () => Log.ready(`DASHBOARD en ligne sur ${this.link}`));

        /* Socket.io */
        this.io.sockets.on('connection', (sockets) => {
            /* Uptime */
            setInterval(async () => {
                /* Uptime count */
                const days = Math.floor(this.client.uptime / 86400000);
                const hours = Math.floor(this.client.uptime / 3600000) % 24;
                const minutes = Math.floor(this.client.uptime / 60000) % 60;
                const seconds = Math.floor(this.client.uptime / 1000) % 60;

                const botUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`

                /* Emit to browser */
                sockets.emit('uptime', {
                    uptime: botUptime
                });

                /* Statistics */
                const statisticsDay = this.statistics.getDate();

                /* Commands */
                const statistics = this.statistics.getCommandsPerDay();
                const allDays = Array.from(statistics.keys())
                const allCommands = Array.from(statistics.values())

                /* Emit to browser */
                sockets.emit('cmdPerDay', {
                    allDays: allDays,
                    allCommands: allCommands,
                    day: statisticsDay
                });

                /* Servers */
                const serversNew = this.statistics.getNewServerPerDay();
                const serverLost = this.statistics.getLostServerPerDay();
                const allDaysServers = Array.from(serversNew.keys())
                const allServersNew = Array.from(serversNew.values())
                const allServersLost = Array.from(serverLost.values())

                /* Emit to browser */
                sockets.emit('serversPerDay', {
                    allDays: allDaysServers,
                    allServersNew: allServersNew,
                    allServersLost: allServersLost,
                    day: statisticsDay
                });

                /* Feedback */
                const feedback = await this.database.table('feedback').select();

                /* Use a function to get all the same choice together to count them */
                const data = feedback.reduce((acc, f) => {
                    if (!acc[f.choice]) acc[f.choice] = 0;
                    acc[f.choice]++;
                    return acc;
                }, {});

                const choiceList = ['support', 'website', 'topgg', 'disboard', 'other']
                const totalFeedback = feedback.length;

                let percentage = [];
                for (const choice of choiceList) {
                    const count = data[choice] || 0;
                    percentage.push((count / totalFeedback * 100).toFixed(0));
                }

                /* Emit to browser */
                sockets.emit('feedback', {
                    data: percentage
                });

                /* Servers */
                /* Use a function to order all the guilds of the bot by member count */
                const guilds = this.client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).map(g => g);

                /* Get only the first 10 guilds with its name and member count separated in 2 arrays*/
                const topGuilds = guilds.slice(0, 10).reduce((acc, guild) => {
                    acc.guildName.push(guild.name);
                    acc.membersCount.push(guild.memberCount);
                    return acc;
                }, { guildName: [], membersCount: [] });

                /* Emit to browser */
                sockets.emit('globalServers', {
                    topGuilds: topGuilds
                });
            }, 1000);
        });
    }
}
