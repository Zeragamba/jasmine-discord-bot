function memberNameMatches(member, regex) {
  const names = [
    member.user.username,
    member.nickname,
  ];

  return names
    .filter((name) => name)
    .some((name) => name.match(regex));
}

const AUTO_BAN_RULES = {
  BAN_DISCORD_INVITE: {
    name: 'banDiscordInvites',
    test: (member) => memberNameMatches(member, /discord\.gg[/\\]/i),
    reason: "Username contains or was changed to a Discord invite",
  },
  BAN_TWITCH_LINK: {
    name: 'banTwitchLink',
    test: (member) => memberNameMatches(member, /twitch\.tv[/\\]/i),
    reason: "Username contains or was changed to a Twitch link",
  },
};

module.exports = AUTO_BAN_RULES;
