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

### Command list
- [Core](docs/plugins/core.md)
    - [config](docs/plugins/core.md#config)
        - Run a [config action](#config-actions)
    - [help](docs/plugins/core.md#help)
        - display currently available commands

## plugins
A plugin is a group of features and commands that are related. These extend the functionality of Jasmine beyond the core
feature set. By default, some plugins are disabled when Jasmine and may be enabled on a per server basis.

When a plugin is disabled, all commands and features will be disabled for the server.

To enable a plugin:
```text
!config core enablePlugin {plugin}
```
 
Inversely, plugins can be disabled by running:
```text
!config core disablePlugin {plugin}
```

### Module list
The following plugins are available for Jasmine:

- [Core](docs/plugins/core.md):
    - Hosts the core features of Jasmine, including permissions, commands, and plugins
- [Mod Tools](docs/plugins/mod-tools.md): 
    - Provides moderation commands such as `!ban`, and `!warn`, and `!kick`.
- [Overwatch Info](docs/plugins/ow-info.md):
    - *disabled by default* 
    - Provides commands to help users find others to play with.
- [OWMN](docs/plugins/ow-mains.md):
    - *disabled by default* 
    - Provides OWMN specific tools and commands
- [Streaming](docs/plugins/streaming.md):
    - *disabled by default* 
    - Assign a role to a user when they go live
- [Topics](docs/plugins/topics.md):
    - *disabled by default* 
    - Provides command to create Topic Channels

## Config Actions
Config actions are used to enable, change, or disable features of a module.
These are always run through the [config](docs/plugins/core.md#config) command:
```text
!config {module} {action} [inputs...]
```

### Config Action List
- [Core](docs/plugins/core.md):
    - [setPrefix](docs/plugins/core.md#setprefix)
        - Sets the command prefix for the server
    - **Commands**
        - [cmdEnabled?](docs/plugins/core.md#cmdenabled)
            - Checks if a command is enabled
        - [disableCmd](docs/plugins/core.md#disablecmd)
            - Disables a command
        - [enableCmd](docs/plugins/core.md#enablecmd)
            - Enables a command
        - [listCmds](docs/plugins/core.md#listcmds)
            - Lists all commands
    - **Permissions**
        - [grantRole](docs/plugins/core.md#grantrole)
            - Grants a permission to a role
        - [grantUser](docs/plugins/core.md#grantuser)
            - Grants a permission to an user
        - [listPerms](docs/plugins/core.md#listperms)
            - Lists all configured permissions
        - [revokeRole](docs/plugins/core.md#revokerole)
            - Revokes a permission from a role
        - [revokeUser](docs/plugins/core.md#revokeuser)
            - Revokes a permission from an user
    - **Plugins**
        - [disablePlugin](docs/plugins/core.md#disableplugin)
            - Disables a plugin
        - [enablePlugin](docs/plugins/core.md#enableplugin)
            - Enables a plugin
- [ow-info](docs/plugins/ow-info.md):
    - [addRegion](docs/plugins/ow-info.md#addregion)
        - Adds a region, and maps it to a role.
    - [addRegionAlias](docs/plugins/ow-info.md#addregionalias)
        - Adds an alias to an existing region
    - [rmRegion](docs/plugins/ow-info.md#rmregion)
        - Removes a region.
    - [rmRegionAlias](docs/plugins/ow-info.md#rmregionalias)
        - Removes a region alias.
    - [viewRegions](docs/plugins/ow-info.md#viewregions)
        - Displays a list of all configured regions, and their aliases.
- [Streaming](docs/plugins/streaming.md)
    - [setLiveRole](docs/plugins/streaming.md#setliverole)
        - Set the role to assign when a user goes live
    - [setStreamerRole](docs/plugins/streaming.md#setstreamerrole)
        - Set a role to limit who can receive the live role
    - [removeLiveRole](docs/plugins/streaming.md#removeliverole)
        - Disables assigning a role when a user goes live
    - [removeStreamerRole](docs/plugins/streaming.md#removestreamerrole)
        - Removes the limit on who can receive the live role
    - [viewSettings](docs/plugins/streaming.md#viewsettings)
        - View the current settings for the streaming module
