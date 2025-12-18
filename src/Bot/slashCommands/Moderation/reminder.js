const SlashCommand = require("../../managers/structures/SlashCommands.js");
const ms = require("ms");
const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const schedule = require("node-schedule");

module.exports = class Reminder extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "rappel",
      description: "Créer un rappel",
      options: [
        {
          name: "créer",
          description: "Créer un rappel",
          type: 1,
          options: [
            {
              name: "temps",
              description: "Temps à attendre (1s/m/h/d)",
              type: 3,
              required: true,
            },
            {
              name: "recurrent",
              description: "Rappel récurrent",
              type: 5,
              required: true,
            },
          ],
        },
        {
          name: "lister",
          description: "Lister ses rappels",
          type: 1,
        },
        {
          name: "supprimer",
          description: "Supprimer son rappel récurrent",
          type: 1,
        },
      ],
      category: SlashCommand.Categories.Moderation,
      user_permissions: ["ManageMessages"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  async run(ctx) {
    const subCommand = ctx.options.getSubcommand();

    if (subCommand === "créer") {
      const time = ctx.options.getString("temps");
      if (!ms(time))
        return ctx.error(ctx.translate`Le temps doit être valide !`);

      const recurrent = ctx.options.getBoolean("recurrent");

      // Limit a time to 5 years
      if (ms(time) > ms("5y"))
        return ctx.error(ctx.translate`Le temps doit être inférieur à 5 ans !`);

      // Avoid spam recurrence
      if (recurrent) {
        const hasRecurrence = await ctx.database
          .table("guild_reminder")
          .select()
          .where({
            guild_id: ctx.guild.id,
            member_id: ctx.user.id,
            recurrent: true,
          });
        if (hasRecurrence[0])
          return ctx.error(ctx.translate`Vous avez déjà un rappel récurrent !`);

        if (ms(time) < ms("1h"))
          return ctx.error(
            ctx.translate`Le temps doit être supérieur à 1 heure pour effectuer une récurrence !`
          );
      }

      const date = Date.now();
      const modal = new ModalBuilder()
        .setCustomId(`modal_reminder_${date}`)
        .setTitle(ctx.translate`Message`);

      const textInput = new TextInputBuilder()
        .setCustomId("modal_reminder_text")
        .setStyle(2)
        .setLabel(ctx.translate`Quel est le message ?`)
        .setRequired(true)
        .setMaxLength(1900);

      const actionRow = new ActionRowBuilder().addComponents(textInput);

      modal.addComponents(actionRow);

      ctx.inter.showModal(modal).catch(() => null);

      const filterModal = (modal) =>
        modal.customId === `modal_reminder_${date}`;
      ctx.inter
        .awaitModalSubmit({ filter: filterModal, time: 5 * 60 * 1000 })
        .catch(() => null)
        .then(async (modal) => {
          if (modal === undefined || modal === null) return;
          await modal.deferUpdate().catch(() => null);
          const content = modal.fields.getTextInputValue("modal_reminder_text");
          const timing = Date.now() + ms(time);

          await modal.followUp({
            content: `${
              ctx.emojiSuccess
            } ${ctx.translate`Le rappel aura lieu le <t:${Math.floor(
              timing / 1000
            )}:d> à <t:${Math.floor(timing / 1000)}:t> (<t:${Math.floor(
              timing / 1000
            )}:R>) !
:warning: **Assurez vous que je puisse vous envoyer un message privé.**`}`,
            flags: 64,
          });

          await ctx.database
            .table("guild_reminder")
            .insert({
              guild_id: ctx.guild.id,
              member_id: ctx.user.id,
              time: timing,
              duration: time,
              content: content,
              recurrent: recurrent,
            })
            .then(async (id) => {
              schedule.scheduleJob(timing, async () => {
                const embed = new EmbedBuilder()
                  .setColor(ctx.colors.blue)
                  .setTitle(ctx.translate`📌 Rappel`)
                  .setDescription(content)
                  .setFooter({
                    text: "abot",
                    iconURL: ctx.client.user.displayAvatarURL(),
                  });

                ctx.user.send({ embeds: [embed] }).catch(() => null);

                await this.isRecurrent(ctx, id[0]);
              });
            });
        });
    } else if (subCommand === "lister") {
      const reminder = await ctx.database
        .table("guild_reminder")
        .select()
        .where({
          guild_id: ctx.guild.id,
          member_id: ctx.user.id,
        });

      if (!reminder[0])
        return ctx.error(ctx.translate`Vous n'avez aucun rappel !`);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: ctx.translate`Liste des rappels`,
          iconURL: `${
            ctx.guild.iconURL() || ctx.client.user.displayAvatarURL()
          }`,
        })
        .setColor(ctx.colors.blue)
        .setThumbnail(ctx.guild.iconURL() || ctx.client.user.displayAvatarURL())
        .setDescription(
          reminder
            .map((r) => {
              return ctx.translate`- <t:${Math.floor(
                r.time / 1000
              )}:d> à <t:${Math.floor(r.time / 1000)}:t> (<t:${Math.floor(
                r.time / 1000
              )}:R>) : ${r.content}`;
            })
            .join("\n")
        );

      ctx.send({
        embeds: [embed],
        flags: 64,
      });
    } else if (subCommand === "supprimer") {
      const hasRecurrence = await ctx.database
        .table("guild_reminder")
        .select()
        .where({
          guild_id: ctx.guild.id,
          member_id: ctx.user.id,
          recurrent: true,
        });
      if (!hasRecurrence[0])
        return ctx.error(ctx.translate`Vous n'avez pas de rappel récurrent !`);

      await ctx.database.table("guild_reminder").delete().where({
        guild_id: ctx.guild.id,
        member_id: ctx.user.id,
        recurrent: true,
      });

      ctx.send({
        content: `${
          ctx.emojiSuccess
        } ${ctx.translate`Votre rappel récurrent a été supprimé !`}`,
      });
    }
  }

  async isRecurrent(ctx, id) {
    const data = await ctx.database
      .table("guild_reminder")
      .select()
      .where({ id })
      .first();
    if (!data) return;

    if (Boolean(data.recurrent) === true) {
      const timing = Date.now() + ms(data.duration);

      schedule.scheduleJob(timing, async () => {
        const embed = new EmbedBuilder()
          .setColor(ctx.colors.blue)
          .setTitle(ctx.translate`📌 Rappel`)
          .setDescription(data.content)
          .setFooter({
            text: "abot",
            iconURL: ctx.client.user.displayAvatarURL(),
          });

        ctx.user.send({ embeds: [embed] }).catch(() => null);

        await this.isRecurrent(ctx, id);
      });
    } else {
      await ctx.database.table("guild_reminder").delete().where({ id });
    }
  }
};
