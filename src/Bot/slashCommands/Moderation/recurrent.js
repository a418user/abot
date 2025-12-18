const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { SimpleIntervalJob, Task } = require("toad-scheduler");
const { EmbedBuilder } = require("discord.js");

module.exports = class Recurrent extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "message-récurrent",
      description: "Gérer les messages récurrents",
      options: [
        {
          name: "créer",
          description: "Envoyer un message récurrent dans un salon",
          type: 1,
          options: [
            {
              name: "temps",
              description: "Tous les combien envoyer le rappel (ex: 09:00)",
              type: 3,
              required: true,
            },
            {
              name: "salon",
              description: "Le salon où envoyer le message",
              type: 7,
              channel_types: [0],
              required: true,
            },
            {
              name: "message",
              description: "Le message à envoyer",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "lister",
          description: "Lister les messages récurrents",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer un message récurrent",
          type: 1,
          options: [
            {
              name: "salon",
              description: "Le salon où le message est envoyé",
              type: 7,
              channel_types: [0],
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "créer") {
      /* Get the data */
      const hour = ctx.options.getString("temps");
      const channel = ctx.options.getChannel("salon");
      const message = ctx.options.getString("message");

      /* Check if the hour is valid */
      const time = hour.split(":");
      if (
        time.length !== 2 ||
        isNaN(Number(time[0])) ||
        isNaN(Number(time[1])) ||
        Number(time[0]) > 23 ||
        Number(time[0]) < 0 ||
        Number(time[1]) > 59 ||
        Number(time[1]) < 0
      )
        return ctx.error(ctx.translate`L'heure donnée est invalide !`);

      /* Check if there is already a reminder in this channel */
      const reminder = await ctx.database
        .table("guild_recurrent")
        .where("channel_id", channel.id);
      if (reminder[0])
        return ctx.error(
          ctx.translate`Un message récurrent est déjà programmé dans ce salon !`
        );

      /* Get the time in seconds */
      const timeInSeconds = Number(time[0]) * 3600 + Number(time[1]) * 60;

      /* Add the reminder in the database */
      await ctx.database.table("guild_recurrent").insert({
        guild_id: ctx.guild.id,
        channel_id: channel.id,
        message: message,
        time: timeInSeconds,
      });

      const task = new Task(
        `${channel.id}`,
        () => {
          /* Send the message */
          channel.send({ content: message });
        },
        (err) => {
          console.log(err);
        }
      );

      const job = new SimpleIntervalJob(
        {
          seconds: timeInSeconds,
          runImmediately: false,
        },
        task,
        {
          id: `${channel.id}`,
          preventOverrun: true,
        }
      );

      ctx.client.scheduler.addSimpleIntervalJob(job);

      /* Send the success message */
      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Le message récurrent a bien été programmé dans le salon ${channel} !`}`,
      });
    } else if (subCommand === "lister") {
      let jobs = ctx.client.scheduler.getAllJobs();

      /* Filter the jobs */
      jobs = jobs.filter((job) => ctx.getChannel(job.id));

      if (!jobs[0])
        return ctx.error(
          ctx.translate`Aucun message récurrent n'a été trouvé !`
        );

      const embedBuilder = new EmbedBuilder()
        .setTitle(ctx.translate`Liste des messages récurrents`)
        .setColor(ctx.colors.blue)
        .setFooter({
          text: ctx.guild.name,
          iconURL: ctx.guild.iconURL() || ctx.client.user.displayAvatarURL(),
        })
        .setDescription(
          jobs
            .map((job) => {
              return ctx.translate`**Salon :** <#${job.id}>`;
            })
            .join("\n")
        );

      /* Send the message */
      ctx.send({ embeds: [embedBuilder] });
    } else if (subCommand === "supprimer") {
      /* Get the data */
      const channel = ctx.options.getChannel("salon");

      /* Delete the scheduler */
      const job = ctx.client.scheduler.removeById(String(channel.id));
      if (!job)
        return ctx.error(
          ctx.translate`Aucun message récurrent n'a été trouvé dans ce salon !`
        );

      // Remove from the database
      await ctx.client.database.table("guild_recurrent").delete().where({
        guild_id: ctx.guild.id,
        channel_id: channel.id,
      });

      /* Send the success message */
      ctx.send({
        content: `${
          ctx.client.emojiSuccess
        } ${ctx.translate`Le message récurrent a bien été arrêté dans le salon ${channel} !`}`,
      });
    }
  }
};
