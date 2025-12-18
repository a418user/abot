const SlashCommands = require("../../managers/structures/SlashCommands");
const CommandContext = require("../../managers/CommandContext");
const { PermissionsBitField } = require("discord.js");

module.exports = class SlashCommandsService {
  constructor(event) {
    this.event = event;
    this.client = event.client;
    this.slashLogger = event.slashLogger;
    this.database = event.database;
    this.config = event.config;
    this.messageFormatter = event.messageFormatter;
    this.translate = event.translate.bind(event);
  }

  async handle(inter) {
    // Check if the interaction is a command
    if (!inter.isChatInputCommand()) return;

    // Check if the interaction is in DM
    if (inter.channel.type === 1)
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`Non disponible en message privé !`
        ),
        flags: 64,
      });

    // Check if the bot can see & write in the channel
    if (
      !inter.channel
        .permissionsFor(this.client.user.id)
        ?.has(PermissionsBitField.Flags.ViewChannel)
    )
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`J'ai besoin de la permission \`ViewChannel\` !`
        ),
        flags: 64,
      });

    if (
      !inter.channel
        .permissionsFor(this.client.user.id)
        ?.has(PermissionsBitField.Flags.SendMessages)
    )
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`J'ai besoin de la permission \`SendMessages\` !`
        ),
        flags: 64,
      });

    if (
      !inter.channel
        .permissionsFor(this.client.user.id)
        ?.has(PermissionsBitField.Flags.SendMessagesInThreads)
    )
      return inter.reply({
        content: this.messageFormatter.error(
          this
            .translate`J'ai besoin de la permission \`SendMessagesInThreads\` !`
        ),
        flags: 64,
      });

    if (
      !inter.channel
        .permissionsFor(this.client.user.id)
        ?.has(PermissionsBitField.Flags.ManageMessages)
    )
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`J'ai besoin de la permission \`ManageMessages\` !`
        ),
        flags: 64,
      });

    // Get the command
    const slashCmd = this.client.slashCommandsHandler.getSlashCommand(
      inter.commandName
    );
    if (!slashCmd)
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`Cette commande n'existe pas !`
        ),
        flags: 64,
      });

    // Check if the user is an owner
    if (
      slashCmd.category.id === SlashCommands.Categories.Owner.id &&
      !this.config["devId"].includes(inter.user.id)
    )
      return inter.reply({
        content: this.messageFormatter.error(
          this.translate`Vous n'êtes pas autorisé à faire cette commande !`
        ),
        flags: 64,
      });

    // Retrieving bot member information
    const me = await inter.guild.members.fetch(this.client.user.id);

    // Check if the bot has the right permissions
    if (
      slashCmd.bot_permissions.length > 0 &&
      !slashCmd.bot_permissions.every((p) => me.permissions.has(p))
    ) {
      const permissions = this.translate`J'ai besoin des permissions ${
        "`" + slashCmd.bot_permissions.join("`, `") + "`"
      } !`;
      return inter.reply({ content: this.messageFormatter.error(permissions) });
    }

    // Create the command context
    const ctx = new CommandContext(this.client, slashCmd, inter);

    slashCmd.run(ctx).catch((err) => {
      console.log(err);
      inter
        .reply({
          content: this.messageFormatter.error(
            this
              .translate`Une erreur est survenue lors de l'exécution de la commande ! Le problème a été remonté à l'équipe de développement.`
          ),
          flags: 64,
        })
        .catch(() => null);
    });

    this.slashLogger.slashCommand(inter);

    /* Add commands per day */
    this.client.statistics.addCommandsPerDay();
  }
};
