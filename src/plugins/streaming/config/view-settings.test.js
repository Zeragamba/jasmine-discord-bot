const {from} = require('rxjs');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('streaming: !config streaming viewSettings', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    this.role = {id: 'role-00001', name: 'testRole'};

    await this.jasmine.listen().toPromise();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'streaming').toPromise();
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.member).toPromise();

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('!config streaming viewSettings', function () {
    beforeEach(function () {
      this.message.content = '!config streaming viewSettings';
    });

    context('when no live role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      });

      it('Says the live role is not set', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0].embed.fields).to.containSubset([
          {
            name: 'Live Role:',
            value: '[Not set]',
          },
        ]);
      });
    });

    context('when a live role is set', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([this.role]));
      });

      it('Says the live role is not set', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0].embed.fields).to.containSubset([
          {name: 'Live Role:', value: 'liveRole'},
        ]);
      });
    });

    context('when no streamer role is set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getStreamerRole').returns(from([undefined]));
      });

      it('Says the live role is not set', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0].embed.fields).to.containSubset([
          {name: 'Streamer Role:', value: '[Not set]'},
        ]);
      });
    });

    context('when a streamer role is set', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'streamerRole'};
        sinon.stub(this.streamingService, 'getStreamerRole').returns(from([this.role]));
      });

      it('Says the live role is not set', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0].embed.fields).to.containSubset([
          {name: 'Streamer Role:', value: 'streamerRole'},
        ]);
      });
    });
  });
});
