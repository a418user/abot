const SlashCommand = require("../../managers/structures/SlashCommands.js");

module.exports = class FormDelete extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "candid-supprimer",
      description: "Supprimer un formulaire de candidature",
      options: [
        {
          name: "id",
          description: "L'id du formulaire de candidature",
          type: 4,
          required: true,
          min_value: 1,
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

    const id = ctx.options.getInteger("id");

    const form = baseGuildForm.find((form) => form.id === id);
    if (!form)
      return ctx.error(
        ctx.translate`Le formulaire avec l'id \`${id}\` n'existe pas !`
      );

    await ctx.database.table("guild_form").delete({}).where("id", id);

    ctx.send({
      content: ctx.translate`${ctx.emojiSuccess} Le formulaire de candidature **${form.form_name}** a bien été supprimé !`,
    });
  }
};
