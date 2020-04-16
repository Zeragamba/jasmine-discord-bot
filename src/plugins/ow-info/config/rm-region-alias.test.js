const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('ow-info: !config ow-info rmRegionAlias', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'ow-info');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.member);
  });

  describe('!config ow-info rmRegionAlias', function () {
    beforeEach(function () {
      this.message.content = '!config ow-info rmRegionAlias';
    });

    it('responds with an error message', async function () {
      const responses = await this.jasmine.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });

    it('does not run the action', async function () {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      await this.jasmine.testMessage(this.message);
      expect(action.run).not.to.have.been.called;
    });
  });

  describe('!config ow-info rmRegionAlias {alias}', function () {
    beforeEach(function () {
      this.message.content = '!config ow-info rmRegionAlias test2';
    });

    context('when the alias has been mapped', function () {
      beforeEach(async function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        const regionService = this.jasmine.getService('ow-info', 'RegionService');
        await regionService.mapRegion(this.message.guild, 'test', this.role);
        await regionService.mapAlias(this.message.guild, 'test2', 'test');
      });

      it('removes the alias', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `Removed region alias 'test2'`,
        });
      });
    });

    context('when the alias was not mapped', function () {
      it('responds with an error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `Alias 'test2' was not found`,
        });
      });
    });
  });
});
