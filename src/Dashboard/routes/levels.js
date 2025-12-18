const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const server = req.client.guilds.cache.get(req.params.guildId);

    const baseGuildMoney = await req.database.table('guild_money').select().where("guild_id", server.id);

    const settings = await req.database.table('guild_levels').select().where("guildId", server.id);
    const levelingSettings = settings[0] ? JSON.parse(settings[0].leveling) : {}
    const rewards = settings[0] ? JSON.parse(settings[0].rewards) : [];

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

    res.render("levels.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        levels: {
            rolesServer,
            allChannels: server.channels.cache.filter(c => c.type === 0).sort((a, b) => a.rawPosition - b.rawPosition),
            ignoreChannels: levelingSettings.ignoreChannels && levelingSettings.ignoreChannels.length > 0 ? levelingSettings.ignoreChannels.map(cId => server.channels.cache.get(cId)).filter(c => c) : null,
            levelsMessage: levelingSettings.message ? levelingSettings.message : "Félicitations {user} ! Tu viens juste de passer niveaux **{level}** ! :tada:",
            levelsChannel: levelingSettings.channel ? server.channels.cache.get(levelingSettings.channel) : null,
            rewards: rewards ? rewards.sort((a, b) => a.level - b.level) : rewards,
            moneyName: (baseGuildMoney[0] && baseGuildMoney[0].name) ? baseGuildMoney[0].name : 'coins'
        },
        page: "levels"
    });
});

router.post('/channels/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const status = req.body.enable === 'on';
    let channelsId = req.body.channels;
    if (!channelsId) channelsId = [];

    const base = await req.database.table('guild_levels').select().where("guildId", guildId);
    const levelingSettings = base[0] ? JSON.parse(base[0].leveling) : {}

    if (!status && base[0]) {
        levelingSettings.ignoreChannels = [];
    }
    else {
        /* Check if all channels are available in this server */
        for (const channelId of channelsId) {
            if (!server.channels.cache.has(channelId) || server.channels.cache.get(channelId).type !== 0) {
                channelsId = channelsId.filter(cId => cId !== channelId);
            }
        }

        /* Update the leveling settings */
        levelingSettings.ignoreChannels = channelsId;
    }

    /* Update the database */
    if (base[0]) {
        await req.database.table('guild_levels').update({
            leveling: JSON.stringify(levelingSettings)
        }).where('guildId', guildId);
    }
    else {
        await req.database.table('guild_levels').insert({
            guildId: guildId,
            leveling: JSON.stringify(levelingSettings)
        });
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Les salons ignorés pour le gain d'XP ont été mis à jour !",
        icon: "success"
    }

    return res.redirect(`/levels/${guildId}`);
});

router.post('/messages/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const status = req.body.enable === 'on';
    let channelId = req.body.channel;
    const text = req.body.message;

    if (channelId === '') channelId = null;

    const base = await req.database.table('guild_levels').select().where("guildId", guildId);
    const levelingSettings = base[0] ? JSON.parse(base[0].leveling) : {}

    if (!status && base[0]) {
        delete levelingSettings.channel;
        delete levelingSettings.message;
    }
    else if (!channelId) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun salon n'a été sélectionné !",
            icon: "error"
        }

        return res.redirect(`/levels/${guildId}`);
    }
    else {
        /* Check if the channel is a text channel */
        const channel = server.channels.cache.get(channelId);
        if (!channel || channel?.type !== 0) {
            req.session.alertMessage = {
                title: "Erreur",
                text: "Le salon sélectionné n'est pas un salon textuel !",
                icon: "error"
            }

            return res.redirect(`/levels/${guildId}`);
        }

        /* Add the channel identifier to the leveling settings. */
        if (channel) levelingSettings.channel = channel.id

        /* Add the message to the leveling settings. */
        if (text) levelingSettings.message = text

        /* If no channel is provided, set the default channel */
        if (!channel && levelingSettings.channel) delete levelingSettings.channel

        /* If no message is provided, set the default message */
        if (!text && levelingSettings.message) delete levelingSettings.message

        /* Get all the variables available */
        const variableList = ['{user.username}', '{user.mention}', '{member.nickname}', '{server}', '{xp}', '{level}']

        /* Check if there is at least one variable in the message */
        if (text && !variableList.some(variable => text.includes(variable))) {
            req.session.alertMessage = {
                title: "Attention",
                text: "Le message doit contenir au minimum une variable !",
                icon: "warning"
            }

            return res.redirect(`/levels/${guildId}`);
        }
    }

    /* Update the database */
    if (base[0]) {
        await req.database.table('guild_levels').update({
            leveling: JSON.stringify(levelingSettings)
        }).where('guildId', guildId);
    }
    else {
        await req.database.table('guild_levels').insert({
            guildId: guildId,
            leveling: JSON.stringify(levelingSettings)
        });
    }

    if (text && (text.includes('@everyone') || text.includes('@here'))) {
        req.session.alertMessage = {
            title: "Attention",
            text: "Le message pour le gain de niveaux a été mis à jour ! Mais attention, le message contient une mention dangereuse !",
            icon: "warning"
        }
    }
    else {
        req.session.alertMessage = {
            title: "Succès",
            text: "Le message pour le gain de niveaux a été mis à jour !",
            icon: "success"
        }
    }

    return res.redirect(`/levels/${guildId}`);
});

