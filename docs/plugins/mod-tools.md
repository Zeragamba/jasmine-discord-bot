# Mod Tools
Provides commands to assist with server moderation.

*Note: This module is disabled by default. Use `!config core enablePlugin modtools` to enable this module*

- Permission Levels:
    - Mod
        - Grants access to `!ban`, `!unban`, `!warn`

- [AutoBan](#autoban):
    - [Rules](#rules)
    
- Commands:
    - [!ban](#ban)
    - [!unban](#unban)
    - [!warn](#warn)
    
- Config Actions:
    - [disableAutoBan](#disableautoban)
    - [disableLog](#disablelog)
    - [enableAutoBan](#enableautoban)
    - [enableLog](#enablelog)
    - [listAutoBanRules](#listautobanrules)
    - [setAutoBanRule](#setautobanrule)

## Autoban

This module provides support for auto banning of undesirable users, such as users with a discord invite as their name.
By default, autobanning is enabled, but **no rules are enabled**. 

To configure the rules around which users are autobanned:
```text
!config modTools setAutoBanRule {rule} {enabled}
```

To view which rules are enabled, use:
```text
!config modTools listAutoBanRules
```

To disable autobanning users all together:
```text
!config modtools disableAutoBan
```

### Rules

The following rules are available:

* `banDiscordInvites`: 
    * Auto ban the user if there is a Discord invite in the user's name.
    * enabled by default
* `banTwitchLinks`: 
    * Auto ban the user if there is a Twitch link in the user's name.
    * enabled by default

## Commands

### ban
```text
!ban {user}
```
Bans a user from the server

* *Requires permission: Mod*
* `user`: The name of the user to ban. Can be a user id, mention, or tag.

```text
!ban {user} {reason}
```
Bans a user from the server with a reason

* *Requires permission: Mod*
* `user`: The name of the user to ban. Can be a user id, mention, or tag.
* `reason`: The reason for the ban

### unban
```text
!unban {user}
```
Unbans a user from the server.

* *Requires permission: Mod*
* `user`: The name of the user to unban. Can be a user id, mention, or tag.

### warn
```text
!warn {user}
```
Issue a warning to a user.

* *Requires permission: Mod*
* `user`: The name of the user to warn. Can be a user id, mention, or tag.

```text
!warn {user} {reason}
```
Issue a warning to a user with a message.

* *Requires permission: Mod*
* `user`: The name of the user to warn. Can be a user id, mention, or tag.
* `reason`: The reason for the warning

## Config actions

### disableAutoBan
```text
!config modtools disableAutoBan
```
Disables the auto banning of users

### disableLog
```text
!config modtools disableLog modlog
```
Disables the moderation log

```text
!config modtools disableLog joinlog
```
Disables the join log

### enableAutoBan
```text
!config modtools enableAutoBan
```
Enables the auto banning of users

### enableLog
```text
!config modtools enableLog modlog {channel}
```
Enables the moderation log, which reports bans, warnings, and unbans to the given channel

* `channel`: The name of the channel to send messages to. Can be by name or mention.

```text
!config modtools enableLog joinlog {channel}
```
Enables the join log, which reports user joins and leaves to the given channel

* `channel`: The name of the channel to send messages to. Can be by name or mention.

### listAutoBanRules
```text
!config modtools listAutoBanRules
```
Lists the currently configured rules for auto banning users.

### setAutoBanRule
```text
!config modtools setAutoBanRule {rule} {enabled}
```
Lists the currently configured rules for auto banning users.

* `rule`: The name of the rule to enable or disable
* `enabled`: "true" or "false" to enable or disable the rule

See [AutoBan rules](#rules) for a list of available rules.
