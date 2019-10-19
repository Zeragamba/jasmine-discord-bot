const {of, from, throwError, iif} = require('rxjs');
const {flatMap, map, catchError} = require('rxjs/operators');

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

  run(context, response) {
    if (context.channel.type !== 'text') {
      response.type = 'reply';
      response.content = 'You can only change your platform from a server.';
      return response.send();
    }

    let foundPlatform = findPlatformWithName(context.args.platform);
    if (!foundPlatform) {
      response.type = 'reply';
      response.content = 'I\'m sorry, but \'' + context.args.platform + '\' is not an available platform.';
      return response.send();
    }

    return iif(
      () => context.member,
      of(context.member),
      of('').pipe(
        flatMap(() => context.guild.fetchMember(context.author)),
      ),
    ).pipe(
      flatMap((member) => setPlatformTag(member, foundPlatform)),
      map((platform) => {
        response.type = 'reply';
        response.content = 'I\'ve updated your platform to ' + platform.name;
        return response.send();
      }),
      catchError((error) => {
        if (error.name === 'DiscordAPIError') {
          response.type = 'message';

          if (error.message === 'Missing Permissions' || error.message === 'Privilege is too low...') {
            response.content =
              `Whoops, I do not have permission to update your username. Ether I'm missing the "Manage Nicknames", ` +
              `or your permissions outrank mine.`;
            return response.send();
          } else if (error.message.includes('Invalid Form Body')) {
            return response.send({
              content: 'I\'m sorry, but I can\'t append the platform tag to your name as it would exceed discord\'s ' +
                'character limit for nicknames.',
            });
          }

          response.content = `Err... Discord returned an unexpected error when I tried to update your nickname.`;
          this.chaos.messageOwner(
            `I got this error when I tried to update ${context.author.tag}'s platform:`,
            {
              embed: this.chaos.createEmbedForError(error, [
                {name: 'guild', inline: true, value: context.guild.name},
                {name: 'channel', inline: true, value: context.channel.name},
                {name: 'command', inline: true, value: 'platform'},
                {name: 'user', inline: true, value: context.author.tag},
              ]),
            },
          );

          return response.send();
        }

        return throwError(error);
      }),
    );
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

function setPlatformTag(member, newPlatform) {
  let currentNickname = member.nickname ? member.nickname : member.user.username;
  let newNickname;

  let platformTag = '[' + newPlatform.tag + ']';

  if (currentNickname.search(/\[\w+]$/) !== -1) {
    newNickname = currentNickname.replace(/\[\w+]$/, platformTag);
  } else {
    newNickname = currentNickname + ' ' + platformTag;
  }

  return from(member.setNickname(newNickname)).pipe(
    map(() => newPlatform),
  );
}
