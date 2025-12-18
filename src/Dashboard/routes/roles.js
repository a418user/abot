const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);

    const server = req.client.guilds.cache.get(req.params.guildId);

    let rolesDatabaseParse = [];
    const rolesBase = await req.database.table('guild_auto_role').select().where("guild_id", server.id);

    if (rolesBase[0]) {
        rolesDatabaseParse = JSON.parse(rolesBase[0].roles);
    }

    const rolesDatabaseUser = rolesDatabaseParse.filter(role => role.type === "user");
    const rolesDatabaseBot = rolesDatabaseParse.filter(role => role.type === "bot");

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

    res.render("roles.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        roles: {
            rolesServer,
            rolesDatabaseUser,
            rolesDatabaseBot,
        },
        page: "roles"
    });
});

router.post('/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const status = req.body.enable === 'on';
    let roles = req.body.roles;
    const type = req.query.type;

    const allowedTypes = ["user", "bot"];
    if (!allowedTypes.includes(type)) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Le type de rôle est invalide !",
            icon: "error"
        }

        return res.redirect(`/roles/${guildId}`);
    }

    const base = await req.database.table('guild_auto_role').select().where("guild_id", guildId);

    if (!status && base[0]) {
        let rolesDatabase = JSON.parse(base[0].roles);
        if (rolesDatabase.find(role => role.type === type)) {
            rolesDatabase = rolesDatabase.filter(role => role.type !== type);

            await req.database.table('guild_auto_role').update({
                roles: JSON.stringify(rolesDatabase)
            }).where("guild_id", guildId);

            req.session.alertMessage = {
                title: "Succès",
                text: "L'auto-rôle a été désactivé !",
                icon: "success"
            }

            return res.redirect(`/roles/${guildId}`);
        }
    }

    /* Check if roles exists in the server */
    const server = req.client.guilds.cache.get(guildId);
    if (roles) {
        for (const role of roles) {
            if (!server.roles.cache.has(role)) {
                roles = roles.filter(r => r !== role);
            }
        }
    }

    if (!roles || roles.length === 0) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Vous devez sélectionner au moins un rôle !",
            icon: "error"
        }

        return res.redirect(`/roles/${guildId}`);
    }

    if (!base[0]) {
        const rolesFormatted = roles.map(role => {
            return {
                roleId: role,
                type
            }
        });

        await req.database.table("guild_auto_role").insert({
            guild_id: req.params.guildId,
            roles: JSON.stringify(rolesFormatted)
        });
    }
    else {
        let rolesDatabase = JSON.parse(base[0].roles);
        if (!roles) {
            rolesDatabase = rolesDatabase.filter(role => role.type !== type);
        }
        else {
            const rolesFormatted = roles.map(role => {
                return {
                    roleId: role,
                    type
                }
            });

            rolesDatabase = rolesDatabase.filter(role => role.type !== type);
            rolesDatabase.push(...rolesFormatted);
        }


        await req.database.table("guild_auto_role").update({
            roles: JSON.stringify(rolesDatabase)
        }).where("guild_id", guildId);
    }

    req.session.alertMessage =  {
        title: "Succès",
        text: type === "user" ? "L'auto-rôle des membres a été mis à jour !" : "L'auto-rôle des bots a été mis à jour !",
        icon: "success"
    }

    return res.redirect(`/roles/${guildId}`);
});

module.exports = router;