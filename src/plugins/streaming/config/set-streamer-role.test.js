const {MockMessage} = require("chaos-core").test.discordMocks;

describe('streaming: !config streaming setStreamerRole', function () {
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

  describe('!config streaming setStreamerRole', function () {
    beforeEach(function () {
      this.message.content = '!config streaming setStreamerRole';
    });

    context('when role is missing', function () {
      it('returns a user readable error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `I'm sorry, but I'm missing some information for that command:`,
        });
      });
    });

    context('when the role can not be found', function () {
      beforeEach(function () {
        this.message.content = '!config streaming setStreamerRole role-not-found';
      });

      it('returns a user readable error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `The role 'role-not-found' could not be found.`,
        });
      });
    });

    context('when the role exists', function () {
      let roleId = '55500001';
      let roleName = 'testRole';

      beforeEach(function () {
        this.role = {
          id: roleId,
          name: roleName,
        };
        this.message.guild.roles.set(this.role.id, this.role);
      });

      Object.entries({
        'a mention': `<@${roleId}>`,
        'a mention (with &)': `<@&${roleId}>`,
        'an id': roleId,
        'a name': roleName,
      }).forEach(([inputType, value]) => {
        context(`when a role is given as ${inputType}`, function () {
          beforeEach(function () {
            this.message.content = `!config streaming setStreamerRole ${value}`;
            sinon.stub(this.streamingService, 'setStreamerRole').resolves(this.role);
          });

          it('sets the live role to the correct role', async function () {
            await this.jasmine.testMessage(this.message);
            expect(this.streamingService.setStreamerRole).to.have.been.calledWith(this.message.guild, this.role);
          });

          it('returns a success message', async function () {
            const responses = await this.jasmine.testMessage(this.message);
            expect(responses[0]).to.containSubset({
              content: `I will now only give the live role to users with the ${this.role.name} role`,
            });
          });
        });
      });
    });
  });
});
