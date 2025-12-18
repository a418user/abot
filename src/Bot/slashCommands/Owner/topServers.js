const SlashCommand = require("../../managers/structures/SlashCommands.js");
const { EmbedBuilder } = require("discord.js");

module.exports = class TopServers extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "top-servers",
      description: "Obtenir tous les serveurs du bot",
      category: SlashCommand.Categories.Owner,
      ownerOnly: true,
      user_permissions: ["Administrator"],
      bot_permissions: ["EmbedLinks"],
    });
  }

  getEmbed(ctx, range, servers) {
    return new EmbedBuilder()
      .setTitle(ctx.translate`Liste des serveurs ${range}`)
      .setColor(ctx.colors.blue)
      .setFooter({
        text: `${ctx.user.displayName}`,
        iconURL: `${ctx.user.displayAvatarURL()}`,
      })
      .setDescription(servers.join("\n"));
  }

  async run(ctx) {
    await ctx.inter.deferReply();

    const servers = ctx.client.guilds.cache.sort(
      (a, b) => b.memberCount - a.memberCount
    );

    let serversArray = [];
    for (const guild of servers.values()) {
      serversArray.push(
        `\`${guild.id}\` - **${guild.name}** - \`${guild.memberCount}\` ${
          guild.memberCount > 1 ? "membres" : "membre"
        }`
      );
    }

    const range =
      serversArray.length === 1 ? "[1]" : `[1 - ${serversArray.length}]`;

    let page = 1;
    const numberPerPage = 25;
    const dataList = ctx.utils.getNumberPacket(serversArray, numberPerPage);

    let msg;
    const filter = (button) => button.user.id === ctx.inter.user.id;

    if (dataList.length === 1) {
      msg = await ctx.inter.editReply({
        embeds: [this.getEmbed(ctx, range, dataList[page - 1])],
      });
    } else {
      msg = await ctx.inter.editReply({
        embeds: [this.getEmbed(ctx, range, dataList[page - 1])],
        components: ctx.messageFormatter.pages(
          "left",
          "middle",
          "right",
          ctx.translate`Page ${page}/${dataList.length}`,
          page,
          dataList.length
        ),
      });

      const collector = msg.createMessageComponentCollector({
        filter,
        time: 10 * 60 * 1000,
        componentType: 2,
      });

      collector.on("collect", async (button) => {
        if (!["left", "right"].includes(button.customId)) return;
        await button.deferUpdate();

        button.customId === "left" ? page-- : page++;

        await msg
          .edit({
            embeds: [this.getEmbed(ctx, range, dataList[page - 1])],
            components: ctx.messageFormatter.pages(
              "left",
              "middle",
              "right",
              ctx.translate`Page ${page}/${dataList.length}`,
              page,
              dataList.length
            ),
          })
          .catch(() => null);
      });

      collector.on("end", async () => {
        return msg.edit({ components: [] }).catch(() => null);
      });
    }
  }
};
