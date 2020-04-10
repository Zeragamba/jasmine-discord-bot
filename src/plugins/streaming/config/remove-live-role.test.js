const Collection = require('discord.js').Collection;

describe('streaming: !config streaming removeLiveRole', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.role = {id: 'role-00001', name: 'testRole'};
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'streaming',
      actionName: 'removeLiveRole',
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.test$.message.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };
    });

    it('removes the live role from the guild', async function () {
      this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
      sinon.spy(this.streamingService, 'removeLiveRole');

      await this.test$.toPromise();
      expect(this.streamingService.removeLiveRole).to.have.been.calledWith(this.test$.message.guild);
    });
  });

  it('returns a success message', async function () {
    const response = await this.test$.toPromise();
    expect(response).to.containSubset({
      content: `Live streamers will no longer receive a role`,
      status: 200,
    });
  });
});
