const Bot = require("./src/Bot/managers/Bot.js");
const { GatewayIntentBits, Partials } = require("discord.js");
const chalk = require('chalk');

const client = new Bot({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.ThreadMember,
        Partials.Reaction,
        Partials.Message
    ],
    allowedMentions: {parse: ['users', 'roles']},
    presence: {
        status: 'invisible'
    }
});

process.on("unhandledRejection", async(reason, p) => {
    console.log(chalk.gray("—————————————————————————————————"));
    console.log(
        chalk.white("["),
        chalk.yellow.bold("UnhandledRejection"),
        chalk.white("]"),
        chalk.gray(" : "),
        chalk.white.bold(reason && reason.stack ? reason.stack.split('\n')[0] : String(reason))
    );
    console.log(chalk.gray("Promise:"));
    console.log(p);
    console.log(chalk.gray("—————————————————————————————————"));
});
process.on("uncaughtException", async(err, origin) => {
    console.log(chalk.gray("—————————————————————————————————"));
    console.log(
        chalk.white("["),
        chalk.magenta.bold("CrashGuard"),
        chalk.white("]"),
        chalk.gray(" : "),
        chalk.white.bold("Uncaught Exception/Catch"),
        chalk.gray(" - "),
        chalk.white(new Date().toISOString())
    );
    console.log(chalk.gray("—————————————————————————————————"));
    if (err && err.stack) {
        console.log(err.stack);
    } else {
        console.log(err, origin);
    }
});

client.start().then(() => {});
