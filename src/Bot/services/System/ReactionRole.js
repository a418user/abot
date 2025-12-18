module.exports = class ReactionRole {
  constructor(client) {
    this.client = client;
    this.translate = client.translate.bind(client);
  }

  async handle(inter) {
    if (!inter.isStringSelectMenu()) return;
    if (inter.customId !== "reaction_role_display") return;
    await inter.deferUpdate();

    let rolesAdded = [];
    let rolesRemoved = [];
    let rolesError = [];

    for (const roleId of inter.values) {
      let error = false;
      const role = inter.guild.roles.cache.get(roleId);
      if (!role) {
        rolesError.push(roleId);
        continue;
      }

      if (inter.member.roles.cache.has(role.id)) {
        inter.member.roles.remove(role).catch(() => {
          rolesError.push(roleId);
          error = true;
        });

        if (!error) rolesRemoved.push(role);
      } else {
        inter.member.roles.add(role).catch(() => {
          rolesError.push(roleId);
          error = true;
        });

        if (!error) rolesAdded.push(role);
      }
    }
    const roleLabel = (rolesArray) =>
      rolesArray.length > 1 ? this.translate`Rôles` : this.translate`Rôle`;
    const actionLabel = (rolesArray, singular, plural) =>
      rolesArray.length > 1 ? plural : singular;

    let reply = "";
    if (rolesAdded.length !== 0) {
      const addedWord = actionLabel(
        rolesAdded,
        this.translate`ajouté`,
        this.translate`ajoutés`
      );
      reply += this.translate`➕ ${roleLabel(
        rolesAdded
      )} ${addedWord} : **${rolesAdded.map((r) => r.name).join(", ")}**\n`;
    }
    if (rolesRemoved.length !== 0) {
      const removedWord = actionLabel(
        rolesRemoved,
        this.translate`retiré`,
        this.translate`retirés`
      );
      reply += this.translate`➖ ${roleLabel(
        rolesRemoved
      )} ${removedWord} : **${rolesRemoved.map((r) => r.name).join(", ")}**\n`;
    }
    if (rolesError.length !== 0) {
      const errorWord = actionLabel(
        rolesError,
        this.translate`échoué`,
        this.translate`échoués`
      );
      reply += this.translate`❗ ${roleLabel(
        rolesError
      )} ${errorWord} : **${rolesError.map((r) => r.name).join(", ")}**\n`;
    }

    if (reply === "")
      reply = this
        .translate`${this.client.emojiError} Aucun rôle n'a été modifié !`;

    await inter.followUp({ content: reply, flags: 64 });
  }
};
