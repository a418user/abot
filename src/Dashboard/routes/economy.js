const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const userGuilds = await req.util.getPermissions(req);
    const server = req.client.guilds.cache.get(req.params.guildId);

    const baseGuildMoney = await req.database.table('guild_money').select().where("guild_id", server.id);
    const baseGuildShop = await req.database.table('guild_shop').select().where("guild_id", server.id);

    const shop = baseGuildShop[0] ? baseGuildShop.sort((a, b) => b.object_price - a.object_price) : [];

    res.render("economy.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        economy: {
            moneyName: (baseGuildMoney[0] && baseGuildMoney[0].name) ? baseGuildMoney[0].name : 'coins',
            daily: {
                status: baseGuildMoney[0] ? Boolean(baseGuildMoney[0].daily) : false,
                type: baseGuildMoney[0] ? (baseGuildMoney[0].daily_fix ? 'fix' : 'random') : 'random',
                amount: baseGuildMoney[0] ? baseGuildMoney[0].daily_amount : 100
            },
            shop
        },
        page: "economy"
    });
});

router.post('/money/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const moneyName = req.body.moneyName;

    const base = await req.database.table('guild_money').select().where("guild_id", guildId);

    /* Update the database */
    if (base[0]) {
        await req.database.table('guild_money').update({
            name: moneyName
        }).where('guild_id', guildId);
    }
    else {
        await req.database.table('guild_money').insert({
            guild_id: guildId,
            name: moneyName
        });
    }

    req.session.alertMessage = {
        title: "Succès",
        text: "Le nom de la monnaie a été mis à jour !",
        icon: "success"
    }

    return res.redirect(`/economy/${guildId}`);
});

router.post('/money/reset/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    const base = await req.database.table('guild_money').select().where("guild_id", guildId);

    if (!base[0] || !base[0].name) {
        req.session.alertMessage = {
            title: "Erreur",
            text: "Aucun nom de monnaie n'est configuré !",
            icon: "error"
        }

        return res.redirect(`/economy/${guildId}`);
    }

    /* Update the database */
    await req.database.table('guild_money').update({
        name: null
    }).where('guild_id', guildId);

    req.session.alertMessage = {
        title: "Succès",
        text: "Le nom de la monnaie a été mis supprimé !",
        icon: "success"
    }

    return res.redirect(`/economy/${guildId}`);
});

router.post('/daily/save/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const status = req.body.enable === "on";
    const amount = Number(req.body.amount) || 100;
    const type = req.body.type;

    const base = await req.database.table('guild_money').select().where("guild_id", guildId);

    if (status) {
        if (!base[0]) {
            await req.database.table("guild_money").insert({
                guild_id: guildId,
                daily: true,
                daily_fix: type === 'fix',
                daily_amount: amount
            });

            req.session.alertMessage = {
                title: "Succès",
                text: `Les récompenses quotidiennes ont été activées !`,
                icon: "success"
            }

            return res.redirect(`/economy/${guildId}`);
        }
        else {
            await req.database.table('guild_money').update({
                daily: true,
                daily_fix: type === 'fix',
                daily_amount: amount
            }).where("guild_id", guildId);

            req.session.alertMessage = {
                title: "Succès",
                text: `Les récompenses quotidiennes ont été mises à jour !`,
                icon: "success"
            }

            return res.redirect(`/economy/${guildId}`);
        }
    }
    else {
        if (!base[0] || base[0].daily === false) {
            req.session.alertMessage = {
                title: "Erreur",
                text: "Les récompenses quotidiennes ne sont pas activées !",
                icon: "error"
            }

            return res.redirect(`/economy/${guildId}`);
        }

        await req.database.table('guild_money').update({ daily: false }).where("guild_id", guildId);

        req.session.alertMessage = {
            title: "Succès",
            text: "Les récompenses quotidiennes ont été désactivées !",
            icon: "success"
        }

        return res.redirect(`/economy/${guildId}`);

    }
});

router.post('/shop/add/:guildId', ensureAuthenticated, ensureGuildPermission, async (req,res) => {
    const guildId = req.params.guildId;

    // Get the values
    const name = req.body.name;
    const amount = Number(req.body.amount);

    const base = await req.database.table('guild_shop').select().where("guild_id", guildId);

    if (base.length >= 15) {
        req.session.alertMessage = {
            title: "Attention",
            text: "Vous ne pouvez pas ajouter plus de 15 objets dans la boutique !",
            icon: "warning"
        }

        return res.redirect(`/economy/${guildId}`);
    }

    await req.database.table('guild_shop').insert({
        guild_id: guildId,
        object_name: name,
        object_price: amount
    });

    req.session.alertMessage = {
        title: "Succès",
        text: "L'objet a été ajouté à la boutique !",
        icon: "success"
    }

    return res.redirect(`/economy/${guildId}`);
});

router.post("/shop/delete/:guildId/:id", ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const guildId = req.params.guildId;
    const id = req.params.id;

    const base = await req.database.table('guild_shop').select().where("guild_id", guildId).where("id", id);

    if (!base[0]) return res.status(400).json({
        alert: {
            title: "Erreur",
            text: `L'objet n'existe pas !`,
            icon: "error"
        }
    });

    await req.database.table('guild_shop').delete().where("guild_id", guildId).where("id", id);

    req.session.alertMessage = {
        title: "Succès",
        text: "L'objet a été supprimé de la boutique !",
        icon: "success"
    }

    return res.status(200).json({ success: true });
});

module.exports = router;