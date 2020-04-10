const {MockMessage} = require("chaos-core").test.discordMocks;

const platforms = require('../data/platforms');

describe('ow-info: !platform', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();
    this.args = {};
    this.test$ = this.jasmine.testCommand({
      pluginName: 'ow-info',
      commandName: 'platform',
      message: this.message,
      args: this.args,
    });

    this.message.reply = (message) => Promise.resolve(message);
    this.author = this.message.author;
    this.author.username = "TestUser";

    this.member = this.message.member;
    this.member.user = this.author;
    this.member.setNickname = (nickname) => {
      this.member.nickname = nickname;
      return Promise.resolve(this.member);
    };

    let pluginService = this.jasmine.getService('core', 'PluginService');

    await this.jasmine.emit("guildCreate", this.message.guild).toPromise();
    await pluginService.enablePlugin(this.message.guild.id, 'ow-info').toPromise();
  });

  describe('!platform', function () {
    it('responds with an error message', async function () {
      sinon.spy(this.message.channel, "send");
      await this.test$.toPromise();
      expect(this.message.channel.send).to.have.been.calledWith(
        `I'm sorry, but I'm missing some information for that command:`,
      );
    });
  });

  describe('!platform {platform}', function () {
    context(`when the platform is not valid`, function () {
      beforeEach(function () {
        this.args.platform = `null`;
      });

      it(`responds with an error message`, async function () {
        sinon.spy(this.message, 'reply');
        await this.test$.toPromise();
        expect(this.message.reply).to.have.been.calledWith(
          `I'm sorry, but 'null' is not an available platform.`,
        );
      });
    });

    platforms.forEach(({name, tag, alias}) => {
      context(`when the platform is "${name}"`, function () {
        beforeEach(function () {
          this.args.platform = name;
        });

        it(`responds with a success message`, async function () {
          sinon.spy(this.message, 'reply');
          await this.test$.toPromise();
          expect(this.message.reply).to.have.been.calledWith(
            `I've updated your platform to ${name}`,
          );
        });

        it(`adds the tag [${tag}] to the user's nickname`, async function () {
          sinon.spy(this.message.member, 'setNickname');
          await this.test$.toPromise();
          expect(this.message.member.setNickname).to.have.been.calledWith(
            `TestUser [${tag}]`,
          );
        });

        alias.forEach((alias) => {
          context(`when the platform is given as ${alias}`, function () {
            beforeEach(function () {
              this.args.platform = alias;
            });

            it(`sets the platform tag to [${tag}]`, async function () {
              sinon.spy(this.message.member, 'setNickname');
              await this.test$.toPromise();
              expect(this.message.member.setNickname).to.have.been.calledWith(
                `TestUser [${tag}]`,
              );
            });
          });
        });
      });
    });

    context('when the user already has a tag', function () {
      beforeEach(function () {
        this.args.platform = `PC`;
        this.message.member.nickname = 'UserNickname [NULL]';
      });

      it(`replaces the tag`, async function () {
        sinon.spy(this.message.member, 'setNickname');
        await this.test$.toPromise();
        expect(this.message.member.setNickname).to.have.been.calledWith(
          `UserNickname [PC]`,
        );
      });
    });

    context('when the user has a nickname', function () {
      beforeEach(function () {
        this.args.platform = `PC`;
        this.message.member.nickname = 'UserNickname';
      });

      it(`updates the user's nickname`, async function () {
        sinon.spy(this.message.member, 'setNickname');
        await this.test$.toPromise();
        expect(this.message.member.setNickname).to.have.been.calledWith(
          `UserNickname [PC]`,
        );
      });
    });

    context('when the user was not cached by Discord.js', function () {
      beforeEach(function () {
        this.args.platform = `PC`;

        this.member = this.message.member;
        this.message.guild.fetchMember = () => Promise.resolve(this.member);
        delete this.message.member;
      });

      it('fetches the member and works normally', async function () {
        sinon.spy(this.member.guild, 'fetchMember');
        sinon.spy(this.message, 'reply');
        sinon.spy(this.member, 'setNickname');

        await this.test$.toPromise();
        expect(this.message.guild.fetchMember)
          .to.have.been.calledWith(this.message.author);
        expect(this.message.reply)
          .to.have.been.calledWith(`I've updated your platform to PC`);
        expect(this.member.setNickname)
          .to.have.been.calledWith(`TestUser [PC]`);
      });
    });
  });
});
