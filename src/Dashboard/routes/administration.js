const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");
    
    const userGuilds = await req.util.getPermissions(req);

    res.render("administration.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        isAdmin: adminDashboard,
        page: "administration"
    });
});

router.post('/bot/stop', ensureAuthenticated, async (req, res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    /* Check the status of the server */
    const status = await req.pterodactyl.getServerResources(req.pterodactylServerId).catch((e) => console.log(e));

    if (status === "offline") {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le bot est déjà arrêté !",
            icon: "error"
        };
    }
    else if (status === "running") {
        /* Stop the server */
        const stopped = await req.pterodactyl.setPowerState(req.pterodactylServerId, 'stop').catch((e) => console.log(e));
        if (stopped !== 'Successfuly set power state!') {
            req.session.alertMessage = {
                title: "Erreur",
                text: "L'arrêt du bot a échoué !",
                icon: "error"
            };
        } else {
            req.session.alertMessage = {
                title: "Succès",
                text: "Le bot a été arrêté !",
                icon: "success"
            };
        }
    }
    else {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le statut du bot est inconnu !",
            icon: "error"
        }
    }

    return res.redirect('/administration');
});

router.post('/bot/restart', ensureAuthenticated, async(req, res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    /* Check the status of the server */
    const status = await req.pterodactyl.getServerResources(req.pterodactylServerId).catch((e) => console.log(e));

    if (status.current_state === "offline") {
        const started = await req.pterodactyl.setPowerState(req.pterodactylServerId, 'start').catch((e) => console.log(e));

        if (started !== 'Successfuly set power state!') {
            req.session.alertMessage = {
                title: "Erreur",
                text: "Le démarrage du bot a échoué !",
                icon: "error"
            };
        }
        else {
            req.session.alertMessage = {
                title: "Succès",
                text: "Le bot a été démarré !",
                icon: "success"
            };
        }
    }
    else if (status.current_state === "running") {
        /* Restart the server */
        const restarted = await req.pterodactyl.setPowerState(req.pterodactylServerId, 'restart').catch((e) => console.log(e));
        if (restarted !== 'Successfuly set power state!') {
            req.session.alertMessage = {
                title: "Erreur",
                text: "Le redémarrage du bot a échoué !",
                icon: "error"
            };
        } else {
            req.session.alertMessage = {
                title: "Succès",
                text: "Le bot a été redémarré !",
                icon: "success"
            };
        }
    }
    else {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le statut du bot est inconnu !",
            icon: "error"
        }
    }

    return res.redirect('/administration');
});

router.get('/servers/invite/:serverId', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    // Get the server id
    const serverId = req.params.serverId;

    // Get the server
    const server = req.client.guilds.cache.get(serverId);
    if (!server) {
        return res.status(400).json({
            alert: {
                title: "Erreur",
                text: "Le serveur n'existe pas !",
                icon: "error"
            }
        });
    }

    // Get the invite
    let invite;
    if (server.vanityURLCode) {
        invite = `https://discord.gg/${server.vanityURLCode}`;
    }
    else {
        const channels = server.channels.cache.filter(channel => channel.permissionsFor(server.members.me).has('CreateInstantInvite'));
        if (channels.size === 0) {
            return res.status(400).json({
                alert: {
                    title: "Erreur",
                    text: "Je n'ai pas la permission de créer une invitation !",
                    icon: "error"
                }
            });
        }

        let channel = channels.find(channel => channel.type === 0);
        if (!channel) channel = channels.first();
        const inviteObject = await channel?.createInvite({maxAge: 0});
        invite = inviteObject.url;
    }

    // Return the name of the server and the invite
    return res.json({
        name: server.name,
        invite: invite
    });
});

router.get('/servers/information/:serverId', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    // Get the server id
    const serverId = req.params.serverId;

    // Get the server
    const server = req.client.guilds.cache.get(serverId);
    if (!server) {
        return res.status(400).json({
            alert: {
                title: "Erreur",
                text: "Le serveur n'existe pas !",
                icon: "error"
            }
        });
    }

    const owner = await req.client.users.fetch(server.ownerId).catch(() => null);

    return res.json({
        name: server.name,
        description: server.description || "Aucune description",
        id: server.id,
        owner: owner ? owner.displayName : "Inconnu",
        memberCount: server.memberCount,
        icon: server.iconURL({ extension: 'png' })
    });
});

router.post('/servers/leave', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    // Get the server id
    const serverId = req.body.serverId;
    if (!serverId || serverId === "") {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Veuillez fournir l'identifiant d'un serveur !",
            icon: "warning"
        };

        return res.redirect('/administration')
    }

    // Get the server
    const server = req.client.guilds.cache.get(serverId);
    if (!server) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le serveur n'existe pas !",
            icon: "error"
        };

        return res.redirect('/administration')
    }

    // Leave the server
    server.leave().then(() => {
        req.session.alertMessage = {
            title: "Succès",
            text: `Le serveur ${server.name} a été expulsé !`,
            icon: "success"
        };
        res.redirect("/administration");
    }).catch(() => {
        req.session.alertMessage = {
            title: "Erreur",
            text: `Impossible d'expulser le serveur ${server.name} !`,
            icon: "error"
        }
        return res.redirect('/administration')
    })
});

router.post('/antiban/add', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    const userId = req.body.userId;
    if (!userId || userId === "") {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Veuillez fournir l'identifiant d'un membre !",
            icon: "warning"
        };

        return res.redirect('/administration')
    }

    const base = await req.client.database.table('admin_anti_ban').where({ user_id: userId });
    if (base[0]) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le membre a déjà été ajouté !",
            icon: "error"
        };

        return res.redirect('/administration')
    }

    // Add the token to the database
    await req.client.database.table('admin_anti_ban').insert({ user_id: userId });

    // Send the message
    req.session.alertMessage = {
        title: "Succès",
        text: "Le membre a été ajouté !",
        icon: "success"
    };

    return res.redirect("/administration");
});

router.post('/antiban/delete/', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.redirect("/profile");

    const userId = req.body.userId;
    if (!userId || userId === "") {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Veuillez fournir l'identifiant d'un membre !",
            icon: "warning"
        };

        return res.redirect('/administration')
    }

    // Get the data
    const base = await req.client.database.table('admin_anti_ban').where({ user_id: userId });
    if (!base[0]) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le membre ne fait pas partie de la liste !",
            icon: "error"
        };

        return res.redirect('/administration')
    }

    // Delete the data
    await req.client.database.table('admin_anti_ban').delete().where( { user_id: userId });

    // Send the message
    req.session.alertMessage = {
        title: "Succès",
        text: "Le membre a été retiré !",
        icon: "success"
    };

    return res.redirect("/administration");
});

router.get('/antiban/list', ensureAuthenticated, async (req,res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);
    if (!adminDashboard) return res.json([]);

    // Get the database
    const base = await req.client.database.table('admin_anti_ban').select();
    if (!base[0]) return res.json([]);

    // Add a username field with the userId fetched from discord
    for (const data of base) {
        const user = await req.client.users.fetch(data.user_id).catch(() => null);
        if (user) data.username = user.displayName;
    }

    return res.json(base);
});

module.exports = router;