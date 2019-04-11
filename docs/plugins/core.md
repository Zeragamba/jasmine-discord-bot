# Core
The core plugin contains core Jasmine commands.

*This is the core plugin, and can not be disabled*

- Permission Levels:
    - Admin
        - grants access to `!config`

- Commands:
    - [config](#config)
    - [help](#help)
    
- Config Actions:
    - [setPrefix](#setprefix)
        - Sets the command prefix for the server
    - **Commands**
        - [cmdEnabled?](#cmdenabled)
            - Checks if a command is enabled
        - [disableCmd](#disablecmd)
            - Disables a command
        - [enableCmd](#enablecmd)
            - Enables a command
        - [listCmds](#listcmds)
            - Lists all commands
    - **Permissions**
        - [grantRole](#grantrole)
            - Grants a permission to a role
        - [grantUser](#grantuser)
            - Grants a permission to an user
        - [listPerms](#listperms)
            - Lists all configured permissions
        - [revokeRole](#revokerole)
            - Revokes a permission from a role
        - [revokeUser](#revokeuser)
            - Revokes a permission from an user
    - **Plugins**
        - [disablePlugin](#disableplugin)
            - Disables a plugin
        - [enablePlugin](#enableplugin)
            - Enables a plugin

## Commands

This plugin has no commands

### config
```
!config --list
```
Displays a overview list of available config actions

* *Requires permission: Admin*

```
!config {plugin} --list
```
Displays a detailed list of available config actions for a plugin

* *Requires permission: Admin*
* `plugin`: The name of the plugin to get config actions for

```
!config {plugin} {action} [inputs...]
```
Run a config action for this server. See the documentation of other plugins for available config actions.
Core Config Actions are listed below

* *Requires permission: Admin*
* `plugin`: The name of the plugin that the config action belongs to
* `action`: The name of the action to run

### help
```
!help
```
Displays all available commands from all plugins that the user can use.

## Config Actions

### cmdEnabled?
```
!config core cmdEnabled? {command}
```
Checks if a command is enabled. If a command is disabled, displays the reason why.

* `command`: The name of the command to check

### disableCmd
```
!config core disableCmd {command}
```
Explicitly disables a command.

**Note:** Commands that belong to a disabled plugin are 
disabled by default.

* `command`: The name of the command to disable

### disablePlugin
```
!config core disablePlugin {plugin}
```
Disables a plugin.

* `plugin`: The name of the command to disable

### enableCmd
```
!config core enableCmd {command}
```
Explicitly enable a command.

**Note:** If the command belongs to a plugin that is currently disabled, the command will remain disabled. 

* `command`: The name of the command to disable

### enablePlugin
```
!config core enablePlugin {plugin}
```
Enable a plugin.

* `plugin`: The name of the command to disable

### grantRole
```
!config core grantRole {role} {level}
```
Grants a permission level to a Discord role

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.
- `level`: The permission level to grant to the role. Check a plugin's 
  documentation for available levels.

### grantUser
```
!config core grantUser {user} {level}
```
Grants a permission level to a user

- `user`: The user to grant a permission to. Can be a mention, tag, or ID of a 
  user.
- `level`: The permission level to grant to the user. Check a plugin's 
  documentation for available levels.

### listPerms
```
!config core listPerms
```
List all currently configured permissions levels and which roles and users are assigned to them.

### listCmds
```
!config core listCmds
```
List all commands available, and what module they belong to.

### revokeRole
```
!config core revokeRole {role} {level}
```
Revokes a permission level from a Discord role

- `role`: The role to revoke a permission from. Can be a mention or the name of a role.
- `level`: The permission level to revoke from the role. Check a plugin's documentation for available levels.

### revokeUser
```
!config core revokeUser {user} {level}
```
Revokes a permission level from a user

- `user`: The user to revoke a permission from. Can be a mention, tag, or ID of a user.
- `level`: The permission level to revoke from the user. Check a plugin's documentation for available levels.

### setPrefix
```
!config core setPrefix {newPrefix}
```
Changes the prefix for the bot on the server

* `newPrefix`: The new prefix to use. Must be 1 or more characters.
