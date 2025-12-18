module.exports = class Statistics {
    constructor(client) {
        this.database = client.database
        this.loadFinished = false
        this.commandsPerDay = new Map()
        this.newServerPerDay = new Map()
        this.lostServerPerDay = new Map()
        this.updateDataEveryHour = setInterval(async () => { await this.everyHours() }, 60 * 60 * 1000);
        this.updateDataEveryDay = setInterval(async () => { await this.everyDays() }, 24 * 60 * 60 * 1000);
    }

    getCommandsPerDay() {
        return this.commandsPerDay
    }

    getNewServerPerDay() {
        return this.newServerPerDay
    }

    getLostServerPerDay() {
        return this.lostServerPerDay
    }

    addCommandsPerDay() {
        if (!this.loadFinished) return
        let day = this.getDate()

        let dayResult = this.commandsPerDay.get(day)
        if (!dayResult) dayResult = 0
        this.commandsPerDay.set(day, dayResult + 1)
    }

    addNewServerPerDay() {
        if (!this.loadFinished) return
        let day = this.getDate()

        let dayResult = this.newServerPerDay.get(day)
        if (!dayResult) dayResult = 0
        this.newServerPerDay.set(day, dayResult + 1)
    }

    addLostServerPerDay() {
        if (!this.loadFinished) return
        let day = this.getDate()

        let dayResult = this.lostServerPerDay.get(day)
        if (!dayResult) dayResult = 0
        this.lostServerPerDay.set(day, dayResult + 1)
    }

    getDate() {
        let d = new Date();
        return d.getDate()
    }

    async everyHours() {
        if (!this.loadFinished) return

        let commands = []

        for (const [day, value] of this.commandsPerDay) {
            commands.push({ "day": day, "value": value });
        }

        const result = await this.database.table('dashboard_info').where('id', 1);

        if (!result[0]) {
            await this.database.table('dashboard_info').insert({
                commands: JSON.stringify(commands)
            })
        }
        else {
            await this.database.table('dashboard_info').update({
                commands: JSON.stringify(commands)
            }).where('id', 1)
        }
    }

    async everyDays() {
        if (!this.loadFinished) return

        let serversNew = []
        let serversLost = []

        for (const [day, value] of this.newServerPerDay) {
            serversNew.push({ "day": day, "value": value });
        }

        for (const [day, value] of this.lostServerPerDay) {
            serversLost.push({ "day": day, "value": value });
        }

        const result = await this.database.table('dashboard_info').where('id', 1);

        if (!result[0]) {
            await this.database.table('dashboard_info').insert({
                serversNew: JSON.stringify(serversNew),
                serversLost: JSON.stringify(serversLost)
            })
        }
        else {
            await this.database.table('dashboard_info').update({
                serversNew: JSON.stringify(serversNew),
                serversLost: JSON.stringify(serversLost)
            }).where('id', 1)
        }
    }

    async restoreCommandsPerDay() {
        const hasTable = await this.database.hasTable('dashboard_info');
        if (!hasTable) return

        const result = await this.database.table('dashboard_info').select().where('id', 1);
        if (result[0]) {
            const commands = JSON.parse(result[0].commands);
            const serversNew = JSON.parse(result[0].serversNew);
            const serversLost = JSON.parse(result[0].serversLost);

            for (const { day, value } of commands) {
                this.commandsPerDay.set(day, value)
            }

            for (const { day, value } of serversNew) {
                this.newServerPerDay.set(day, value)
            }

            for (const { day, value } of serversLost) {
                this.lostServerPerDay.set(day, value)
            }
        }

        this.loadFinished = true
    }
}