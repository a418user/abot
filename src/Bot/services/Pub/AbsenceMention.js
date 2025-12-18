module.exports = class AbsenceMention {
    constructor (client) {
        this.client = client
        this.database = client.database
        this.coolDowns = new Set()
    }

    async handle (message) {
        // Check if the message is sent by a bot or not in a guild
        if (message.author.bot || !message.guild) return

        // If the message doesn't have mention, return
        if (!message.mentions.members.first()) return

        // Bypass if the member is a moderator
        if (message.member.permissions.has('ManageMessages')) return

        // Get the absence database
        const absences = await this.database.table('guild_afk').select().where({
            guild_id: message.guild.id,
            inPause: false
        });

        // Loop through each mention
        for (const [memberId] of message.mentions.members) {
            // Check if the member has an absence
            const hasAbsence = absences.find(absence => absence.member_id === memberId);

            // If the member doesn't have an absence, return
            if (!hasAbsence) continue

            // Get the member
            const member = message.guild.members.cache.get(memberId);

            // If the member is not found, return
            if (!member) continue

            // Check if the member is in the coolDowns
            if (this.coolDowns.has(memberId)) continue

            // Add the member to the coolDowns
            this.coolDowns.add(memberId)

            // Remove it after 5 seconds
            setTimeout(() => this.coolDowns.delete(memberId), 5000);

            // Send the message
            const msg = await message.channel.send({
                content: `${message.author}, **${member.displayName}** est actuellement absent(e) ! Veuillez ne pas le mentionner.`
            });

            // Delete the message after 5 seconds
            setTimeout(() => msg.delete().catch(() => null), 5000);
        }
    }
}