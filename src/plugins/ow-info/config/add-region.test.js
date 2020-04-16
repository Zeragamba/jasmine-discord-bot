const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('ow-info: !config ow-info addRegion', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'ow-info');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.member);
  });

  describe('!config ow-info addRegion', function () {
    beforeEach(function () {
      this.message.content = '!config ow-info addRegion';
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

  describe('!config ow-info addRegion {region}', function () {
    beforeEach(function () {
      this.message.content = '!config ow-info addRegion test';
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

  describe('!config ow-info addRegion {region} {role}', function () {
    beforeEach(function () {
      this.message.content = '!config ow-info addRegion test testRole';
    });

    context('when the role exists', function () {
      beforeEach(function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);
      });

      it('remaps the region', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `Mapped the region test to testRole`,
        });
      });
    });

    context('when the role does not exist', function () {
      it('responds with an error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `The role 'testRole' could not be found`,
        });
      });
    });
  });
});
