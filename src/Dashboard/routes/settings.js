const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/auth');

const months = {
    '01': 'Janvier',
    '02': 'Février',
    '03': 'Mars',
    '04': 'Avril',
    '05': 'Mai',
    '06': 'Juin',
    '07': 'Juillet',
    '08': 'Août',
    '09': 'Septembre',
    '10': 'Octobre',
    '11': 'Novembre',
    '12': 'Décembre'
}

router.get('/', ensureAuthenticated, async (req, res) => {
    const adminDashboard = await req.util.getAdminDashboard(req);

    const userGuilds = await req.util.getPermissions(req);

    /* Get only the guilds where the bot is and the user too */
    const botGuilds = await Promise.all(
        req.client.guilds.cache.map(async (guild) => {
            try {
                let member = guild.members.cache.get(req.user.id);

                if (!member) {
                    member = await guild.members.fetch(req.user.id);
                }

                return member ? guild : null;
            } catch (error) {
                return null;
            }
        })
    );

    const filteredGuilds = botGuilds.filter(guild => guild !== null);

    const birthday = await req.database.table('user_birthday').select().where('user_id', req.user.id);

    res.render("settings.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        invite: req.botInvite,
        userGuilds: userGuilds,
        botGuilds: filteredGuilds,
        isAdmin: adminDashboard,
        birthday: {
            day: birthday[0] ? birthday[0].day : 0,
            month: birthday[0] ? birthday[0].month : null,
            monthFormatted: birthday[0] ? months[birthday[0].month] : null,
            year: birthday[0] ? birthday[0].year : new Date().getFullYear(),
            private_age: birthday[0] ? birthday[0].private_age : false
        },
        page: "parameters"
    });
});

router.post('/birthday', ensureAuthenticated, async (req,res) => {
    // Get the values
    const day = req.body.day;
    const month = req.body.month;
    const year = req.body.year;
    const privateAge = req.body.private === 'on';

    if (
        (!day || !month || !year) ||
        (day === '' || month === '' || year === '') ||
        (day === '0') ||
        (Number(day) > 31 || Number(day) < 1) ||
        (Number(year) > new Date().getFullYear() || Number(year) < 1900)
    ) {
        req.session.alertMessage =  {
            title: "Erreur",
            text: "Veuillez renseigner une date valide !",
            icon: "error"
        }

        return res.redirect(`/settings`);
    }

    const base = await req.database.table('user_birthday').select().where('user_id', req.user.id);

    if (!base[0]) {
        await req.database.table("user_birthday").insert({
            user_id: req.user.id,
            day: day,
            month: month,
            year: year,
            private_age: privateAge
        });
    }
    else {
        await req.database.table("user_birthday").update({
            day: day,
            month: month,
            year: year,
            private_age: privateAge
        }).where("user_id", req.user.id);
    }

    req.session.alertMessage =  {
        title: "Succès",
        text: "Votre anniversaire a été modifié !",
        icon: "success"
    }

    return res.redirect(`/settings`);
});


router.get('/information/:serverId', ensureAuthenticated, async (req,res) => {
    // Get the server id
    const guildId = req.params.serverId;

    // Get the server
    const server = req.client.guilds.cache.get(guildId);
    if (!server) {
        return res.status(400).json({
            alert: {
                title: "Erreur",
                text: "Le serveur n'existe pas !",
                icon: "error"
            }
        });
    }

    const baseUserMoney = await req.database.table('user_money').select().where({ guild_id: guildId, user_id: req.user.id });

    const baseGuildMoney = await req.database.table('guild_money').select().where("guild_id", guildId);
    const name = (baseGuildMoney[0] && baseGuildMoney[0].name) ? baseGuildMoney[0].name : 'coins';

    const memberLevel = await req.database.table('user_levels').select().where({ guildId: guildId, userId: req.user.id });

    return res.json({
        name: server.name,
        economy: {
            money: baseUserMoney[0] ? baseUserMoney[0].money : 0,
            name
        },
        levels: {
            level: memberLevel[0] ? memberLevel[0].level : 0,
            xp: memberLevel[0] ? memberLevel[0].xp : 0,
            xpReq: memberLevel[0] ? req.functions.getXpWithLevel(memberLevel[0].level + 1) : 0
        }
    });
});


module.exports = router;