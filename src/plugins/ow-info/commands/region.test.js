const {of, throwError} = require('rxjs');
const {flatMap, tap} = require('rxjs/operators');
const {MockMessage} = require('chaos-core').test.discordMocks;

describe('Feature: !region', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();

    this.message = new MockMessage({
      client: this.jasmine.discord,
    });

    this.jasmine.listen().pipe(
      flatMap(() => {
        let pluginService = this.jasmine.getService('core', 'PluginService');
        let commandService = this.jasmine.getService('core', 'CommandService');

        commandService.handleCmdError = (error) => throwError(error);

        return of('').pipe(
          flatMap(() => this.jasmine.emit("guildCreate", this.message.guild)),
          flatMap(() => pluginService.enablePlugin(this.message.guild.id, 'ow-info')),
        );
      }),
    ).subscribe(() => done(), (error) => done(error));
  });

  afterEach(function (done) {
    if (this.jasmine.listening) {
      this.jasmine.shutdown().subscribe(() => done(), (error) => done(error));
    } else {
      done();
    }
  });

  context('when the region arg is missing', function () {
    beforeEach(function () {
      this.message.content = `!region`;
    });

    it('responds with an error message', function (done) {
      sinon.spy(this.message.channel, "send");
      this.jasmine.testCmdMessage(this.message).pipe(
        tap(() => expect(this.message.channel.send).to.have.been.calledWith(
          `I'm sorry, but I'm missing some information for that command:`,
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is mapped to a role', function () {
    beforeEach(function (done) {
      this.message.content = `!region test`;

      this.role = {
        id: 'role-0001',
      };
      this.message.guild.roles.set(this.role.id, this.role);

      let regionService = this.jasmine.getService('ow-info', 'RegionService');
      regionService.mapRegion(this.message.guild, 'test', this.role)
        .subscribe(() => done(), (error) => done(error));
    });

    it('adds the role to the user', function (done) {
      sinon.spy(this.message, "reply");
      sinon.spy(this.message.member, "addRole");

      this.jasmine.testCmdMessage(this.message).pipe(
        tap(() => expect(this.message.reply).to.have.been.calledWith(
          'I\'ve updated your region to test',
        )),
        tap(() => expect(this.message.member.addRole).to.have.been.calledWith(
          this.role,
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the region is not mapped to a role', function () {
    beforeEach(function () {
      this.message.content = `!region test`;
    });

    it('returns an error message', function (done) {
      sinon.spy(this.message.channel, "send");
      sinon.spy(this.message.member, "addRole");

      this.jasmine.testCmdMessage(this.message).pipe(
        tap(() => expect(this.message.channel.send).to.have.been.calledWith(
          'I\'m sorry, but \'test\' is not an available region.',
        )),
        tap(() => expect(this.message.member.addRole).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});
