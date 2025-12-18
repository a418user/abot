const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const server = req.client.guilds.cache.get(req.params.guildId);

    const ghostPing = await req.database.table('guild_ghost_ping_member').select().where("guild_id", server.id);
    const ghostPingChannels = [];
    if (ghostPing[0]) {
        if (ghostPing[0].channel_id) ghostPingChannels.push(server.channels.cache.get(ghostPing[0].channel_id));
        if (ghostPing[0].channel_id_2) ghostPingChannels.push(server.channels.cache.get(ghostPing[0].channel_id_2));
        if (ghostPing[0].channel_id_3) ghostPingChannels.push(server.channels.cache.get(ghostPing[0].channel_id_3));
        if (ghostPing[0].channel_id_4) ghostPingChannels.push(server.channels.cache.get(ghostPing[0].channel_id_4));
        if (ghostPing[0].channel_id_5) ghostPingChannels.push(server.channels.cache.get(ghostPing[0].channel_id_5));
    }

    /* Remove null values */
    ghostPingChannels.filter(c => c);

    const deletedMention = await req.database.table('guild_ghost_ping').select().where("guild_id", server.id);
    const deletedMentionChannel = deletedMention[0] ? server.channels.cache.get(deletedMention[0].channel_id) : null;

    const prison = await req.database.table('guild_prison').select().where("guild_id", server.id);
    let roleDatabase = prison[0] ? server.roles.cache.get(prison[0].role_add_id) : null;
    if (roleDatabase) roleDatabase["colorRGB"] = roleDatabase.color ? req.util.base10ToRGB(roleDatabase.color) : '#FFFFFF';

    const birthday = await req.database.table('guild_birthday').select().where("guild_id", server.id);
    const birthdayChannel = birthday[0] ? server.channels.cache.get(birthday[0].channel_id) : null;

    const boost = await req.database.table('guild_boost').select().where("guild_id", server.id);
    const boostChannel = boost[0] ? server.channels.cache.get(boost[0].channel_id) : null;

    const report = await req.database.table('guild_report').select().where("guild_id", server.id);
    const reportChannel = report[0] ? server.channels.cache.get(report[0].channel_id) : null;

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

    res.render("channels.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        channels: {
            allChannels: server.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition),
            allRoles: rolesServer,
            ghostPing: ghostPingChannels,
            deletedMention: deletedMentionChannel,
            birthday: birthdayChannel,
            jailRole: roleDatabase,
            boost: {
                channel: boostChannel,
                mention: boost[0] ? boost[0].mention : false,
                messageAdd: boost[0] && boost[0].message_add ? boost[0].message_add : "**{user.username}** a boost le serveur **{server}** !",
                messageRemove: boost[0] && boost[0].message_remove ? boost[0].message_remove : "**{user.username}** a arrêté de boost le serveur **{server}** !"
            },
            report: reportChannel
        },
        page: "channels"
    });
});

