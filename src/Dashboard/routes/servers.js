const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuildPermission } = require('../auth/auth');

router.get('/:guildId', ensureAuthenticated, ensureGuildPermission, async (req, res) => {
    const guildId = req.params.guildId;
    const userGuilds = await req.util.getPermissions(req);

    const server = req.client.guilds.cache.get(guildId);

    const baseGuildMoney = await req.database.table('guild_money').select().where("guild_id", server.id);
    const moneyName = (baseGuildMoney[0] && baseGuildMoney[0].name) ? baseGuildMoney[0].name : 'coins';

    const dataXp = await req.database.table('user_levels').select().where("guildId", guildId);
    const dataEconomy = await req.database.table('user_money').select().where("guild_id", guildId);

    const top3Xp = dataXp.sort((a, b) => b.xp - a.xp).slice(0, 3);
    const top3Money = dataEconomy.sort((a, b) => b.money - a.money).slice(0, 3);

    for (const user of top3Xp) {
        const member = await server.members.fetch(user.userId).catch(() => null);
        if (member) {
            user.username = member.user.username;
            user.avatar = member.user.displayAvatarURL({ extension: "png", size: 128 });
        }
        else {
            user.username = "Inconnu";
            user.avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    }

    while (top3Xp.length < 3) {
        top3Xp.push({ username: "Inconnu", avatar: "https://cdn.discordapp.com/embed/avatars/0.png", level: 0, xp: 0 });
    }

    for (const user of top3Money) {
        const member = await server.members.fetch(user.user_id).catch(() => null);
        if (member) {
            user.username = member.user.username;
            user.avatar = member.user.displayAvatarURL({ extension: "png", size: 128 });
        }
        else {
            user.username = "Inconnu";
            user.avatar = "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    }

    while (top3Money.length < 3) {
        top3Money.push({ username: "Inconnu", avatar: "https://cdn.discordapp.com/embed/avatars/0.png", money: 0 });
    }

    res.render("servers.ejs", {
        session: req.session,
        status: (req.isAuthenticated() ? `${req.user.username}` : "Se connecter"),
        bot: req.client.user,
        user: req.user,
        server,
        login: (req.isAuthenticated() ? "/profile" : "/login"),
        userGuilds: userGuilds,
        invite: req.botInvite,
        data: {
            top3Xp,
            top3Money,
            moneyName: moneyName.charAt(0).toUpperCase() + moneyName.slice(1)
        },
        page: "servers"
    });
});

module.exports = router;