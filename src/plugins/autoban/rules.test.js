const autoBanRules = require('./rules');

describe('Autoban Rule: banDiscordInvites', function () {
  beforeEach(function () {
    this.member = {user: {username: 'exampleUsername'}};
    this.rule = autoBanRules.banDiscordInvites;

    this.invalidNames = [
      'discord.gg/invite',
      'discord.gg\\invite',
      'DISCORD.GG/INVITE',
      'Visit discord.gg/invite',
    ];
  });

  it('returns false if the username is valid', function () {
    expect(this.rule.test(this.member)).to.be.false;
  });

  it('returns true if the username is invalid', function () {
    this.invalidNames.forEach((username) => {
      this.member.user.username = username;
      expect(this.rule.test(this.member)).to.be.true;
    });
  });

  context('when the member has a nickname', function () {
    beforeEach(function () {
      this.member.nickname = 'exampleNickname';
    });

    it('returns false if the nickname is valid', function () {
      expect(this.rule.test(this.member)).to.be.false;
    });

    it('returns true if the nickname is invalid', function () {
      this.invalidNames.forEach((nickname) => {
        this.member.nickname = nickname;
        expect(this.rule.test(this.member)).to.be.true;
      });
    });
  });
});

describe('Autoban Rule: banTwitchLink', function () {
  beforeEach(function () {
    this.member = {user: {username: 'exampleUsername'}};
    this.rule = autoBanRules.banTwitchLink;

    this.invalidNames = [
      'twitch.tv/channel',
      'twitch.tv\\channel',
      'TWITCH.TV/CHANNEL',
      'Visit twitch.tv/channel',
    ];
  });

  it('returns false if the username is valid', function () {
    expect(this.rule.test(this.member)).to.be.false;
  });

  it('returns true if the username is invalid', function () {
    this.invalidNames.forEach((username) => {
      this.member.user.username = username;
      expect(this.rule.test(this.member)).to.be.true;
    });
  });

  context('when the member has a nickname', function () {
    beforeEach(function () {
      this.member.nickname = 'exampleNickname';
    });

    it('returns false if the nickname is valid', function () {
      expect(this.rule.test(this.member)).to.be.false;
    });

    it('returns true if the nickname is invalid', function () {
      this.invalidNames.forEach((nickname) => {
        this.member.nickname = nickname;
        expect(this.rule.test(this.member)).to.be.true;
      });
    });
  });
});
