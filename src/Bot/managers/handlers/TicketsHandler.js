const { EmbedBuilder } = require("discord.js");

module.exports = class TicketsHandler {
    constructor(client) {
        this.client = client;
    }

    async checkIfCommandIsInValidChannel (ctx, database) {
        const base = await this.client.database.table(database).select('category_id','choice_type','log_id','category_close_id').where({guild_id: ctx.guild.id});
        if (!base[0]) return `${this.client.emojiError} Cette commande n'est pas disponible ici !`;

        let isCategory = false;

        for (let i = 0; i < base.length; i++) {
            if (base[i].category_id === ctx.channel.parentId) isCategory = true
        }

        if (!isCategory) return `${this.client.emojiError} Cette commande n'est pas disponible ici !}`;
        return true;
    }

    checkIfChannelExists (inter, database) {
        if (!inter.guild.channels.cache.get(database.category_id)) return false;
        if (!inter.guild.channels.cache.get(database.category_close_id)) return false;
        if (!inter.guild.channels.cache.get(database.log_id)) return false;
        if (!inter.guild.channels.cache.get(database.archive_id)) return false;
        return true
    }

    async checkIfHasTicketOpen (inter, database, type) {
        if (database ==='user_ticket') {
            const ticketUserDatabase = await this.client.database.table('user_ticket').select().where({guild_id: inter.guild.id, user_id: inter.user.id});
            if (!ticketUserDatabase[0]) return false;

            const channel = inter.guild.channels.cache.get(ticketUserDatabase[0].ticket_id);
            if (!channel) {
                await this.client.database.table('user_ticket').delete().where({guild_id: inter.guild.id, user_id: inter.user.id});
                return false;
            }
            return ticketUserDatabase[0];
        }
        else {
            const ticketUserDatabase = await this.client.database.table(database).select().where({guild_id: inter.guild.id, user_id: inter.user.id, choice_type: type});
            if (!ticketUserDatabase[0]) return false;

            const channel = inter.guild.channels.cache.get(ticketUserDatabase[0].ticket_id);
            if (!channel) {
                await this.client.database.table(database).delete().where({guild_id: inter.guild.id, user_id: inter.user.id, choice_type: type});
                return false;
            }
            return ticketUserDatabase[0];
        }
    }

    embedLogTicket (color, valueField, user = false) {
        if (user !== false) return new EmbedBuilder()
            .setAuthor({name: `${user.user.displayName}`, iconURL: `${user.user.displayAvatarURL()}`})
            .setColor(color)
            .addFields([
                {name: 'Log informations',value: `${valueField}`}
            ])

        return new EmbedBuilder()
            .setAuthor({name: 'Membre inconnu'})
            .setColor(color)
            .addFields([
                {name: 'Log informations',value: `${valueField}`}
            ])
    }

    getAllTypeTickets (inter, database) {
        const list = [];

        for (let i = 0; i < database.length; i++) {
            const iteration = {};
            iteration.choice_type = database[i].choice_type;

            database[i].emoji ? iteration.emoji = database[i].emoji : iteration.emoji = '🎫';
            database[i].description ? iteration.description = database[i].description : iteration.description = "Catégorie de tickets";

            list.push(iteration);
        }

        return list;
    }

    formatString (str) {
        return `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`
    }
}