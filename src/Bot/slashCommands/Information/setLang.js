const SlashCommand = require('../../managers/structures/SlashCommands.js');

module.exports = class SetLang extends SlashCommand {
    constructor(handler) {
        super(handler,{
            name: 'set-lang',
            description: 'Set the language of the bot',
            description_localizations: {
                "fr": "Définir la langue du bot"
            },
            options: [{
                name: 'language',
                name_localizations: {
                        "fr": "langage"
                    },
                description: 'Choose the language',
                description_localizations: {
                    "fr": "Choisissez la langue"
                },
                type: 3,
                required: true,
                choices: [{
                    name: 'French',
                    name_localizations: {
                        "fr": "Français"
                    },
                    value: 'fr'
                },
                    {
                        name: 'English',
                        name_localizations: {
                            "fr": "Anglais"
                        },
                        value: 'en'
                    }]
            }],
            category: SlashCommand.Categories.Information
        });
    }

    async run (ctx) {
        const choice = ctx.options.getString('language');

        const languagesDb = await ctx.database.table('languages').select().where({ userId: ctx.user.id });

        ctx.client.languages.setLanguage(ctx.user.id, choice);

        if (languagesDb[0]) {
            await ctx.database.table('languages').update({ language: choice }).where({ userId: ctx.user.id });
        }
        else {
            await ctx.database.table('languages').insert({ userId: ctx.user.id, language: choice });
        }

        ctx.send({ content: `${ctx.emojiSuccess} ${ctx.translate`La langue a bien été changée !`}` });
    }
}