module.exports = class Util {

    /**
     * Get the list of servers where the user has the permission to manage the bot
     * @param req The request
     * @return {Promise<*[]>}
     */
    static async getPermissions (req) {
        let userGuilds = [];
        for (const guild of req.user.guilds) {
            if ((guild.permissions & 2146958591) === 2146958591) {
                userGuilds.push(guild);
            }
        }
        return userGuilds.sort((a, b) => b.permissions - a.permissions);
    }

    /**
     * Check if the user has the permission to manage the bot
     * @param req
     * @returns {Promise<boolean>}
     */
    static async getAdminDashboard(req) {
        return !!(await req.database.table('admin_dashboard').select().where('userId', req.user.id).first())
    }

    /**
     * Return the RGB color from a base10 color
     * @param base10
     * @returns {string}
     */
    static base10ToRGB(base10) {
        let r = (base10 >> 16) & 0xFF;  // Récupérer la partie rouge
        let g = (base10 >> 8) & 0xFF;   // Récupérer la partie verte
        let b = base10 & 0xFF;          // Récupérer la partie bleue
        return `rgb(${r}, ${g}, ${b})`;
    }
}