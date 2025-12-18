module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    },
    forwardAuthenticated: function(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    },
    ensureGuildPermission: async function(req, res, next) {
        const userGuilds = await req.util.getPermissions(req);
        if (!userGuilds.find(guild => guild.id === req.params.guildId)) return res.redirect("/profile");

        const server = req.client.guilds.cache.get(req.params.guildId);
        if (!server) return res.redirect(`${req.botInvite}&guild_id=${req.params.guildId}`);

        return next();
    }
};