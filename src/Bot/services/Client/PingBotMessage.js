const { EmbedBuilder } = require("discord.js");

module.exports = class PingBotMessage {
  constructor(event) {
    this.client = event.client;
    this.config = event.config;
    this.colors = event.colors;
    this.emojis = event.emojis;
    this.translate = event.translate.bind(event);
    this.pingBotRecently = new Set();
  }

  async handle(message) {
    // Regex to detect the mention of the bot
    const regex = new RegExp(`^<@!?${this.client.user.id}>$`);

    // If the message doesn't start with the mention of the bot return
    if (!regex.test(message.content)) return;

    // If the message is in DM return
    if (message.channel.type === 1) return;

    // If the bot can't send messages return
    if (
      !message.channel.permissionsFor(this.client.user.id).has("SendMessages")
    )
      return;

    // If the user has pinged the bot recently return
    if (this.pingBotRecently.has(message.author.id)) return;

    // Add the user to the set
    this.pingBotRecently.add(message.author.id);

    // Delete the user from the set after 15 seconds
    setTimeout(() => {
      this.pingBotRecently.delete(message.author.id);
    }, 15 * 1000);

    // Get the slashCommands in the rest api
    let applicationCommands;
    this.client.token === process.env.DEV_TOKEN
      ? (applicationCommands = await message.guild.commands.fetch())
      : (applicationCommands = await this.client.application.commands.fetch());

    // Get the help slash command
    const helpCommand = applicationCommands.find(
      (command) => command.name === "help"
    );
    const helpCommandFormatted = helpCommand
      ? `</${helpCommand.name}:${helpCommand?.id || "null"}>`
      : "`/help`";

    const embed = new EmbedBuilder()
      .setTitle(this.translate`Coucou toi 👋`)
      .setColor(this.colors.blue)
      .setDescription(
        this
          .translate`${this.emojis.slash} Vous pouvez m'utiliser avec mes commandes Slash (/) !\n Pour connaitre toutes mes commandes, veuillez utiliser cette commande ${helpCommandFormatted}.`
      );

    // Send the message
    message.channel
      .send({
        embeds: [embed],
      })
      .catch(() => null);
  }
};
