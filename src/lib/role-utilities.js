function findRole(guild, roleString) {
  let idRegex = /^\d+$/;
  let mentionRegex = /^<@&?(\d+)>$/;

  if (roleString.match(idRegex)) {
    // string is an role ID
    return guild.roles.get(roleString);
  }

  let matches = roleString.match(mentionRegex);
  if (matches) {
    // string is an role mention
    return guild.roles.get(matches[1]);
  }

  // string is a role name
  return guild.roles.find((r) => r.name.toLowerCase() === roleString.toLowerCase());
}

module.exports = {
  findRole,
};
