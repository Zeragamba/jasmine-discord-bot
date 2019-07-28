const Discord = require('discord.js');
const {tap} = require('rxjs/operators');

describe('ow-info: !config ow-info addRegion', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'ow-info',
      actionName: 'addRegion',
    });

    this.message = this.test$.message;
  });

  describe('!config ow-info addRegion', function () {
    it('responds with an error message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          status: 400,
          content: `I'm sorry, but I'm missing some information for that command:`,
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('does not run the action', function (done) {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      this.test$.pipe(
        tap(() => expect(action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config ow-info addRegion {region}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
    });

    it('responds with an error message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          status: 400,
          content: `I'm sorry, but I'm missing some information for that command:`,
        })),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('does not run the action', function (done) {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      this.test$.pipe(
        tap(() => expect(action.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!config ow-info addRegion {region} {role}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
      this.test$.args.role = 'testRole';
    });

    context('when the role exists', function () {
      beforeEach(function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);
      });

      it('remaps the region', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 200,
            content: `Mapped the region test to testRole`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the role does not exist', function () {
      it('responds with an error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `The role 'testRole' could not be found`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
