const Rx = require('rx');

const {MockMessage} = require('../mocks/discord-mocks');

describe('Feature: !region', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();

    this.message = new MockMessage();

    let jasmineInitalized = false;
    const initJasmine = () => {
      if (jasmineInitalized) return Rx.Observable.of('');
      jasmineInitalized = true;

      let pluginService = this.jasmine.getService('core', 'PluginService');
      let commandService = this.jasmine.getService('core', 'CommandService');

      commandService.handleCmdError = (error) => Rx.Observable.throw(error);

      return Rx.Observable.of('')
        .flatMap(() => this.jasmine.onJoinGuild(this.message.guild))
        .flatMap(() => pluginService.enablePlugin(this.message.guild.id, 'ow-info'));
    };

    this.listen = (done, tests) => {
      this.jasmine
        .listen(() => {}, (error) => done(error))
        .flatMap(() => initJasmine())
        .flatMap(() => tests)
        .subscribe(() => done(), (error) => done(error));
    };
  });

  afterEach(function (done) {
    if (this.jasmine.listening) {
      this.jasmine.shutdown(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the region arg is missing', function () {
    beforeEach(function () {
      this.message.content = `!region`;
    });

    it('responds with an error message', function (done) {
      this.listen(done, Rx.Observable.of('')
        .map(() => this.jasmine.discord.emit('message', this.message))
        .flatMap(() => this.jasmine.shutdown())
        .map(() => {
          expect(this.message.channel.send).to.have.been.calledWith(
            `I'm sorry, but I'm missing some information for that command:`,
          );
        }));
    });
  });

  context('when the region is mapped to a role', function () {
    beforeEach(function (done) {
      this.message.content = `!region test`;

      this.role = {
        id: 'role-0001',
      };

      this.message.guild.roles.set(this.role.id, this.role);

      this.listen(done, Rx.Observable.of('')
        .flatMap(() => {
          let regionService = this.jasmine.getService('ow-info', 'RegionService');
          return regionService.mapRegion(this.message.guild, 'test', this.role);
        }));
    });

    it('adds the role to the user', function (done) {
      this.listen(done, Rx.Observable.of('')
        .map(() => this.jasmine.discord.emit('message', this.message))
        .flatMap(() => this.jasmine.shutdown())
        .map(() => {
          expect(this.message.reply).to.have.been.calledWith(
            'I\'ve updated your region to test',
          );
          expect(this.message.member.addRole).to.have.been.calledWith(
            this.role,
          );
        }));
    });
  });

  context('when the region is not mapped to a role', function () {
    beforeEach(function () {
      this.message.content = `!region test`;
    });

    it('returns an error message', function (done) {
      this.listen(done, Rx.Observable.of('')
        .map(() => this.jasmine.discord.emit('message', this.message))
        .flatMap(() => this.jasmine.shutdown())
        .map(() => {
          expect(this.message.channel.send).to.have.been.calledWith(
            'I\'m sorry, but \'test\' is not an available region.',
          );
          expect(this.message.member.addRole).not.to.have.been.called;
        }));
    });
  });
});
