const {from} = require('rxjs');
const {tap} = require('rxjs/operators');
const Collection = require('discord.js').Collection;
const ConfigAction = require('chaos-core').ConfigAction;

const StreamingService = require('../../../../plugins/streaming/services/streaming-service');

describe('!config streaming viewSettings', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();

    this.streamingService = new StreamingService(this.jasmine);
    this.jasmine.stubService('streaming', 'StreamingService', this.streamingService);

    this.viewSettings = new ConfigAction(this.jasmine, require('../../../../plugins/streaming/config/view-settings'));
  });

  describe('properties', function () {
    it('has the correct name', function () {
      expect(this.viewSettings.name).to.eq('viewSettings');
    });

    it('has no inputs', function () {
      expect(this.viewSettings.inputs).to.be.empty;
    });
  });

  describe('#run', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Collection(),
      };

      this.context = {
        inputs: {},
        guild: this.guild,
      };
    });

    context('when no live role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      });

      it('Says the live role is not set', function (done) {
        this.viewSettings.run(this.context).pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {name: 'Live Role:', value: '[Not set]'},
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
        this.viewSettings.run(this.context).pipe(
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
        this.viewSettings.run(this.context).pipe(
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
        this.viewSettings.run(this.context).pipe(
          tap(({embed}) => expect(embed.fields).to.containSubset([
            {name: 'Streamer Role:', value: 'streamerRole'},
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
