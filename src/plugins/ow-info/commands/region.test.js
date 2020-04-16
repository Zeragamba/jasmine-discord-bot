const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('ow-info: !region', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    await this.jasmine.listen();
    await this.jasmine.emit("guildCreate", this.message.guild);
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'ow-info');
  });

  describe('!region', function () {
    beforeEach(function () {
      this.message.content = '!region';
    });

    it('responds with an error message', async function () {
      sinon.spy(this.message.channel, "send");
      await this.jasmine.testMessage(this.message);
      expect(this.message.channel.send).to.have.been.calledWith(
        `I'm sorry, but I'm missing some information for that command:`,
      );
    });
  });

  describe("!region {region}", function () {
    beforeEach(function () {
      this.message.content = '!region test';
    });

    context('when the region is mapped to a role', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        await this.jasmine.getService('ow-info', 'RegionService')
          .mapRegion(this.message.guild, 'test', this.role);
      });

      it('gives a success message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses).to.have.length(1);
        expect(responses[0]).to.containSubset({
          content: 'I\'ve updated your region to test',
        });
      });

      it('adds the role to the user', async function () {
        sinon.spy(this.message.member, "addRole");
        await this.jasmine.testMessage(this.message);
        expect(this.message.member.addRole).to.have.been.calledWith(
          this.role.id,
        );
      });
    });

    context('when the region is not mapped to a role', function () {
      it('returns an error message', async function () {
        sinon.spy(this.message.channel, "send");
        sinon.spy(this.message.member, "addRole");
        await this.jasmine.testMessage(this.message);
        expect(this.message.channel.send).to.have.been.calledWith(
          'I\'m sorry, but \'test\' is not an available region.',
        );
        expect(this.message.member.addRole).not.to.have.been.called;
      });
    });
  });

  describe("!region {regionAlias}", function () {
    beforeEach(function () {
      this.message.content = '!region testAlias';
    });

    context('when the alias is mapped to a region', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        let regionService = this.jasmine.getService('ow-info', 'RegionService');
        await regionService.mapRegion(this.message.guild, 'test', this.role);
        await regionService.mapAlias(this.message.guild, 'testAlias', 'test');
      });

      it('gives a success message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses).to.have.length(1);
        expect(responses[0]).to.containSubset({
          content: 'I\'ve updated your region to test',
        });
      });

      it('adds the role to the user', async function () {
        sinon.spy(this.message.member, "addRole");

        await this.jasmine.testMessage(this.message);
        expect(this.message.member.addRole).to.have.been.calledWith(
          this.role.id,
        );
      });

      context('when the user was not cached by Discord.js', function () {
        beforeEach(function () {
          this.message.content = '!region test';

          this.member = this.message.member;
          this.message.guild.fetchMember = () => Promise.resolve(this.member);
          delete this.message.member;
        });

        it('fetches the member and works normally', async function () {
          sinon.spy(this.member.guild, 'fetchMember');
          sinon.spy(this.message, 'reply');

          const responses = await this.jasmine.testMessage(this.message);
          expect(this.message.guild.fetchMember)
            .to.have.been.calledWith(this.message.author);
          expect(responses).to.have.length(1);
          expect(responses[0]).to.containSubset({
            content: 'I\'ve updated your region to test',
          });
        });
      });
    });
  });
});
