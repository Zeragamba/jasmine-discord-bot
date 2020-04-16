const {MockMessage} = require("chaos-core").test.discordMocks;

describe('streaming: !config streaming removeStreamerRole', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    this.role = {id: 'role-00001', name: 'testRole'};

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'streaming');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.member);

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('!config streaming removeStreamerRole', function () {
    beforeEach(function () {
      this.message.content = '!config streaming removeStreamerRole';
    });

    context('when there was a previous streamer role', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'removeStreamerRole').resolves(this.role);
      });

      it('removes the streamer role from the guild', async function () {
        await this.jasmine.testMessage(this.message);
        expect(this.streamingService.removeStreamerRole).to.have.been.calledWith(this.message.guild);
      });

      it('returns a success message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `I will no longer limit adding the live role to users with the role ${this.role.name}`,
        });
      });
    });

    context('when there was no previous streamer role', function () {
      it('gives a user readable error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `No streamer role was set.`,
        });
      });
    });
  });
});
