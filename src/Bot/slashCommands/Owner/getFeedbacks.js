const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class GetFeedback extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "get-feedback",
      description: "Avoir les réponses des feedbacks",
      options: [
        {
          name: "global",
          description: "Avoir les réponses des feedbacks globaux",
          type: 1,
        },
        {
          name: "server",
          description: "Savoir quel réponse a donné un serveur",
          type: 1,
          options: [
            {
              name: "serveur",
              description: "Le serveur",
              type: 3,
              required: true,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Owner,
      ownerOnly: true,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });

    this.response = {
      support: "Support du bot",
      website: "Site web",
      topgg: "Top.gg",
      disboard: "Disboard",
      other: "Autres",
    };
  }

  async run(ctx) {
    // Only for dev
    if (!ctx.config["devId"].includes(ctx.user.id))
      return ctx.error(
        ctx.translate`Vous n'avez pas la permission d'utiliser cette commande !`
      );

    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "global") {
      const feedback = await ctx.database.table("feedback").select();
      if (!feedback[0])
        return ctx.error(ctx.translate`Aucun feedback trouvé !`);

      /* Use a function to get all the same choice together to count them */
      const data = feedback.reduce((acc, f) => {
        if (!acc[f.choice]) acc[f.choice] = 0;
        acc[f.choice]++;
        return acc;
      }, {});

      /* Get only other feedbacks */
      const other = feedback.filter((f) => f.choice === "other");

      /* Use a function to get all the same response together to count them */
      const otherData = other.reduce((acc, f) => {
        if (!acc[f.response]) acc[f.response] = 0;
        acc[f.response]++;
        return acc;
      }, {});

      const description = Object.keys(data)
        .map((key) => {
          const label = ctx.translate`${this.response[key]}`;
          const baseLine = ctx.translate`- **${label}** : \`${data[key]}\``;
          if (key !== "other") return baseLine;

          const extra = Object.keys(otherData)
            .map(
              (choice) =>
                ctx.translate`  - ${choice} : \`${otherData[choice]}\``
            )
            .join("\n");
          return `${baseLine}\n${extra}`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setTitle(ctx.translate`Feedbacks`)
        .setDescription(description)
        .setFooter({
          text: `${ctx.user.displayName}`,
          iconURL: ctx.user.displayAvatarURL(),
        });

      return ctx.send({ embeds: [embed] });
    } else if (subCommand === "server") {
      const guildId = ctx.options.getString("serveur");
      const feedback = await ctx.database
        .table("feedback")
        .select("choice")
        .where("guildId", guildId);
      if (!feedback[0])
        return ctx.error(ctx.translate`Aucun feedback trouvé !`);

      let guild = ctx.getGuild(guildId);
      if (!guild)
        guild = await ctx.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return ctx.error(ctx.translate`Serveur introuvable !`);

      const embed = new EmbedBuilder()
        .setColor(ctx.colors.blue)
        .setTitle(ctx.translate`Feedback de ${guild.name}`)
        .setDescription(
          ctx.translate`Le serveur **${guild.name}** a répondu **${
            this.response[feedback[0].choice]
          }**${
            feedback[0].response !== null ? ` ${feedback[0].response}` : ""
          } !`
        )
        .setFooter({
          text: `${ctx.user.displayName}`,
          iconURL: ctx.user.displayAvatarURL(),
        });

      return ctx.send({ embeds: [embed] });
    }
  }
};
