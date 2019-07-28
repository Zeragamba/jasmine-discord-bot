const Discord = require('discord.js');
const {of} = require('rxjs');
const {tap, flatMap} = require('rxjs/operators');

describe('ow-info: !config ow-info rmRegionAlias', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'ow-info',
      actionName: 'rmRegionAlias',
    });

    this.message = this.test$.message;
  });

  describe('!config ow-info rmRegionAlias', function () {
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

  describe('!config ow-info rmRegionAlias {alias}', function () {
    beforeEach(function () {
      this.test$.args.alias = 'test2';
    });

    context('when the alias has been mapped', function () {
      beforeEach(function (done) {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        const regionService = this.jasmine.getService('ow-info', 'RegionService');
        of('').pipe(
          flatMap(() => regionService.mapRegion(this.message.guild, 'test', this.role)),
          flatMap(() => regionService.mapAlias(this.message.guild, 'test2', 'test')),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('removes the alias', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 200,
            content: `Removed region alias 'test2'`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the alias was not mapped', function () {
      it('responds with an error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `Alias 'test2' was not found`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
