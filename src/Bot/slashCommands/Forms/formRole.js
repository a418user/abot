const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class FormRole extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid-rôle-admin",
      description:
        "Gérer le rôle qui permet d'accéder aux formulaires de candidature",
      options: [
        {
          name: "configurer",
          description:
            "Configurer le rôle qui permet d'accéder aux formulaires de candidature",
          type: 1,
          options: [
            {
              name: "rôle",
              description:
                "Le rôle qui permet d'accéder aux formulaires de candidature",
              type: 8,
              required: true,
            },
            {
              name: "id",
              description: "L'id du formulaire de candidature",
              type: 4,
              required: true,
              min_value: 1,
            },
          ],
        },
        {
          name: "supprimer",
          description:
            "Supprimer le rôle qui permet d'accéder aux formulaires de candidature",
          type: 1,
          options: [
            {
              name: "id",
              description: "L'id du formulaire de candidature",
              type: 4,
              required: true,
              min_value: 1,
              max_value: 10,
            },
          ],
        },
      ],
      category: SlashCommand.Categories.Forms,
      user_permissions: ["ManageGuild"],
    });
  }

  async run(ctx) {
    const baseGuildForm = await ctx.database
      .table("guild_form")
      .select()
      .where("guild_id", ctx.guild.id);
    if (!baseGuildForm[0])
      return ctx.error(
        ctx.translate`Il n'y a aucun formulaire de candidature sur ce serveur !`
      );

    const subCommand = ctx.options.getSubcommand();
    const id = ctx.options.getInteger("id");

    if (subCommand === "configurer") {
      const role = ctx.options.getRole("rôle");

      const form = baseGuildForm.find((form) => form.id === id);
      if (!form)
        return ctx.error(
          ctx.translate`Le formulaire avec l'id \`${id}\` n'existe pas !`
        );

      await ctx.database
        .table("guild_form")
        .update({
          role_access_id: role.id,
        })
        .where("id", id);

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle **${role.name}** permet maintenant d'accéder au formulaire de candidature **${form.form_name}** !`,
      });
    } else if (subCommand === "supprimer") {
      const form = baseGuildForm.find((form) => form.id === id);
      if (!form)
        return ctx.error(
          ctx.translate`Le formulaire avec l'id \`${id}\` n'existe pas !`
        );

      if (!form.role_access_id)
        return ctx.error(
          ctx.translate`Le formulaire **${form.form_name}** n'a pas de rôle qui permet d'accéder au formulaire de candidature !`
        );

      ctx.send({
        content: ctx.translate`${ctx.emojiSuccess} Le rôle qui permet d'accéder au formulaire de candidature **${form.form_name}** a été supprimé !`,
      });
    }
  }
};
