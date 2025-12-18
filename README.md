# Abot — Guide d'installation et d'utilisation

Ce document vous donne les éléments essentiels pour configurer et exécuter le bot fourni dans ce dépôt. Il est conçu pour aller à l'essentiel et rester facilement adaptable.

## Sommaire

- Présentation
- Arborescence principale
- Installer et démarrer
- Configuration minimale
- Structure des commandes
- Variables d'environnement

## Présentation

Abot est une base pour développer un bot Discord moderne. Elle fournit :

- Un gestionnaire de commandes (slash + interaction)
- Un système d'événements modulaires
- Des utilitaires courants (logger, helpers, formatters)
- Une intégration simple à une base de données

Le dépôt sert de squelette : adaptez les modules et les options à vos besoins.

## Arborescence principale

Extrait simplifié :

```
src/
├─ Bot/
│  ├─ events/
│  ├─ managers/
│  │  ├─ handlers/
│  │  ├─ structures/
│  │  └─ utils/
│  ├─ services/
│  └─ slashCommands/
└─ Dashboard/
```

Chaque dossier contient des modules autonomes : `services` pour les tâches en background, `slashCommands` pour les commandes publiques, et `managers` pour l'initialisation et la logique commune.

## Installer et démarrer

Prérequis : Node.js (version 18+ recommandée) et un gestionnaire de paquets (npm/yarn).

Installation des dépendances :

```bash
npm install
```

Démarrer en local :

```bash
node main.js
```

Note : si vous utilisez un environnement de développement distinct, définissez `DEV_TOKEN` dans votre `.env`.

## Configuration minimale

- `.env` : variables d'exécution (tokens, mode dev, flags de déploiement)
- `config.json` : paramètres applicatifs (IDs, liens, options système)

Exemple minimal `.env` :

```
TOKEN=VOTRE_TOKEN
DEV_TOKEN=TOKEN_DEV
DEPLOY_SLASH=false
```

Dans `config.json`, renseignez les identifiants et urls nécessaires (dashboard, support, etc.).

## Structure des commandes

Les commandes sont des classes exportées héritant d'un manager partagé. Un exemple de modèle :

```js
class MyCommand extends SlashCommand {
  constructor(handler) {
    super(handler, {
      name: "mon-commande",
      description: "Description courte",
      category: SlashCommand.Categories.General,
      options: [],
      user_permissions: [],
      bot_permissions: [],
    });
  }

  async run(ctx) {
    // logique de la commande
  }
}
```

Les options et permissions suivent le format des API Discord pour les options `type`, `required`, etc.

## Variables et conventions

- `DEV_TOKEN` / `TOKEN` : tokens bot
- `DEPLOY_SLASH` : `true` pour déployer les slash commands automatiquement
- `dev_mode` (config) : indique si le bot tourne en environnement de dev

Les paramètres sensibles doivent rester hors du dépôt (via `.env` ou secrets CI).

## Lancer les tests manuels

1. Installer les dépendances : `npm install`
2. Démarrer le bot : `node main.js`
3. Sur votre serveur de test, exécuter les commandes `info-bot`, `info-server`, etc., et vérifier les logs.

## Personnalisation rapide

- Personnalisez les émojis et les messages dans `src/Bot/managers/`.
- Ajoutez de nouvelles commandes sous `src/Bot/slashCommands/`.
- Les tâches récurrentes vont dans `src/Bot/services/Cron/`.

---