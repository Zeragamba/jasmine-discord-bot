# Jasmine Discord Bot

Jasmine is the bot used by the Overwatch Mains Network (OWMN), to help with network wide tasks.

## Commands
By default, all commands are prefixed with `!`. To avoid conflict with other 
bots, the command prefix can be changed using:
```text
!config core setPrefix {newPrefix}
```

Additionally, commands can also be run by mentioning Jasmine:
```text
@Jasmine {command}
```

You can use the following command to see all the commands that you are able to
run:
```text
!help
```

## plugins
A plugin is a group of features and commands that are related. These extend the functionality of Jasmine beyond the core
feature set. By default, some plugins are disabled when Jasmine and may be enabled on a per server basis.

When a plugin is disabled, all commands and features will be disabled for the server.

To enable a plugin:
```text
!config core enablePlugin {plugin}
```
 
Inversely, plugins can be disabled later by running:
```text
!config core disablePlugin {plugin}
```

### Plugin list
The following plugins are available for Jasmine: *(all except for Core are disabled by default)*

- [Core](https://github.com/chaos-core/chaos-core/blob/v4.0.6/docs/core-plugin.md): 
    - Hosts the core features of Jasmine, including permissions, commands, and plugins
- [Mod Tools](docs/plugins/mod-tools.md): 
    - Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](docs/plugins/ow-info.md):
    - Provides commands to help users find others to play with.
- [OWMN](docs/plugins/ow-mains.md):
    - Provides OWMN specific tools and commands
- [Streaming](docs/plugins/streaming.md):
    - Assign a role to a user when they go live
- [User Roles](https://github.com/chaos-core/chaos-plugin-user-roles/blob/v1.0.2/README.md):
    - Adds support for joinable roles to ChaosCore discord bots
- Auto Roles:
    - Adds support for assigning a role when a user joins
- Topics:
    - Provides command to create Topic Channels
