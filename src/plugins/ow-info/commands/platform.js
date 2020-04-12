const platforms = require('../data/platforms');

module.exports = {
  name: 'platform',
  description: 'Sets the platform that you most often play Overwatch on.',

  args: [
    {
      name: 'platform',
      description: 'The platform server you most often play on',
      required: true,
    },
  ],

  async run(context, response) {
    if (context.channel.type !== 'text') {
      response.type = 'reply';
      response.content = 'You can only change your platform from a server.';
      return response.send();
    }

    let foundPlatform = findPlatformWithName(context.args.platform);
    if (!foundPlatform) {
      return response.send({
        content: `I'm sorry, but '${context.args.platform}' is not an available platform.`,
      });
    }

    try {
      let member;
      if (!context.member) {
        member = await context.guild.fetchMember(context.author);
      } else {
        member = context.member;
      }

      await setPlatformTag(member, foundPlatform);
      return response.send({
        content: `I've updated your platform to ${foundPlatform.name}`,
      });
    } catch (error) {
      if (error.message === 'Missing Permissions' || error.message === 'Privilege is too low...') {
        return response.send({
          content:
            `Whoops, I do not have permission to update your username. Ether ` +
            `I'm missing the "Manage Nicknames", or your permissions outrank mine.`,
        });
      } else if (error.message.includes('Invalid Form Body')) {
        return response.send({
          content:
            `I'm sorry, but I can't append the platform tag to your name as it ` +
            `would exceed discord's character limit for nicknames.`,
        });
      }

      throw error;
    }
  },
};

function findPlatformWithName(name) {
  return platforms.find((platform) => platformHasName(platform, name));
}

function platformHasName(platform, name) {
  let platformNames = platform.alias.map((alias) => alias.toLowerCase());
  platformNames.push(platform.name.toLowerCase());

  return platformNames.indexOf(name.toLowerCase()) !== -1;
}

async function setPlatformTag(member, newPlatform) {
  let currentNickname = member.nickname ? member.nickname : member.user.username;
  let newNickname;

  let platformTag = '[' + newPlatform.tag + ']';

  if (currentNickname.search(/\[\w+]$/) !== -1) {
    newNickname = currentNickname.replace(/\[\w+]$/, platformTag);
  } else {
    newNickname = currentNickname + ' ' + platformTag;
  }

  await member.setNickname(newNickname);
}
