module.exports = class SlashCommand {
    constructor(handler, opts = {}) {
        this.handler = handler;

        this.name = (opts.name || '');
        this.name_localizations = (opts.name_localizations || {});
        this.description = (opts.description || {});
        this.description_localizations = (opts.description_localizations || {});
        this.type = (opts.type || null);
        this.dm_permission = (opts.dm_permission || false);
        this.options = (opts.options || []);

        this.disableSlash = (opts.disableSlash || false);
        this.ownerOnly = (opts.ownerOnly || false);
        this.hiddenInHelp = (opts.hiddenInHelp || false);
        
        this.category = (opts.category || SlashCommand.Categories.General);
        this.user_permissions = (opts.user_permissions || []);
        this.bot_permissions = (opts.bot_permissions || []);
    }

    static get Categories () {
        return {
            Admin: {
                id: 1,
                name : "Administration",
                emoji: "🔒"
            },
            Management: {
                id: 2,
                name : "Gestion",
                emoji: "🔧"
            },
            Moderation: {
                id: 3,
                name : "Modération",
                emoji: "🔨"
            },
            Forms: {
                id: 4,
                name : "Candidatures",
                emoji: "📝"
            },
            Economy: {
                id: 5,
                name : "Économie",
                emoji: "💰"
            },
            Levels: {
                id: 6,
                name: "Niveaux",
                emoji: "🆙"
            },
            Ticket: {
                id: 7,
                name : "Tickets",
                emoji: "🎫"
            },
            Invites: {
                id: 8,
                name : "Invitations",
                emoji: "📨"
            },
            Giveaways: {
                id: 9,
                name : "Giveaways",
                emoji: "🎉"
            },
            General : {
                id: 10,
                name : "General",
                emoji: "⭐"
            },
            Fun: {
                id: 11,
                name : "Fun",
                emoji: "🎮"
            },
            Information: {
                id: 110,
                name : "Information",
                emoji: "📰"
            },
            Pub: {
                id: 13,
                name : "Publicité",
                emoji: "📢"
            },
            Owner : {
                id: 100,
                name : "Propriétaire"
            },
            Hidden : {
                id: 101,
                name : "Caché"
            }
        }

    }

    get client () {
        return this.handler.client
    }

    get config () {
        return this.client.config
    }
}
