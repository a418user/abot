const I18n = require('node-i18n');
const fs = require('fs/promises');
const path = require('path');

module.exports = class TranslateHandler {
    constructor(client) {
        this.client = client
        this.config = client.config
        this.i18n = I18n;
        this.usersLanguages = {} // { 'userId': 'language' }
        this.availableLangs = [];
    }

    async loadLanguages () {
        const hasTableLanguage = await this.client.database.hasTable("languages");
        if (!hasTableLanguage) return this.client.logger.error('La database languages n\'a pas été trouvée !');

        const languages = await this.client.database.table('languages');

        for (const user of languages) {
            this.usersLanguages[user.userId] = user.language;
        }

        this.client.logger.lang(`Langues chargée !`);
    }

    async load() {
        await this.loadLanguages();

        const translationsPath = path.resolve(__dirname, '../../translations');
        const files = await fs.readdir(translationsPath);

        const bundles = {};

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const data = await fs.readFile(path.resolve(translationsPath, file));
            const lang = file.split('.')[0];

            this.availableLangs.push(lang);

            bundles[lang] = JSON.parse(data);
        }

        if (this.availableLangs.length > 0) {
            this.i18n.init({ bundles, defaultCurrency: "€" });
            this.i18n.use(this.config['system']['defaultLanguage']);
        }
    }

    use(lang) {
        this.i18n.use(lang);
        return this;
    }

    translate(text, ...values) {
        return this.i18n.translate(text, ...values);
    }

    getLanguage(userId) {
        return this.usersLanguages[userId] || this.config['system']['defaultLanguage'];
    }

    setLanguage = (userId, language) => {
        this.usersLanguages[userId] = language;
    }
}