const Discord = require('discord.js');

describe('ow-info: !config ow-info addRegionAlias', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'ow-info',
      actionName: 'addRegionAlias',
    });

    this.message = this.test$.message;
  });

  describe('!config ow-info addRegionAlias', function () {
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

  describe('!config ow-info addRegionAlias {alias}', function () {
    beforeEach(function () {
      this.test$.args.alias = 'test2';
    });

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

  describe('!config ow-info addRegionAlias {alias} {region}', function () {
    beforeEach(function () {
      this.test$.args.alias = 'test2';
      this.test$.args.region = 'test';
    });

    context('when the region exists', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        await this.jasmine.getService('ow-info', 'RegionService')
          .mapRegion(this.message.guild, 'test', this.role).toPromise();
      });

      it('remaps the region', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 200,
          content: `Added alias test2 for test`,
        });
      });
    });

    context('when the region does not exist', function () {
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
