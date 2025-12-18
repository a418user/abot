const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const server = req.client.guilds.cache.get(req.params.guildId);

    const messages = await req.database.table('guild_welcome').select().where("guild_id", server.id);

    res.render("messages.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        messages: {
            allChannels: server.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition),
            messageWelcome: messages[0] && messages[0].msg_bvn ? messages[0].msg_bvn : "Bienvenue sur le serveur **{server}** {username} !",
            channelWelcome: messages[0] ? server.channels.cache.get(messages[0].channel_welcome_id) : null,
            mention: messages[0] ? messages[0].mention : null,
            messageLeave: messages[0] && messages[0].msg_leave ? messages[0].msg_leave : "{username} vient de quitter le serveur **{server}** !",
            channelLeave: messages[0] ? server.channels.cache.get(messages[0].channel_leave_id) : null
        },
        page: "messages"
    });
});

router.post('/welcome/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const status = req.body.enable === 'on';
    const message = req.body.message;
    let channelId = req.body.channel;
    const mention = req.body.mention === "on";

    if (channelId === '') channelId = null;

    const base = await req.database.table('guild_welcome').select().where("guild_id", server.id);

    if (!status && base[0]) {
        await req.database.table('guild_welcome').update({
            channel_welcome_id: null,
            msg_bvn: null,
            mention: false
        }).where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Les messages d'arrivée ont été désactivés !",
            icon: "success"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    if (!channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    /* Check if the channel is a text channel */
    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_welcome').insert({
            guild_id: server.id,
            channel_welcome_id: channelId,
            mention: mention,
            msg_bvn: message
        });
    }
    else {
        await req.database.table('guild_welcome').update({
            channel_welcome_id: channelId,
            msg_bvn: message,
            mention: mention
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Les messages d'arrivée ont été mis à jour !",
        icon: "success"
    }

    return res.redirect(`/messages/${guildId}`);
});

router.post('/leave/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const status = req.body.enable === 'on';
    const message = req.body.message;
    let channelId = req.body.channel;

    if (channelId === '') channelId = null;

    const base = await req.database.table('guild_welcome').select().where("guild_id", server.id);

    if (!status && base[0]) {
        await req.database.table('guild_welcome').update({
            channel_leave_id: null,
            msg_leave: null
        }).where("guild_id", server.id);

        req.session.alertMessage = {
            title: "Succès",
            text: "Les messages de départ ont été désactivés !",
            icon: "success"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    if (!channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/messages/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_welcome').insert({
            guild_id: server.id,
            channel_leave_id: channelId,
            msg_leave: message
        });
    }
    else {
        await req.database.table('guild_welcome').update({
            channel_leave_id: channelId,
            msg_leave: message,
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Les messages de départ ont été mis à jour !",
        icon: "success"
    }

    return res.redirect(`/messages/${guildId}`);
});


module.exports = router;