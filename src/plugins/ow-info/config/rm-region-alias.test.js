const Discord = require('discord.js');

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
    it('responds with an error message', async function () {
      const response = await this.test$.toPromise();
      expect(response).to.containSubset({
        status: 400,
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });

    it('does not run the action', async function () {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      await this.test$.toPromise();
      expect(action.run).not.to.have.been.called;
    });
  });

  describe('!config ow-info rmRegionAlias {alias}', function () {
    beforeEach(function () {
      this.test$.args.alias = 'test2';
    });

    context('when the alias has been mapped', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        const regionService = this.jasmine.getService('ow-info', 'RegionService');
        await regionService.mapRegion(this.message.guild, 'test', this.role).toPromise();
        await regionService.mapAlias(this.message.guild, 'test2', 'test').toPromise();
      });

      it('removes the alias', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 200,
          content: `Removed region alias 'test2'`,
        });
      });
    });

    context('when the alias was not mapped', function () {
      it('responds with an error', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 400,
          content: `Alias 'test2' was not found`,
        });
      });
    });
  });
});