router.post('/ghostping/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_ghost_ping_member').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let channelsId = req.body.channels;
    if (!channelsId) channelsId = [];

    if (!status && base[0]) {
        await req.database.table('guild_ghost_ping_member').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système de ghost ping a été désactivé !",
            icon: "success"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    /* Check if all channels are available in this server */
    for (const channelId of channelsId) {
        if (!server.channels.cache.has(channelId) || server.channels.cache.get(channelId).type !== 0) {
            channelsId = channelsId.filter(cId => cId !== channelId);
        }
    }

    if (channelsId.length > 5) {
        req.session.alertMessage = {
            title: "Attention",
            text: "Vous ne pouvez pas sélectionner plus de 5 salons !",
            icon: "warning"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_ghost_ping_member').insert({
            guild_id: server.id,
            channel_id: channelsId[0] ? channelsId[0] : null,
            channel_id_2: channelsId[1] ? channelsId[1] : null,
            channel_id_3: channelsId[2] ? channelsId[2] : null,
            channel_id_4: channelsId[3] ? channelsId[3] : null,
            channel_id_5: channelsId[4] ? channelsId[4] : null
        });
    }
    else {
        await req.database.table('guild_ghost_ping_member').update({
            channel_id: channelsId[0] ? channelsId[0] : null,
            channel_id_2: channelsId[1] ? channelsId[1] : null,
            channel_id_3: channelsId[2] ? channelsId[2] : null,
            channel_id_4: channelsId[3] ? channelsId[3] : null,
            channel_id_5: channelsId[4] ? channelsId[4] : null
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système de ghost ping a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

router.post('/mention/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_ghost_ping').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let channelId = req.body.channel;

    if (!status && base[0]) {
        await req.database.table('guild_ghost_ping').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système de mentions supprimées a été désactivé !",
            icon: "success"
        }
        return res.redirect(`/channels/${guildId}`);
    }

    if (channelId === '') channelId = null;

    if (!base[0] && !channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_ghost_ping').insert({
            guild_id: server.id,
            channel_id: channelId
        });
    }
    else {
        await req.database.table('guild_ghost_ping').update({
            channel_id: channelId
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système de mentions supprimées a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

router.post('/prison/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_prison').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let roleId = req.body.roleId;

    if (!status && base[0]) {
        await req.database.table('guild_prison').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système de prison a été désactivé !",
            icon: "success"
        }
        return res.redirect(`/channels/${guildId}`);
    }

    if (roleId === '') roleId = null;

    if (!base[0] && !roleId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun rôle n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    const role = server.roles.cache.get(roleId);
    if (!role) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le rôle sélectionné n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (role.position >= server.members.me.roles.highest.position || role.managed) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le rôle sélectionné doit être inférieur à mon rôle le plus haut et ne doit pas être géré par un bot !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_prison').insert({
            guild_id: server.id,
            role_add_id: roleId
        });
    }
    else {
        await req.database.table('guild_prison').update({
            role_add_id: roleId
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système de prison a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

router.post('/birthday/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_birthday').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let channelId = req.body.channel;

    if (!status && base[0]) {
        await req.database.table('guild_birthday').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système d'anniversaire a été désactivé !",
            icon: "success"
        }
        return res.redirect(`/channels/${guildId}`);
    }

    if (channelId === '') channelId = null;

    if (!base[0] && !channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_birthday').insert({
            guild_id: server.id,
            channel_id: channelId
        });
    }
    else {
        await req.database.table('guild_birthday').update({
            channel_id: channelId
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système d'anniversaire a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

router.post('/boost/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_boost').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let channelId = req.body.channel;
    const mention = req.body.mention === "on";
    const messageAdd = req.body.messageAdd;
    const messageRemove = req.body.messageRemove;

    if (!status && base[0]) {
        await req.database.table('guild_boost').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système de boost a été désactivé !",
            icon: "success"
        }
        return res.redirect(`/channels/${guildId}`);
    }

    if (channelId === '') channelId = null;

    if (!base[0] && !channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_boost').insert({
            guild_id: server.id,
            channel_id: channelId,
            mention: mention,
            message_add: messageAdd ? messageAdd : null,
            message_remove: messageRemove ? messageRemove : null
        });
    }
    else {
        await req.database.table('guild_boost').update({
            channel_id: channelId,
            mention: mention,
            message_add: messageAdd ? messageAdd : null,
            message_remove: messageRemove ? messageRemove : null
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système de boost a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

router.post('/report/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    const base = await req.database.table('guild_report').select().where("guild_id", server.id);

    // Get the values
    const status = req.body.enable === "on";
    let channelId = req.body.channel;

    if (!status && base[0]) {
        await req.database.table('guild_report').delete().where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le système de report a été désactivé !",
            icon: "success"
        }
        return res.redirect(`/channels/${guildId}`);
    }

    if (channelId === '') channelId = null;

    if (!base[0] && !channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/channels/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_report').insert({
            guild_id: server.id,
            channel_id: channelId
        });
    }
    else {
        await req.database.table('guild_report').update({
            channel_id: channelId
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le système de report a été configuré !",
        icon: "success"
    }

    return res.redirect(`/channels/${guildId}`);
});

module.exports = router;