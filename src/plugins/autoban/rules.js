function memberNameMatches(member, regex) {
  const names = [
    member.user.username,
    member.nickname,
  ];

  return names
    .filter((name) => name)
    .some((name) => name.match(regex));
}

module.exports = {
  banDiscordInvites: {
    name: 'banDiscordInvites',
    description: 'Auto bans users with a discord invite in their name',
    test: (member) => memberNameMatches(member, /discord\.gg[/\\]/i),
    reason: "Username contains or was changed to a Discord invite",
  },
  banTwitchLink: {
    name: 'banTwitchLink',
    description: 'Auto bans users with a twitch link in their name',
    test: (member) => memberNameMatches(member, /twitch\.tv[/\\]/i),
    reason: "Username contains or was changed to a Twitch link",
  },
};
