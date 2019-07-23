const {tap} = require('rxjs/operators');
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

    it('removes the live role from the guild', function (done) {
      this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
      sinon.spy(this.streamingService, 'removeLiveRole');

      this.test$.pipe(
        tap(() => expect(this.streamingService.removeLiveRole).to.have.been.calledWith(this.test$.message.guild)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('returns a success message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          content: `Live streamers will no longer receive a role`,
          status: 200,
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});
