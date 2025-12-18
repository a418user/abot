const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../../../config.json');

module.exports = function(passport) {
    const scopes = ['identify', 'guilds'];
    const isDev = process.env.PROD === 'false';

    passport.use(new DiscordStrategy({
            clientID: isDev ? config.dashboard.clientIdDev : config.dashboard.clientId,
            clientSecret: isDev ? config.dashboard.clientSecretDev : config.dashboard.clientSecret,
            callbackURL: isDev ? config.dashboard.callbackURLDev : config.dashboard.callbackURL,
            scope: scopes
        },
        async function(accessToken, refreshToken, profile, cb) {
            return cb(null, profile);
        }));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
}