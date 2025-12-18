const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const adminDashboard = await req.util.getAdminDashboard(req);

    res.render("profile.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        isAdmin: adminDashboard,
        page: "profile",
        guilds: req.functions.numberWithSpaces(req.client.guilds.cache.size),
        users: req.functions.numberWithSpaces(req.client.guilds.cache.map((guild) => guild.memberCount).reduce((p, c) => p + c)),
        pingBot: req.client.ws.ping,
    });
});

module.exports = router;