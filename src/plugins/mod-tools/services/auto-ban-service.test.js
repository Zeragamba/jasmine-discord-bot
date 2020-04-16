const {AUTO_BAN_RULES} = require("../utility");
describe('AutoBanService', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine({logger: {level: 'debug'}});
    this.autoBanService = this.jasmine.getService('modTools', 'AutoBanService');
    this.pluginService = this.jasmine.getService('core', 'pluginService');

    this.guild = {
      id: 'guildId',
      ban: async () => {},
    };

    await this.pluginService.enablePlugin(this.guild.id, 'modTools');
  });

  describe("#doAutoBans", function () {
    beforeEach(async function () {
      this.member = {
        guild: this.guild,
        user: {
          tag: 'user#0001',
          username: 'MrDog',
        },
      };

      await this.autoBanService.setAutoBansEnabled(this.guild, true);
      await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_DISCORD_INVITE, true);
      await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_TWITCH_LINK, true);
    });

    context("when the user's name is fine", function () {
      it("does not ban the user", async function () {
        sinon.spy(this.guild, 'ban');

        await this.autoBanService.doAutoBans(this.member);
        expect(this.guild.ban).not.to.have.been.called;
      });
    });

    context('when the user has a twitch link in their name', function () {
      beforeEach(function () {
        this.member.user.username = 'twitch.tv/DrEvil';
      });

      it("bans the user", async function () {
        sinon.spy(this.guild, 'ban');

        await this.autoBanService.doAutoBans(this.member);
        expect(this.guild.ban).to.have.been.calledWith(this.member);
      });

      context("when the plugin is disabled", function () {
        beforeEach(async function () {
          await this.pluginService.disablePlugin(this.guild.id, 'modTools');
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when autobanning is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBansEnabled(this.guild, false);
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when twitch link rule is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_TWITCH_LINK, false);
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });
    });

    context('when the user has a discord link in their name', function () {
      beforeEach(function () {
        this.member.user.username = 'discord.gg/invited';
      });

      it("bans the user", async function () {
        sinon.spy(this.guild, 'ban');

        await this.autoBanService.doAutoBans(this.member);
        expect(this.guild.ban).to.have.been.calledWith(this.member);
      });

      context("when the plugin is disabled", function () {
        beforeEach(async function () {
          await this.pluginService.disablePlugin(this.guild.id, 'modTools');
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when autobanning is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBansEnabled(this.guild, false);
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when discord link rule is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_DISCORD_INVITE, false);
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });
    });
  });

  describe('#memberNameMatches', function () {
    beforeEach(function () {
      this.member = {
        user: {username: 'exampleUsername'},
      };
    });

    it('returns true if the username matches', function () {
      expect(this.autoBanService.memberNameMatches(this.member, /Username/))
        .to.be.true;
    });

    it('returns false if the username does not match', function () {
      expect(this.autoBanService.memberNameMatches(this.member, /foobar/))
        .to.be.false;
    });

    context('when the member has a nickname', function () {
      beforeEach(function () {
        this.member.nickname = 'exampleNickname';
      });

      it('returns true if the nickname matches', function () {
        expect(this.autoBanService.memberNameMatches(this.member, /Nickname/))
          .to.be.true;
      });

      it('returns false if the nickname does not match', function () {
        expect(this.autoBanService.memberNameMatches(this.member, /foobar/))
          .to.be.false;
      });
    });
  });
});
