const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get("/", async (req, res) => {
  res.render("index.ejs", {
    session: req.session,
    status: req.isAuthenticated() ? `${req.user.username}` : "Se connecter",
    bot: req.client.user,
    user: req.user,
    login: req.isAuthenticated() ? "/profile" : "/login",
    invite: req.botInvite,
    guilds: req.functions.numberWithSpaces(req.client.guilds.cache.size),
    users: req.functions.numberWithSpaces(
      req.client.guilds.cache
        .map((guild) => guild.memberCount)
        .reduce((p, c) => p + c)
    ),
    numberCommands: req.functions.numberWithSpaces(
      req.client.slashCommandsHandler.slashCommands.size
    ),
    page: "index",
    pingBot: req.client.ws.ping,
  });
});

router.get("/login", (req, res, next) => {
  passport.authenticate("discord", {
    successRedirect: "/profile",
    failureRedirect: "https://abot.fr",
    failureFlash: false,
  })(req, res, next);
});

router.get("/logout", function (req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("https://abot.fr");
  });
});

module.exports = router;
