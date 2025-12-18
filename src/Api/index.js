const express = require('express');
const chalk = require('chalk');
const moment = require("moment");
const bodyParser = require('body-parser');
const cors = require('cors');

const SlashCommand = require('../Bot/managers/structures/SlashCommands');

module.exports = class Api {
    constructor(client) {
        /* Get config */
        this.client = client
        this.config = require('../../config.json')
        this.hostname = this.config["api"]["hostname"]
        this.port = this.config["api"]["port"]
        this.link = this.config["api"]["link"]

        /* Define app */
        this.app = express();
        this.app
            .use(bodyParser.json({type: 'application/json'}))

        /* Define middleware */
        this.app.use(cors());

        /* Define router */
        this.app
          .get('/stats', async (req, res) => {
            try {
              const guildsCount = this.client.guilds.cache.size;
              const usersCount = this.client.guilds.cache.map((guild) => guild.memberCount).reduce((p, c) => p + c);
              const categoriesCount = Object.keys(SlashCommand.Categories).length - 2;
              const commandsCount = client.slashCommandsHandler.slashCommands.size;

              res.setHeader('Access-Control-Allow-Methods', 'GET');
              res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

              res.json({ guildsCount, usersCount, categoriesCount, commandsCount });
            }
            catch (e) {
              console.log('API Error :', e);
              res.status(500).json({ error: 'Internal Server Error' });
            }
          });

        /* Error page */
        this.app.use('*', (req,res) => res.status(404).json({ error: "Not Found" }));
    }

    start() {
        this.app.listen(this.port, this.hostname, (err) => {
            if (err) throw err;

            const timestamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}] :`;
            console.log(chalk.gray("—————————————————————————————————"));
            console.log(chalk.magenta.bold(`${timestamp} ${chalk.black.greenBright('READY')} API en ligne sur ${this.link}`));
        });
    }
}
