const Discord = require('discord.js');

describe('ow-info: !config ow-info addRegion', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'ow-info',
      actionName: 'addRegion',
    });

    this.message = this.test$.message;
  });

  describe('!config ow-info addRegion', function () {
    it('responds with an error message', async function () {
      const response = await this.test$.toPromise();
      expect(response).to.containSubset({
        status: 400,
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });

    it('does not run the action', async function () {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      await this.test$.toPromise();
      expect(action.run).not.to.have.been.called;
    });
  });

  describe('!config ow-info addRegion {region}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
    });

    it('responds with an error message', async function () {
      const response = await this.test$.toPromise();
      expect(response).to.containSubset({
        status: 400,
        content: `I'm sorry, but I'm missing some information for that command:`,
      });
    });

    it('does not run the action', async function () {
      const action = this.jasmine.getConfigAction('ow-info', 'addRegion');
      sinon.spy(action, 'run');

      await this.test$.toPromise();
      expect(action.run).not.to.have.been.called;
    });
  });

  describe('!config ow-info addRegion {region} {role}', function () {
    beforeEach(function () {
      this.test$.args.region = 'test';
      this.test$.args.role = 'testRole';
    });

    context('when the role exists', function () {
      beforeEach(function () {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);
      });

      it('remaps the region', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 200,
          content: `Mapped the region test to testRole`,
        });
      });
    });

    context('when the role does not exist', function () {
      it('responds with an error', async function () {
        const response = await this.test$.toPromise();
        expect(response).to.containSubset({
          status: 400,
          content: `The role 'testRole' could not be found`,
        });
      });
    });
  });
});
