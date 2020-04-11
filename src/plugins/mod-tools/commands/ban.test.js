const {Collection} = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;
const {of, throwError} = require('rxjs');
const {UserNotFoundError} = require('chaos-core').errors;

describe('modTools: !ban', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();
    this.message.author.username = 'modUser';
    this.message.author.discriminator = '0001';

    await this.jasmine.listen().toPromise();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'modTools').toPromise();
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'mod', this.message.author).toPromise();
  });

  describe('!ban', function () {
    beforeEach(function () {
      this.message.content = '!ban';
    });

    it('responds with an error message', async function () {
      sinon.spy(this.message.channel, "send");
      const responses = await this.jasmine.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });
  });

  describe('!ban {user}', function () {
    beforeEach(function () {
      this.userToBan = {
        id: 'bannedUserId',
        tag: 'bannedUser#0001',
      };
      this.message.content = '!ban bannedUserId';
    });

    context('when the user could not be found', function () {
      it('It gives an error message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: "The user 'bannedUserId' could not be found",
        });
      });
    });

    context('when the user can be found', function () {
      beforeEach(function () {
        const userService = this.jasmine.getService('core', 'UserService');
        userService.findUser = sinon.fake((userString) => {
          if (userString === this.userToBan.id) {
            return of(this.userToBan);
          } else {
            return throwError(new UserNotFoundError(`The user '${userString}' could not be found`));
          }
        });

        this.message.guild.fetchBans = sinon.fake.resolves(new Collection());
        this.message.guild.ban = sinon.fake.resolves();
      });

      it('It bans the user with a reason', async function () {
        await this.jasmine.testMessage(this.message);
        expect(this.message.guild.ban).to.have.been.calledWith(
          this.userToBan,
          {
            days: 2,
            reason: `\`none given\` | Banned by ${this.message.author.tag}`,
          },
        );
      });

      it('It gives a success message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `${this.userToBan.tag} has been banned`,
        });
      });

      context('when the user was already banned', function () {
        beforeEach(function () {
          this.message.guild.fetchBans = sinon.fake.resolves(new Collection([
            [this.userToBan.id, this.userToBan],
          ]));
        });

        it('It gives an error message', async function () {
          const responses = await this.jasmine.testMessage(this.message);
          expect(responses[0]).to.containSubset({
            content: `${this.userToBan.tag} is already banned.`,
          });
        });
      });
    });
  });

  describe('!ban {user} {reason}', function () {
    beforeEach(function () {
      this.userToBan = {
        id: 'bannedUserId',
        tag: 'bannedUser#0001',
      };
      this.message.content = '!ban bannedUserId the reason given';

      const userService = this.jasmine.getService('core', 'UserService');
      userService.findUser = sinon.fake((userString) => {
        if (userString === this.userToBan.id) {
          return of(this.userToBan);
        } else {
          return throwError(new UserNotFoundError(`The user '${userString}' could not be found`));
        }
      });

      this.message.guild.fetchBans = sinon.fake.resolves(new Collection());
      this.message.guild.ban = sinon.fake.resolves();
    });

    it('It bans the user with the given reason', async function () {
      await this.jasmine.testMessage(this.message);
      expect(this.message.guild.ban).to.have.been.calledWith(
        this.userToBan,
        {
          days: 2,
          reason: `the reason given | Banned by ${this.message.author.tag}`,
        },
      );
    });
  });
});
