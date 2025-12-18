const talkedRecently = new Map();

module.exports = class ChomeurMessage {
    constructor (client) {
        this.client = client
        this.database = client.database
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    async handle (message) {
        // Check if the message is sent by a bot or not in a guild
        if (message.author.bot || !message.guild) return

        const easterEggs = await this.database.table("guild_easter_eggs").select().where('guild_id', message.guild.id);
        if (!easterEggs[0]) return

        if (this.getRandomInt(3) !== 1) return
        if (talkedRecently.has(message.guild.id)) return

        if (message.content.toLowerCase().endsWith("quoi")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/quoi.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("oui")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/oui.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("non")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/non.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("ok")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/ok.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("hm")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/hm.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("ouais")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/ouais.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("yo")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/yo.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("salut")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/salut.mp4"
                ]
            });
        }
        else if (message.content.toLowerCase().endsWith("lol")) {
            message.reply({
                files: [
                    "./src/Bot/assets/media/lol.mp4"
                ]
            });
        }

        talkedRecently.set(message.guild.id, true)
        setTimeout(() => {
            talkedRecently.delete(message.guild.id);
        }, 60 * 1000);
    }
}
