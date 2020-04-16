const {Collection, SnowflakeUtil} = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('modTools: !unban', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();
    this.message.author.username = 'modUser';
    this.message.author.discriminator = '0001';

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'modTools');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'mod', this.message.author);
  });

  describe("Permissions", function () {
    beforeEach(async function () {
      // Clear active permission levels for the user
      await this.jasmine.getService('core', 'PermissionsService')
        .removeUser(this.message.guild, 'mod', this.message.author)
        .catch(() => ''); //ignore errors
      await this.jasmine.getService('core', 'PermissionsService')
        .removeUser(this.message.guild, 'admin', this.message.author)
        .catch(() => '');
      this.message.content = '!unban';
    });

    it('can not be run by normal users', async function () {
      const responses = await this.jasmine.testMessage(this.message);
      expect(responses.length).to.eq(0);
    });

    it('can be run by mod users', async function () {
      await this.jasmine.getService('core', 'PermissionsService')
        .addUser(this.message.guild, 'mod', this.message.author)
        .catch(() => '');

      const responses = await this.jasmine.testMessage(this.message);
      expect(responses.length).to.eq(1);
    });

    it('can be run by admin users', async function () {
      await this.jasmine.getService('core', 'PermissionsService')
        .addUser(this.message.guild, 'admin', this.message.author)
        .catch(() => '');

      const responses = await this.jasmine.testMessage(this.message);
      expect(responses.length).to.eq(1);
    });
  });

  describe('!unban', function () {
    beforeEach(function () {
      this.message.content = '!unban';
    });

    it('responds with an error message', async function () {
      sinon.spy(this.message.channel, "send");
      const responses = await this.jasmine.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });
  });

  describe('!unban {user}', function () {
    beforeEach(function () {
      this.bannedUser = {
        id: SnowflakeUtil.generate(),
        tag: 'bannedUser#0001',
      };
      this.message.content = `!unban ${this.bannedUser.id}`;
    });

    context('when the user could not be found', function () {
      it('It gives an error message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `The user '${this.bannedUser.id}' could not be found`,
        });
      });
    });

    context('when the user can be found', function () {
      beforeEach(function () {
        this.jasmine.discord.fetchUser = sinon.fake(async (userString) => {
          if (userString === this.bannedUser.id) {
            return this.bannedUser;
          }
        });

        this.message.guild.fetchBans = sinon.fake.resolves(new Collection([
          [this.bannedUser.id, this.bannedUser],
        ]));
        this.message.guild.unban = sinon.fake.resolves();
      });

      it('It bans the user with a reason', async function () {
        await this.jasmine.testMessage(this.message);
        expect(this.message.guild.unban).to.have.been.calledWith(
          this.bannedUser,
          `Unbanned by ${this.message.author.tag}`,
        );
      });

      it('It gives a success message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `${this.bannedUser.tag} has been unbanned.`,
        });
      });

      context('when the user was not banned', function () {
        beforeEach(function () {
          this.message.guild.fetchBans = sinon.fake.resolves(new Collection([]));
        });

        it('It gives an error message', async function () {
          const responses = await this.jasmine.testMessage(this.message);
          expect(responses[0]).to.containSubset({
            content: `${this.bannedUser.tag} is not banned.`,
          });
        });
      });
    });
  });
});
