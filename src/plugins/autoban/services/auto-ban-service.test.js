const AUTO_BAN_RULES = require("../rules");

describe('AutoBanService', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.autoBanService = this.jasmine.getService('autoban', 'AutoBanService');
    this.pluginService = this.jasmine.getService('core', 'pluginService');

    this.guild = {
      id: 'guildId',
      ban: async () => {},
    };

    await this.pluginService.enablePlugin(this.guild.id, 'autoban');
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

      await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_DISCORD_INVITE.name, true);
      await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_TWITCH_LINK.name, true);
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
          await this.pluginService.disablePlugin(this.guild.id, 'autoban');
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when twitch link rule is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_TWITCH_LINK.name, false);
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
          await this.pluginService.disablePlugin(this.guild.id, 'autoban');
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });

      context("when discord link rule is disabled", function () {
        beforeEach(async function () {
          await this.autoBanService.setAutoBanRule(this.guild, AUTO_BAN_RULES.BAN_DISCORD_INVITE.name, false);
        });

        it("does not ban the user", async function () {
          sinon.spy(this.guild, 'ban');

          await this.autoBanService.doAutoBans(this.member);
          expect(this.guild.ban).not.to.have.been.called;
        });
      });
    });
  });
});
