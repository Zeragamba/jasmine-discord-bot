const {of} = require('rxjs');
const {tap} = require('rxjs/operators');
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

      it('removes the streamer role from the guild', function (done) {
        this.test$.pipe(
          tap(() => expect(this.streamingService.removeStreamerRole).to.have.been.calledWith(this.test$.message.guild)),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns a success message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 200,
            content: `I will no longer limit adding the live role to users with the role ${this.role.name}`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there was no previous streamer role', function () {
      it('gives a user readable error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `No streamer role was set.`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
