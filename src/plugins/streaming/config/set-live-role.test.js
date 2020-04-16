const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('streaming: !config streaming setLiveRole', function () {
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

  describe('!config streaming setLiveRole', function () {
    beforeEach(function () {
      this.message.content = '!config streaming setLiveRole';
    });

    context('when role is missing', function () {
      it('returns a user readable error', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses[0]).to.containSubset({
          content: `I'm sorry, but I'm missing some information for that command:`,
        });
      });
    });
  });

  describe('!config streaming setLiveRole {role}', function () {
    context('when the role can not be found', function () {
      beforeEach(function () {
        this.message.content = '!config streaming setLiveRole role-not-found';
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
        this.message.guild.roles = new Discord.Collection();
        this.message.guild.roles.set(this.role.id, this.role);
      });

      Object.entries({
        'when a role is given as a mention': `<@${roleId}>`,
        'when a role is given as a mention (with &)': `<@&${roleId}>`,
        'when a role is given as an id': roleId,
        'when a role is given as a name': roleName,
      }).forEach(([contextMsg, value]) => {
        context(contextMsg, function () {
          beforeEach(function () {
            this.message.content = `!config streaming setLiveRole ${value}`;
            this.streamingService.setLiveRole = async () => this.role;
          });

          it('sets the live role to the correct role', async function () {
            sinon.spy(this.streamingService, 'setLiveRole');

            await this.jasmine.testMessage(this.message);
            expect(this.streamingService.setLiveRole).to.have.been.calledWith(this.message.guild, this.role);
          });

          it('returns a success message', async function () {
            const responses = await this.jasmine.testMessage(this.message);
            expect(responses[0]).to.containSubset({
              content: `Live streamers will now be given the ${this.role.name} role.`,
            });
          });
        });
      });
    });
  });
});
