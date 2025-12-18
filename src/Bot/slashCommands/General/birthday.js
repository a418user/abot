const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class Birthday extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "birthday",
      description: "Gérer son anniversaire",
      options: [
        {
          name: "ajouter",
          description: "Ajouter son anniversaire",
          type: 1,
          options: [
            {
              name: "jour",
              description: "Jour de son anniversaire",
              type: 10,
              required: true,
              min_value: 1,
              max_value: 31,
            },
            {
              name: "mois",
              description: "Choisir le mois de son anniversaire",
              type: 3,
              required: true,
              choices: [
                {
                  name: "Janvier",
                  value: "01",
                },
                {
                  name: "Février",
                  value: "02",
                },
                {
                  name: "Mars",
                  value: "03",
                },
                {
                  name: "Avril",
                  value: "04",
                },
                {
                  name: "Mai",
                  value: "05",
                },
                {
                  name: "Juin",
                  value: "06",
                },
                {
                  name: "Juillet",
                  value: "07",
                },
                {
                  name: "Août",
                  value: "08",
                },
                {
                  name: "Septembre",
                  value: "09",
                },
                {
                  name: "Octobre",
                  value: "10",
                },
                {
                  name: "Novembre",
                  value: "11",
                },
                {
                  name: "Décembre",
                  value: "12",
                },
              ],
            },
            {
              name: "année",
              description: "Choisir l'année de son anniversaire",
              type: 10,
              required: true,
              min_value: 1900,
              max_value: new Date().getFullYear(),
            },
            {
              name: "privé",
              description: "Afficher l'âge",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "supprimer",
          description: "Supprimer son anniversaire",
          type: 1,
        },
        {
          name: "check",
          description: "Vérifier son anniversaire",
          type: 1,
        },
        {
          name: "prochain",
          description: "Voir les anniversaires qui vont arriver",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.General,
    });
  }

  async run(ctx) {
    const sub_command = ctx.options.getSubcommand();
    const months = {
      "01": ctx.translate`Janvier`,
      "02": ctx.translate`Février`,
      "03": ctx.translate`Mars`,
      "04": ctx.translate`Avril`,
      "05": ctx.translate`Mai`,
      "06": ctx.translate`Juin`,
      "07": ctx.translate`Juillet`,
      "08": ctx.translate`Août`,
      "09": ctx.translate`Septembre`,
      10: ctx.translate`Octobre`,
      11: ctx.translate`Novembre`,
      12: ctx.translate`Décembre`,
    };

    if (sub_command === "ajouter") {
      const day = ctx.options.getNumber("jour");
      const month = ctx.options.getString("mois");
      const year = ctx.options.getNumber("année");
      const privateAge = ctx.options.getBoolean("privé");

      const birthDb = await ctx.database
        .table("user_birthday")
        .select()
        .where("user_id", ctx.user.id);

      if (birthDb[0]) {
        await ctx.database
          .table("user_birthday")
          .update({
            day: day,
            month: month,
            year: year,
            private_age: privateAge,
          })
          .where("user_id", ctx.user.id);
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Votre anniversaire a été modifié au **${day} ${months[month]} ${year}** !`,
        });
      } else {
        await ctx.database.table("user_birthday").insert({
          user_id: ctx.user.id,
          day: day,
          month: month,
          year: year,
          private_age: privateAge,
        });
        ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Votre anniversaire a été enregistré le **${day} ${months[month]} ${year}** !`,
        });
      }
    } else if (sub_command === "supprimer") {
      const birthDb = await ctx.database
        .table("user_birthday")
        .select()
        .where("user_id", ctx.user.id);
      if (!birthDb[0])
        return ctx.error(
          ctx.translate`${ctx.emojiError} Vous n'avez pas d'anniversaire d'enregistré !`
        );

      await ctx.database
        .table("user_birthday")
        .delete()
        .where("user_id", ctx.user.id);
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Votre anniversaire a été supprimé !`,
      });
    } else if (sub_command === "check") {
      const birthDb = await ctx.database
        .table("user_birthday")
        .select()
        .where("user_id", ctx.user.id);
      if (!birthDb[0])
        return ctx.error(
          ctx.translate`${ctx.emojiError} Vous n'avez pas d'anniversaire d'enregistré !`
        );

      const day = birthDb[0].day;
      const month = birthDb[0].month;
      const year = birthDb[0].year;
      const privateAge = birthDb[0].private_age;

      if (privateAge)
        return ctx.send({
          content: ctx.translate`${ctx.emojiSuccess} Votre anniversaire est le **${day} ${months[month]}** !`,
        });
      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Votre anniversaire est le **${day} ${months[month]} ${year}** !`,
      });
    } else if (sub_command === "prochain") {
      const month = new Date().getMonth() + 1;

      const birthDb = await ctx.database.table("user_birthday").select();
      if (!birthDb[0])
        return ctx.error(
          ctx.translate`${ctx.client.emojiError} Il n'y a pas d'anniversaire d'enregistré !`
        );

      const members = await ctx.guild.members.fetch();

      // Get the birthday of the month & the next months
      const nextBirthday = {};
      for (const b of birthDb) {
        if (!members.get(b.user_id)) continue;

        const bMonthSplit = b.month.split("");
        const bMonth =
          bMonthSplit[0] === "0" ? Number(bMonthSplit[1]) : Number(b.month);

        if (bMonth >= month) {
          const formattedMonth = bMonth < 10 ? `0${bMonth}` : bMonth;
          if (!nextBirthday[formattedMonth]) nextBirthday[formattedMonth] = [];
          nextBirthday[formattedMonth].push(b);
        }
      }

      if (Object.keys(nextBirthday).length === 0)
        return ctx.error(
          ctx.translate`${ctx.emojiError} Il n'y a pas d'anniversaire à venir !`
        );

      // Sort per day
      for (const b in nextBirthday) {
        nextBirthday[b].sort((a, b) => a.day - b.day);
      }

      // Sort per month
      const sorted = Object.keys(nextBirthday).sort((a, b) => a - b);

      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setTitle(ctx.translate`Prochains anniversaires`)
        .setDescription(
          ctx.translate`Voici les prochains anniversaires :\n\n${sorted
            .map((b) =>
              nextBirthday[b]
                .map(
                  (b) =>
                    `\`-\` ${
                      ctx.client.users.cache.get(b.user_id)
                        ? `**${
                            ctx.client.users.cache.get(b.user_id).displayName
                          }**`
                        : `\`${b.user_id}\``
                    } : ${b.day} ${months[b.month]} ${b.year} (${
                      new Date().getFullYear() - b.year
                    } ans)`
                )
                .join("\n")
            )
            .slice(0, 10)
            .join("\n")}`
        );

      ctx.send({ embeds: [embed] });
    }
  }
};
