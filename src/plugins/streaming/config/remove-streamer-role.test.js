const {of} = require('rxjs');
const Collection = require('discord.js').Collection;

describe('streaming: !config streaming removeStreamerRole', function () {
  beforeEach(function () {
    this.role = {id: 'role-00001', name: 'testRole'};
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'streaming',
      actionName: 'removeStreamerRole',
    });

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('#run', function () {
    beforeEach(function () {
      this.test$.message.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };
    });

    context('when there was a previous streamer role', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'removeStreamerRole')
          .returns(of(this.role));
      });

      it('removes the streamer role from the guild', async function () {
        await this.test$.toPromise();
        expect(this.streamingService.removeStreamerRole).to.have.been.calledWith(this.test$.message.guild);
      });

      it('returns a success message', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 200,
          content: `I will no longer limit adding the live role to users with the role ${this.role.name}`,
        });
      });
    });

    context('when there was no previous streamer role', function () {
      it('gives a user readable error', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 400,
          content: `No streamer role was set.`,
        });
      });
    });
  });
});