router.post('/rewards/add/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;
    const server = req.client.guilds.cache.get(guildId);

    // Get the values
    const level = Number(req.body.level);
    const rewardType = req.body.rewardType;
    const money = Number(req.body.moneyAmount) || 0;
    const roleId = req.body.roleId;

    /* Check if the role exist */
    const role = server.roles.cache.get(roleId);
    if (rewardType === "role" && !role) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le rôle n'existe pas !",
            icon: "error"
        }

        return res.redirect(`/levels/${guildId}`);
    }

    /* Check if the money has been given */
    if (rewardType !== "role" && money < 1) {
        req.session.alertMessage = {
            title: "Attention",
            text: "Le montant d'argent doit être supérieur à 0 !",
            icon: "warning"
        }

        return res.redirect(`/levels/${guildId}`);
    }

    const base = await req.database.table('guild_levels').select().where("guildId", guildId);
    const rewards = base[0] ? JSON.parse(base[0].rewards) : [];

    /* Check if the role is already in the list */
    if (rewardType === "role" && rewards.find((r) => r.roleId === role.id)) {
        req.session.alertMessage = {
            title: "Attention",
            text: `Le rôle ${role.name} est déjà ajouté aux rôles de récompenses pour un autre niveau !`,
            icon: "warning"
        }

        return res.redirect(`/levels/${guildId}`);
    }

    /* Check if there is already a reward for this level */
    if (rewards.find((rr) => rr.level === level)) {
        req.session.alertMessage = {
            title: "Attention",
            text: `Une récompense est déjà défini pour le niveau ${level} !`,
            icon: "warning"
        }

        return res.redirect(`/levels/${guildId}`);
    }

    // Add the role reward
    rewards.push({
        level: level,
        roleId: rewardType === "role" ? role.id : null,
        money: money
    });

    /* Update the database */
    if (base[0]) {
        await req.database.table('guild_levels').update({
            rewards: JSON.stringify(rewards)
        }).where('guildId', guildId);
    }
    else {
        await req.database.table('guild_levels').insert({
            guildId: guildId,
            rewards: JSON.stringify(rewards)
        });
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "La récompense de niveau a été ajoutée !",
        icon: "success"
    }

    return res.redirect(`/levels/${guildId}`);
});

router.post("/rewards/delete/:guildId/:level", ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const guildId = req.params.guildId;
    const level = Number(req.params.level);

    const base = await req.database.table('guild_levels').select().where("guildId", guildId);
    let rewards = base[0] ? JSON.parse(base[0].rewards) : [];

    const reward = rewards.find((rr) => rr.level === level);
    if (!reward) return res.status(400).json({
        alert: {
            title: "Erreur",
            text: `Aucune récompense n'est défini pour le niveau ${level} !`,
            icon: "error"
        }
    });

    /* Remove the role reward */
    rewards = rewards.filter((rr) => rr.level !== level);

    /* Update the database */
    await req.database.table('guild_levels').update({
        rewards: JSON.stringify(rewards)
    }).where('guildId', guildId);

    req.session.alertMessage = {
        title: "Succès",
        text: `La récompense pour le niveau ${level} a été supprimée !`,
        icon: "success"
    }

    return res.status(200).json({ success: true });
});

module.exports = router;