const { Collection, PermissionsBitField, REST, Routes } = require("discord.js");
const fsJetpack = require('fs-jetpack');
const path = require('path');
const chalk = require('chalk');

const BASE_COLOR = "\x1b[";
const RESET = BASE_COLOR + "0m";

module.exports = class SlashCommandsHandler {
    constructor(client) {
        this.client = client
        this.utils = client.functions;
        this.slashCommands = new Collection()
    }

    getSlashCommand (command) {
        return this.slashCommands.get(command);
    }
    
    slash (command) {
        command.user_permissions.forEach((p, i) => {
            command.user_permissions[i] = PermissionsBitField.Flags[p];
        });
        const bit = command.user_permissions.reduce((a, b) => a | b, 0n).toString();
        return {
            name: command.name,
            name_localizations: command.name_localizations,
            description: command.description,
            description_localizations: command.description_localizations,
            type: command.type,
            dm_permission: command.dm_permission,
            default_member_permissions: bit !== "0" ? bit : null,
            options: command.options,
        }
    }

    async createSlashCommand (arrayOfSlashCommands, arrayOfSlashCommandsOwner) {
        if (this.client.token === process.env.DEV_TOKEN) {
            const guild = this.client.guilds.cache.get(this.client.config["system"]["serverTestId"]);
            if (!guild) return console.log(chalk.red(`Impossible de trouver le serveur ${this.client.config["system"]["serverTestId"]} !`));

            const rest = new REST({ version: '10' }).setToken(process.env.DEV_TOKEN);

            if (arrayOfSlashCommandsOwner.length !== 0) {
               this.slashCommandsArray = arrayOfSlashCommands.concat(arrayOfSlashCommandsOwner);
            }
            else {
                this.slashCommandsArray = arrayOfSlashCommands;
            }

            await (async () => {
                try {
                    console.log(chalk.cyan.bold('Starting local slash registration...'));

                    await rest.put(
                        Routes.applicationGuildCommands(this.client.user.id, guild.id),
                        {body: this.slashCommandsArray}
                    );

                    console.log(chalk.green.bold('Local slash commands registered.'));
                    console.log(chalk.gray('—'.repeat(40)));
                } catch (error) {
                    this.client.logger.error(error);
                }
            })();
        }
        else if (this.client.token === process.env.TOKEN) {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

            await (async () => {
                try {
                    console.log(chalk.cyan.bold(`Starting global slash registration...`));

                    await rest.put(
                        Routes.applicationCommands(this.client.user.id),
                        {body: arrayOfSlashCommands}
                    );

                    console.log(chalk.green.bold('Global slash commands registered.'));
                    console.log(chalk.gray('—'.repeat(40)));
                } catch (error) {
                    this.client.logger.error(error);
                }
            })();

            if (arrayOfSlashCommandsOwner.length !== 0) {
                const guildOwner = this.client.guilds.cache.get(this.client.config["system"]["serverOwnerId"]);
                if (!guildOwner) return console.log(chalk.red(`Impossible de trouver le serveur ${this.client.config["system"]["serverOwnerId"]} !`));

                await (async () => {
                    try {
                        await rest.put(
                            Routes.applicationGuildCommands(this.client.user.id, guildOwner.id),
                            {body: arrayOfSlashCommandsOwner}
                        );
                    } catch (error) {
                        this.client.logger.error(error);
                    }
                })();
            }
        }
    }

    async loadSlashCommands() {
        const files = await fsJetpack.findAsync(
            path.join(__dirname, '../../slashCommands'),
            { matching: '*.js', directories: false, files: true, ignoreCase: true, recursive: true }
        );

        if (files.length <= 0) return this.client.logger.error('Aucune slash commande trouvée !');
        this.client.logger.log(`${files.length} ${files.length>1?'slash commandes ont été chargées':'slash commande a été chargée'} !`);

        const arrayOfSlashCommands = [];
        const arrayOfSlashCommandsOwner = [];

        for (const file of files) {
            let description = null;
            let changeDescription = false;
            
            try {
                const filePath = path.join(process.cwd(), file);
                const fileClass = require(filePath);
                const fileInstance = new fileClass(this);
                
                if (fileInstance.disableSlash) continue;
                
                //ContextMenu
                if (fileInstance.type === 2 || fileInstance.type === 3) {
                    description = fileInstance.description
                    fileInstance.description = null;
                    changeDescription = true;
                }
                
                if (fileInstance.ownerOnly) {
                    arrayOfSlashCommandsOwner.push(this.slash(fileInstance));
                }
                else {
                    arrayOfSlashCommands.push(this.slash(fileInstance));
                }
                
                if (changeDescription) fileInstance.description = description
                this.slashCommands.set(fileInstance.name, fileInstance);
            }
            catch (e) {
                this.client.logger.error(`Erreur de chargement de la commande slash ${file}: ${e}`);
            }
        }
            this.client.once('ready', async () => {
                if (process.env.DEPLOY_SLASH === 'true') await this.createSlashCommand(arrayOfSlashCommands, arrayOfSlashCommandsOwner);

                const usersCount = this.utils.numberWithSpaces(this.client.guilds.cache.map((g) => g.memberCount).reduce((p, c) => p + c));
                const guildsCount = this.client.guilds.cache.size;

                console.log(`${BASE_COLOR + "35m"}`);
                console.log(`╭─ ${this.client.user.displayName} — READY ${'─'.repeat(20)}`);
                console.log(`│ Users : ${usersCount}`);
                console.log(`│ Guilds : ${guildsCount}`);
                console.log(`│ Status : ONLINE`);
                console.log(`╰${'─'.repeat(34)}\n` + RESET);
            });
    }
}
