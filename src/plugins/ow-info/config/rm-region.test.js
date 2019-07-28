const Discord = require('discord.js');
const {tap} = require('rxjs/operators');

describe('ow-info: !config ow-info rmRegion', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'ow-info',
      actionName: 'rmRegion',
    });

    this.message = this.test$.message;
  });

  describe('!config ow-info rmRegion', function () {
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

  describe('!config ow-info rmRegion {region}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
    });

    context('when the region has been mapped', function () {
      beforeEach(function (done) {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        const regionService = this.jasmine.getService('ow-info', 'RegionService');
        regionService.mapRegion(this.message.guild, 'test', this.role)
          .subscribe(() => done(), (error) => done(error));
      });

      it('removes the region', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 200,
            content: `Removed region 'test'`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the region was not mapped', function () {
      it('responds with an error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `Region 'test' was not found`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
