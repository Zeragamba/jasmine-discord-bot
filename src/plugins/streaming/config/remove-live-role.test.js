const {MockMessage} = require("chaos-core").test.discordMocks;

describe('streaming: !config streaming removeLiveRole', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    this.role = {id: 'role-00001', name: 'testRole'};

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'streaming');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.member);
  });

  describe('!config streaming removeLiveRole', function () {
    beforeEach(function () {
      this.message.content = '!config streaming removeLiveRole';
    });

    it('removes the live role from the guild', async function () {
      this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
      sinon.spy(this.streamingService, 'removeLiveRole');

      await this.jasmine.testMessage(this.message);
      expect(this.streamingService.removeLiveRole).to.have.been.calledWith(this.message.guild);
    });

    it('returns a success message', async function () {
      const responses = await this.jasmine.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: `Live streamers will no longer receive a role`,
      });
    });
  });
});
