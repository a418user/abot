module.exports = class RulesButton {
  constructor(client) {
    this.client = client;
    this.database = client.database;
    this.translate = client.translate.bind(client);
  }

  async handle(inter) {
    if (!inter.isButton()) return;
    if (inter.customId !== "rules_accept") return;

    const base = await this.database
      .table("guild_rules")
      .select()
      .where("guild_id", inter.guild.id);
    if (!base[0]) return;

    const role = inter.guild.roles.cache.get(base[0].role_id);
    if (!role) return;

    if (!inter.member.roles.cache.has(role.id)) {
      await inter.member.roles.add(role.id).catch(() => null);
      return inter.reply({
        content: `${this.client.emojiSuccess} ${this
          .translate`Vous avez accepté le règlement et reçu le rôle ${role} !`}`,
        flags: 64,
      });
    } else {
      return inter.reply({
        content: `${this.client.emojiError} ${this
          .translate`Vous avez déjà accepté le règlement !`}`,
        flags: 64,
      });
    }
  }
};
