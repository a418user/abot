const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);

    const server = req.client.guilds.cache.get(req.params.guildId);

    const data = await req.database.table('guild_voice_settings').select().where("guildId", server.id).first();

    const underConstruction = {}
    if (data) {
        const category = server.channels.cache.get(data.categoryId);
        const channelStart = server.channels.cache.get(data.channelStartId);

        underConstruction.waitingChannel = data.waitingChannel;
        underConstruction.permissionsProtect = data.permissionsProtect;
        underConstruction.category = category ? category : null;
        underConstruction.channelStart = channelStart ? channelStart : null;
        underConstruction.channelName = data.channelName;
        underConstruction.channelWaitingName = data.channelWaitingName;
        underConstruction.channelLimit = data.channelLimit;
        underConstruction.rolesManager = JSON.parse(data.rolesManager);
        underConstruction.rolesAccepted = JSON.parse(data.rolesAccepted);
        underConstruction.rolesRefused = JSON.parse(data.rolesRefused);
        underConstruction.permissions = JSON.parse(data.permissions);
    }
    else {
        underConstruction.waitingChannel = true;
        underConstruction.permissionsProtect = true;
        underConstruction.category = null;
        underConstruction.channelStart = null;
        underConstruction.channelName = 'Vocal de {username}';
        underConstruction.channelWaitingName = '» Attente de {username}';
        underConstruction.channelLimit = 0;
        underConstruction.rolesManager = [];
        underConstruction.rolesAccepted = [];
        underConstruction.rolesRefused = [];
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

    res.render("voice.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        voice: {
            allChannels: server.channels.cache.filter(c => c.type === 2).sort((a, b) => a.rawPosition - b.rawPosition),
            allCategories: server.channels.cache.filter(c => c.type === 4).sort((a, b) => a.rawPosition - b.rawPosition),
            rolesServer,
            data: underConstruction
        },
        page: "voice"
    });
});

router.post('/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const status = req.body.enable === 'on';
    let rolesManager = req.body.roles_manager || [];
    let rolesAccepted = req.body.roles_accepted || [];
    let rolesRefused = req.body.roles_refused || [];
    let categoryId = req.body.category;
    let channelId = req.body.channel;
    const channelName = req.body.channelName || 'Vocal de {username}';
    const channelWaitingName = req.body.channelWaitingName || '» Attente de {username}';
    const channelLimit = req.body.channelLimit || 0;
    const waitingChannel = req.body.waitingChannel === 'on';
    const permissionsProtect = req.body.permissionsProtect === 'on';

    const base = await req.database.table('guild_voice_settings').select().where("guildId", guildId);

    if (!status && base[0]) {
        await req.database.table('guild_voice_settings').delete().where("guildId", guildId);

        req.session.alertMessage = {
            title: "Succès",
            text: "Les salons privés ont été désactivées !",
            icon: "success"
        }

        return res.redirect(`/voice/${guildId}`);
    }

    if (categoryId === '') categoryId = null;
    if (channelId === '') channelId = null;

    /* Check if roles exists in the server */
    const server = req.client.guilds.cache.get(guildId);
    const rolesServer = server.roles.cache

    for (const role of rolesManager) {
        if (!rolesServer.has(role)) {
            rolesManager = rolesManager.filter(r => r !== role);
        }
    }

    for (const role of rolesAccepted) {
        if (!rolesServer.has(role)) {
            rolesAccepted = rolesAccepted.filter(r => r !== role);
        }
    }

    for (const role of rolesRefused) {
        if (!rolesServer.has(role)) {
            rolesRefused = rolesRefused.filter(r => r !== role);
        }
    }

    const category = server.channels.cache.get(categoryId);
    if (!category || category?.type !== 4) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "La catégorie n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/voice/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 2) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon hub n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/voice/${guildId}`);
    }

    /* Remove roles that are in the other lists */
    rolesManager = rolesManager.filter(roleId => !rolesAccepted.includes(roleId) && !rolesRefused.includes(roleId));

    rolesAccepted = rolesAccepted.filter(roleId => !rolesManager.includes(roleId) && !rolesRefused.includes(roleId));

    rolesRefused = rolesRefused.filter(roleId => !rolesManager.includes(roleId) && !rolesAccepted.includes(roleId));

    if (base[0]) {
        await req.database.table('guild_voice_settings').update({
            waitingChannel: waitingChannel,
            permissionsProtect: permissionsProtect,
            categoryId: categoryId,
            channelStartId: channelId,
            channelName: channelName,
            channelWaitingName: channelWaitingName,
            channelLimit: channelLimit,
            rolesManager: JSON.stringify(rolesManager),
            rolesAccepted: JSON.stringify(rolesAccepted),
            rolesRefused: JSON.stringify(rolesRefused)
        }).where('guildId', guildId);
    }
    else {
        await req.database.table('guild_voice_settings').insert({
            guildId: guildId,
            waitingChannel: waitingChannel,
            permissionsProtect: permissionsProtect,
            categoryId: categoryId,
            channelStartId: channelId,
            channelName: channelName,
            channelWaitingName: channelWaitingName,
            channelLimit: channelLimit,
            rolesManager: JSON.stringify(rolesManager),
            rolesAccepted: JSON.stringify(rolesAccepted),
            rolesRefused: JSON.stringify(rolesRefused)
        });
    }

    req.session.alertMessage =  {
        title: "Succès",
        text: "Les salons privés ont été configurées !",
        icon: "success"
    }

    return res.redirect(`/voice/${guildId}`);
});

module.exports = router;