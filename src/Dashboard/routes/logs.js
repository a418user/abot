const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const server = req.client.guilds.cache.get(req.params.guildId);

    const logs = await req.database.table('guild_log').select().where("guild_id", server.id);

    res.render("logs.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        logs: {
            allChannels: server.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition),
            message: logs[0] ? server.channels.cache.get(logs[0].message_id) : null,
            updateMember: logs[0] ? server.channels.cache.get(logs[0].update_member_id) : null,
            link: logs[0] ? server.channels.cache.get(logs[0].link_id) : null,
            updateServer: logs[0] ? server.channels.cache.get(logs[0].update_server_id) : null,
            voice: logs[0] ? server.channels.cache.get(logs[0].voice_id) : null
        },
        page: "logs"
    });
});

router.post('/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const status = req.body.enable === 'on';
    let channelId = req.body.channel;
    const type = req.query.type;

    if (channelId === '') channelId = null;

    const typeAvailable = ["message_id", "update_member_id", "link_id", "update_server_id", "voice_id"];
    if (!typeAvailable || !typeAvailable.includes(type)) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le type de logs dans la requête est invalide !",
            icon: "error"
        }

        return res.redirect(`/logs/${guildId}`);
    }

    const base = await req.database.table('guild_log').select().where("guild_id", server.id);

    if (!status && base[0] && base[0][type]) {
        await req.database.table('guild_log').update(
            {[type]: null}
        ).where("guild_id", guildId);

        req.session.alertMessage = {
            title: "Succès",
            text: "Le salon a été supprimé !",
            icon: "success"
        }

        return res.redirect(`/logs/${guildId}`);
    }

    if (!channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/logs/${guildId}`);
    }

    const channel = server.channels.cache.get(channelId);
    if (!channel || channel?.type !== 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le salon sélectionné n'est pas un salon textuel !",
            icon: "error"
        }

        return res.redirect(`/logs/${guildId}`);
    }

    if (!base[0]) {
        await req.database.table('guild_log').insert({
            guild_id: server.id,
            [type]: channelId
        });
    }
    else {
        await req.database.table('guild_log').update({
            [type]: channelId
        }).where("guild_id", server.id);
    }

    req.session.alertMessage = {
        title: "Succès",
        text: channelId ? "Le salon a été mis à jour !" : "Le salon a été supprimé !",
        icon: "success"
    }

    return res.redirect(`/logs/${guildId}`);
});

module.exports = router;