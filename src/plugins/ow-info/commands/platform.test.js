const {of} = require('rxjs');
const {flatMap, tap} = require('rxjs/operators');
const {MockMessage} = require("chaos-core").test.discordMocks;

const platforms = require('../data/platforms');

describe('ow-info: !platform', function () {
  beforeEach(function (done) {
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

    of('').pipe(
      flatMap(() => this.jasmine.emit("guildCreate", this.message.guild)),
      flatMap(() => pluginService.enablePlugin(this.message.guild.id, 'ow-info')),
    ).subscribe(() => done(), (error) => done(error));
  });

  describe('!platform', function () {
    it('responds with an error message', function (done) {
      sinon.spy(this.message.channel, "send");

      this.test$.pipe(
        tap(() => expect(this.message.channel.send).to.have.been.calledWith(
          `I'm sorry, but I'm missing some information for that command:`,
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!platform {platform}', function () {
    context(`when the platform is not valid`, function () {
      beforeEach(function () {
        this.args.platform = `null`;
      });

      it(`responds with an error message`, function (done) {
        sinon.spy(this.message, 'reply');

        this.test$.pipe(
          tap(() => expect(this.message.reply).to.have.been.calledWith(
            `I'm sorry, but 'null' is not an available platform.`,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    platforms.forEach(({name, tag, alias}) => {
      context(`when the platform is "${name}"`, function () {
        beforeEach(function () {
          this.args.platform = name;
        });

        it(`responds with a success message`, function (done) {
          sinon.spy(this.message, 'reply');

          this.test$.pipe(
            tap(() => expect(this.message.reply).to.have.been.calledWith(
              `I've updated your platform to ${name}`,
            )),
          ).subscribe(() => done(), (error) => done(error));
        });

        it(`adds the tag [${tag}] to the user's nickname`, function (done) {
          sinon.spy(this.message.member, 'setNickname');

          this.test$.pipe(
            tap(() => expect(this.message.member.setNickname).to.have.been.calledWith(
              `TestUser [${tag}]`,
            )),
          ).subscribe(() => done(), (error) => done(error));
        });

        alias.forEach((alias) => {
          context(`when the platform is given as ${alias}`, function () {
            beforeEach(function () {
              this.args.platform = alias;
            });

            it(`sets the platform tag to [${tag}]`, function (done) {
              sinon.spy(this.message.member, 'setNickname');

              this.test$.pipe(
                tap(() => expect(this.message.member.setNickname).to.have.been.calledWith(
                  `TestUser [${tag}]`,
                )),
              ).subscribe(() => done(), (error) => done(error));
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

      it(`replaces the tag`, function (done) {
        sinon.spy(this.message.member, 'setNickname');

        this.test$.pipe(
          tap(() => expect(this.message.member.setNickname).to.have.been.calledWith(
            `UserNickname [PC]`,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user has a nickname', function () {
      beforeEach(function () {
        this.args.platform = `PC`;
        this.message.member.nickname = 'UserNickname';
      });

      it(`updates the user's nickname`, function (done) {
        sinon.spy(this.message.member, 'setNickname');

        this.test$.pipe(
          tap(() => expect(this.message.member.setNickname).to.have.been.calledWith(
            `UserNickname [PC]`,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the user was not cached by Discord.js', function () {
      beforeEach(function () {
        this.args.platform = `PC`;

        this.member = this.message.member;
        this.message.guild.fetchMember = () => Promise.resolve(this.member);
        delete this.message.member;
      });

      it('fetches the member and works normally', function (done) {
        sinon.spy(this.member.guild, 'fetchMember');
        sinon.spy(this.message, 'reply');
        sinon.spy(this.member, 'setNickname');

        this.test$.pipe(
          tap(() => expect(this.message.guild.fetchMember).to.have.been.calledWith(
            this.message.author,
          )),
          tap(() => expect(this.message.reply).to.have.been.calledWith(
            `I've updated your platform to PC`,
          )),
          tap(() => expect(this.member.setNickname).to.have.been.calledWith(
            `TestUser [PC]`,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
