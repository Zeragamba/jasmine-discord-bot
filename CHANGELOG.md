# 5.0.1  
**Bug fixes**
- restore data directory location


# v5.0.0
**Bug Fixes**
- Fix !region and !platform on servers with more then 250 members

**Minor Features:**
- update nix-core
- adding additional test coverage

# v4.0.0
**Major Features:**
- Add Streaming module
    - use `!config module enable streaming` to enable
    - `!config streaming setLiveRole {role}` to set a role to assign to users that go live
    - `!config streaming setStreamerRole {role}` to restrict the live role to approved users

**Minor Features:**
- update nix-core to latest version



# v3.5.1
**Minor Features:**
- esports is now a new broadcast type



# v3.5.0
**Minor Features:**
- Don't report auto bans to the OWMN mod log



# v3.4.1
**Minor Features:**
- Auto ban users with Twitch links in their names
    - via the modTools module



# v3.4.0
**Major Features:**
- Allow for auto ban users with Discord invites in their names
    - via the modTools module



# v3.3.0
**Major Features:**
- Allow for configuring regions in ow-info module
- DOCUMENTATION?!?! Wow!



# v3.2.0
**Major Features:**
- Add confirmations to broadcasts



# v3.1.0
**Major Features:**
- migrate !region and !platform commands from Nix to Jasmine



# v3.0.0
**Major Features:**
- Switch to using yarn for development
- Update nix-core to a newer version



# v2.0.8
**Minor Features:**
- Add april fools thing for Sombra Mains
- Update messages for ban and unban in the mod log

**Bugfixes:**
- fix typo in !ban



# v2.0.1
**Bugfixes:**
- modTools ModLog
    - Gracefully handle when unable to read bans
    - Gracefully handle when unable to read audit logs



# v2.0.0
**Major Features:**
- Created Network ModLog
    - Bans and unbans on a hero server will be reported to the Network ModLog
- Added JoinLog
    - User join/leave can are added to the JoinLog
    - enable with: `!config modTools enableLog JoinLog <channel>`

**Minor Features:**
- Bans and Unbans made via Discord are reported in the ModLog
- `!topic` changes
    - spaces are now allowed in the channel name
    - The first message in a topic channel is automatically pinned
- A user can now be found by ID, Mention, or Tag for `!ban`, `!unban`, and `!warn` 

**Config actions changes:**
- `modTools enableModLog <channel>` changed to `modTools enableLog <type> <channel>`
    - JoinLog and ModLog can now be enabled separately
- `modTools disableModLog` changed to `modTools disableLog <type>`
    - JoinLog and ModLog can now be disabled separately
