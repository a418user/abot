ChannelsType
````json
{
  "GUILD_TEXT": 0,
  "DM": 1,
  "GUILD_VOICE": 2,
  "GROUP_DM": 3,
  "GUILD_CATEGORY": 4,
  "GUILD_NEWS": 5,
  "GUILD_NEWS_THREAD": 10,
  "GUILD_PUBLIC_THREAD": 11,
  "GUILD_PRIVATE_THREAD": 12,
  "GUILD_STAGE_VOICE": 13,
  "GUILD_DIRECTORY": 14,
  "GUILD_FORUM": 15
}
````
ApplicationCommandsType
````json
{
  "ChatInput": 1,
  "User": 2,
  "Message": 3
}
````
ApplicationCommandsOptionType
````json
{
  "SUB_COMMAND": 1,
  "SUB_COMMAND_GROUP": 2,
  "STRING": 3,
  "INTEGER": 4,
  "BOOLEAN": 5,
  "USER": 6,
  "CHANNEL": 7,
  "ROLE": 8,
  "MENTIONABLE": 9,
  "NUMBER": 10,
  "ATTACHMENT": 11
}
````
MessageComponentsType
````json
{
  "Action Row": 1,
  "Button": 2,
  "StringSelect": 3,
  "Text Input": 4,
  "UserSelect": 5,
  "RoleSelect": 6,
  "MentionableSelect": 7,
  "ChannelSelect": 8
}
````

ButtonStylesType
````json
{
  "Primary": 1,
  "Secondary": 2,
  "Success": 3,
  "Danger": 4,
  "Link": 5
}
````

ActivitiesType
````json
{
  "Playing": 0,
  "Streaming": 1,
  "Listening": 2,
  "Watching": 3,
  "Custom": 4,
  "Competing": 5
}
````

Regex

DiscordInvite :
````js
/(?:https?:\/\/)?(?:\w+\\.)?discord(?:(?:app)?\.com\/invite|\.gg)\/(?<code>[a-z0-9-]+)(?:\?\S*)?(?:#\S*)?/gmi
````

Url :
````js
/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm
````

Emote
````js
/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug
````

Emote private :
````js
/<?(a:|:)\w*:(\d{17}|\d{18})>/
/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug
````

Color hexadecimal :
````js
/^#[0-9A-F]{6}$/i
````

Image Url :
````js
/^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg|svg)\??.*$/gmi
````

Divers


Couleur Discord :
```hex
#2f3136
```

