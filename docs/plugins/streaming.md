# Streaming
Allows for adding a role to a user when they go live on twitch.

**Note: This module is disabled by default. Use `!config module enable streaming` to enable it.**
 
- [Usage](#usage)
- [Config Actions](#config-actions):
    - [viewSettings](#viewSettings)
    - [setLiveRole](#setLiveRole)
    - [removeLiveRole](#removeLiveRole)
    - [setStreamerRole](#setStreamerRole)
    - [removeStreamerRole](#removeStreamerRole)

## Usage

To set or change the role given to users use the following command:
```
!config streaming setLiveRole {role}
```

By default, Jasmine will add the live role to any user who goes live. To change this, you use the following command to 
restrict it to a user with a special Streamer role. The same command can be also be used to change the role.
```
!config streaming setStreamerRole {role}
```

If you no longer want to restrict who gets the live role:
```
!config streaming removeStreamerRole
```

## Config Actions

### viewSettings
```
!config streaming viewSettings
```
View the current settings for the streaming module.

### setLiveRole
```
!config streaming setLiveRole {role}
```
Sets the role to assign when a user starts streaming. Will also be automagically removed when they go offline

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.

### removeLiveRole
```
!config streaming removeLiveRole
```
Stops Jasmine from adding a role to users when they start streaming.

### setStreamerRole
```
!config streaming setStreamerRole {role}
```
Sets a role to limit who can receive the live role

- `role`: The role to grant a permission to. Can be a mention or the name of a 
  role.

### removeStreamerRole
```
!config streaming removeStreamerRole
```
Removes the limit on who can receive the live role
