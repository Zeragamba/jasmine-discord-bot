const Discord = require('discord.js');

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

  describe('!config ow-info rmRegion {region}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
    });

    context('when the region has been mapped', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        await this.jasmine.getService('ow-info', 'RegionService')
          .mapRegion(this.message.guild, 'test', this.role).toPromise();
      });

      it('removes the region', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 200,
          content: `Removed region 'test'`,
        });
      });
    });

    context('when the region was not mapped', function () {
      it('responds with an error', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 400,
          content: `Region 'test' was not found`,
        });
      });
    });
  });
});
