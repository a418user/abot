const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);

    const server = req.client.guilds.cache.get(req.params.guildId);

    const data = await req.database.table('guild_suggest').select().where("guildId", server.id).first();

    const underConstruction = {}
    if (data) {
        const channel = server.channels.cache.get(data.channelId);

        underConstruction.channel = channel ? channel : null;
        underConstruction.isThread = data.isThread;
        underConstruction.isMessage = data.isMessage;
        underConstruction.rolesBypass = JSON.parse(data.rolesBypass);
        underConstruction.rolesBlacklist = JSON.parse(data.rolesBlacklist);
    }
    else {
        underConstruction.channel = null;
        underConstruction.isThread = true;
        underConstruction.isMessage = false;
        underConstruction.rolesBypass = [];
        underConstruction.rolesBlacklist = [];
    }

    const rolesServer = server.roles.cache
        .filter(role => role.id !== server.id && !role.managed)
        .sort((a, b) => b.position - a.position)
        .map(role => {
            return {
                ...role,
                colorRGB: role.color ? req.util.base10ToRGB(role.color) : '#FFFFFF',
                isNotPossible: role.position >= server.members.me.roles.highest.position
            };
        });

    res.render("suggestions.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        suggestions: {
            allChannels: server.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition),
            rolesServer,
            data: underConstruction
        },
        page: "suggestions"
    });
});

router.post('/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const status = req.body.enable === 'on';
    let rolesBypass = req.body.roles_bypass || [];
    let rolesBlacklist = req.body.roles_blacklist || [];
    const isThread = req.body.isThread === 'on';
    const isMessage = req.body.isMessage === 'on';
    let channelId = req.body.channel;

    const base = await req.database.table('guild_suggest').select().where("guildId", guildId);

    if (!status && base[0]) {
        await req.database.table('guild_suggest').delete().where("guildId", guildId);

        req.session.alertMessage = {
            title: "Succès",
            text: "Les suggestions ont été désactivées !",
            icon: "success"
        }

        return res.redirect(`/suggestions/${guildId}`);
    }

    if (channelId === '') channelId = null;

    /* Check if roles exists in the server */
    const server = req.client.guilds.cache.get(guildId);
    const rolesServer = server.roles.cache

    for (const role of rolesBypass) {
        if (!rolesServer.has(role)) {
            rolesBypass = rolesBypass.filter(r => r !== role);
        }
    }

    for (const role of rolesBlacklist) {
        if (!rolesServer.has(role)) {
            rolesBlacklist = rolesBlacklist.filter(r => r !== role);
        }
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon de suggestions n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/suggestions/${guildId}`);
    }

    /* Remove roles that are in the blacklist */
    rolesBypass = rolesBypass.filter(roleId => !rolesBlacklist.includes(roleId));

    if (base[0]) {
        await req.database.table('guild_suggest').update({
            channelId: channelId,
            isThread: isThread,
            isMessage: isMessage,
            rolesBypass: JSON.stringify(rolesBypass),
            rolesBlacklist: JSON.stringify(rolesBlacklist)
        }).where('guildId', guildId);
    }
    else {
        await req.database.table('guild_suggest').insert({
            guildId: guildId,
            channelId: channelId,
            isThread: isThread,
            isMessage: isMessage,
            rolesBypass: JSON.stringify(rolesBypass),
            rolesBlacklist: JSON.stringify(rolesBlacklist)
        });
    }

    req.session.alertMessage =  {
        title: "Succès",
        text: "Les suggestions ont été configurées !",
        icon: "success"
    }

    return res.redirect(`/suggestions/${guildId}`);
});

module.exports = router;