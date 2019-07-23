const {from} = require('rxjs');
const {tap} = require('rxjs/operators');

describe('streaming: !config streaming viewSettings', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'streaming',
      actionName: 'viewSettings',
    });

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('#run', function () {
    context('when no live role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      });

      it('Says the live role is not set', function (done) {
        this.test$.pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {
              name: 'Live Role:',
              value: '[Not set]',
            },
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a live role is set', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([this.role]));
      });

      it('Says the live role is not set', function (done) {
        this.test$.pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {name: 'Live Role:', value: 'liveRole'},
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when no streamer role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getStreamerRole').returns(from([undefined]));
      });

      it('Says the live role is not set', function (done) {
        this.test$.pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {name: 'Streamer Role:', value: '[Not set]'},
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a streamer role is set', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'streamerRole'};
        sinon.stub(this.streamingService, 'getStreamerRole').returns(from([this.role]));
      });

      it('Says the live role is not set', function (done) {
        this.test$.pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {name: 'Streamer Role:', value: 'streamerRole'},
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
