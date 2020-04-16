const Collection = require('discord.js').Collection;
const {MockGuild, MockUser, MockGuildMember} = require("chaos-core").test.discordMocks;

const DATAKEYS = require('../lib/datakeys');
const {RoleNotFoundError} = require('../lib/errors');

describe('streaming: StreamingService', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    await this.jasmine.listen();
    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');

    this.guild = new MockGuild({
      client: this.jasmine.discord,
    });
  });

  describe('on presence update', function () {
    beforeEach(function () {
      this.user = new MockUser({client: this.jasmine.discord});
      this.oldMember = new MockGuildMember({guild: this.guild, user: this.user});
      this.newMember = new MockGuildMember({guild: this.guild, user: this.user});
      this.eventPayload = [this.oldMember, this.newMember];

      sinon.stub(this.streamingService, 'updateMemberRoles').resolves();
    });

    it('calls #updateMemberRoles', async function () {
      await this.jasmine.emit('presenceUpdate', this.eventPayload);
      expect(this.streamingService.updateMemberRoles).to.have.been.called;
    });

    it('passes #updateMemberRoles newMember', async function () {
      await this.jasmine.emit('presenceUpdate', this.eventPayload);
      expect(this.streamingService.updateMemberRoles).to.have.been.calledWith(this.newMember);
    });
  });

  describe('#updateMemberRoles', function () {
    beforeEach(async function () {
      this.member = {
        id: 'testMember',
        guild: this.guild,
        user: {tag: 'member#0001'},
        roles: new Collection(),
        presence: {
          activities: [],
        },

        addRole: async (role) => this.member.roles.set(role.id, role),
        removeRole: async (role) => this.member.roles.delete(role.id),
      };

      this.guild.members.set(this.member.id, this.member);

      this.liveRole = {id: 'liveRoleId'};
      this.guild.roles.set(this.liveRole.id, this.liveRole);

      this.streamerRole = {id: 'streamerRoleId'};
      this.guild.roles.set(this.streamerRole.id, this.streamerRole);

      await this.jasmine.getService('core', 'PluginService')
        .enablePlugin(this.guild.id, 'streaming');
      await this.streamingService.setLiveRole(this.guild, this.liveRole);
    });

    context("when the user has gone live", function () {
      beforeEach(function () {
        this.member.presence.activities = [
          {streaming: true},
        ];
      });

      it("adds the live role", async function () {
        sinon.spy(this.member, 'addRole');
        await this.streamingService.updateMemberRoles(this.member);
        expect(this.member.addRole).to.have.been.calledWith(this.liveRole);
      });

      context("when the user already has the live role", function () {
        beforeEach(async function () {
          await this.member.addRole(this.liveRole);
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });

      context("when the user is not a streamer", function () {
        beforeEach(async function () {
          await this.streamingService.setStreamerRole(this.guild, this.streamerRole);
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });

      context("when the plugin is disabled", function () {
        beforeEach(async function () {
          await this.jasmine.getService('core', 'PluginService')
            .disablePlugin(this.guild.id, 'streaming');
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });
    });

    context("when the user has gone offline", function () {
      beforeEach(async function () {
        this.member.presence.activities = [
          {streaming: false},
        ];
        await this.member.addRole(this.liveRole);
      });

      it("removes the live role", async function () {
        sinon.spy(this.member, 'removeRole');

        await this.streamingService.updateMemberRoles(this.member);
        expect(this.member.removeRole).to.have.been.calledWith(this.liveRole);
      });

      context("when the user doesn't have the live role", function () {
        beforeEach(async function () {
          await this.member.removeRole(this.liveRole);
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });

      context("when the user is not a streamer", function () {
        beforeEach(async function () {
          this.streamerRole = {id: "streamerRoleId"};
          this.guild.roles.set(this.streamerRole.id, this.streamerRole);
          await this.streamingService.setStreamerRole(this.guild, this.streamerRole);
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });

      context("when the plugin is disabled", function () {
        beforeEach(async function () {
          await this.jasmine.getService('core', 'PluginService')
            .disablePlugin(this.guild.id, 'streaming');
        });

        it("does not change the user's roles", async function () {
          sinon.spy(this.member, 'addRole');
          sinon.spy(this.member, 'removeRole');

          await this.streamingService.updateMemberRoles(this.member);
          expect(this.member.addRole).not.to.have.been.called;
          expect(this.member.removeRole).not.to.have.been.called;
        });
      });
    });
  });

  describe('#addLiveRoleToMember', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        user: {tag: 'member#0001'},
        roles: new Collection(),
        addRole: sinon.fake.resolves(),
      };
    });

    context('when there is no live role set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').resolves();
      });

      it('does not return anything', async function () {
        const role = await this.streamingService.addLiveRoleToMember(this.member);
        expect(role).to.be.undefined;
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').resolves(this.liveRole);
      });

      context('when the user is missing the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.liveRole.id);
        });

        it('assigns the role to the member', async function () {
          await this.streamingService.addLiveRoleToMember(this.member);
          expect(this.member.addRole).to.have.been.calledWith(this.liveRole);
        });
      });
    });
  });

  describe('#removeLiveRoleFromMember', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        user: {tag: 'member#0001'},
        roles: new Collection(),
        removeRole: sinon.fake.resolves(),
      };
    });

    context('when there is no live role set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').resolves();
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').resolves(this.liveRole);
      });

      context('when the user has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.liveRole.id, this.liveRole);
        });

        it('removes the role', async function () {
          await this.streamingService.removeLiveRoleFromMember(this.member);
          expect(this.member.removeRole).to.have.been.calledWith(this.liveRole);
        });
      });
    });
  });

  describe('#getLiveRole', function () {
    beforeEach(function () {
      this.role = {id: 'role-00001', name: 'test-role'};
      this.guild.roles.set(this.role.id, this.role);
    });

    context('when there is a role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id);
      });

      it('returns the role to assign', async function () {
        const role = await this.streamingService.getLiveRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when there is no role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.getLiveRole(this.guild);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#setLiveRole', function () {
    context('when passed a role', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', async function () {
        await this.streamingService.setLiveRole(this.guild, this.role);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE);
        expect(savedData).to.eq(this.role.id);
      });

      it('returns the saved role', async function () {
        const role = await this.streamingService.setLiveRole(this.guild, this.role);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when passed null', function () {
      it('saves null', async function () {
        await this.streamingService.setLiveRole(this.guild, null);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE);
        expect(savedData).to.eq(null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.setLiveRole(this.guild, null);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#removeLiveRole', function () {
    it('sets the live role to null', async function () {
      await this.streamingService.removeLiveRole(this.guild);
      const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE);
      expect(savedData).to.eq(null);
    });

    context('when a previous role was set', function () {
      beforeEach(async function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id);
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeLiveRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, 'role-00001');
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeLiveRole(this.guild);
        expect(role).to.be.undefined;
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.removeLiveRole(this.guild);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#memberIsStreamer', function () {
    beforeEach(function () {
      this.member = {
        name: 'oldMember',
        guild: this.guild,
        roles: new Collection(),
      };
    });

    context('when there is no streamer role set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getStreamerRole').resolves();
      });

      it('returns true', async function () {
        const isStreamer = await this.streamingService.memberIsStreamer(this.member);
        expect(isStreamer).to.be.true;
      });
    });

    context('when there is a streamer role set', function () {
      beforeEach(function () {
        this.streamerRole = {id: 'streamerRoleId', name: 'streamerRole'};
        sinon.stub(this.streamingService, 'getStreamerRole').resolves(this.streamerRole);
      });

      context('when the member does not have the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.streamerRole.id);
        });

        it('returns false', async function () {
          const isStreamer = await this.streamingService.memberIsStreamer(this.member);
          expect(isStreamer).to.be.false;
        });
      });

      context('when the member has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.streamerRole.id, this.streamerRole);
        });

        it('returns true', async function () {
          const isStreamer = await this.streamingService.memberIsStreamer(this.member);
          expect(isStreamer).to.be.true;
        });
      });
    });
  });

  describe('#memberIsStreaming', function () {
    beforeEach(function () {
      this.member = {
        presence: {activities: []},
      };
    });

    context('when the member is not playing a game', function () {
      beforeEach(function () {
        this.member.presence.activities = [];
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is playing a game, but not streaming', function () {
      beforeEach(function () {
        this.member.presence.activities = [
          {streaming: false},
        ];
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is streaming', function () {
      beforeEach(function () {
        this.member.presence.activities = [
          {streaming: true},
        ];
      });

      it('returns true', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(true);
      });
    });
  });

  describe('#getStreamerRole', function () {
    beforeEach(function () {
      this.role = {id: 'role-00001', name: 'test-role'};
      this.guild.roles.set(this.role.id, this.role);
    });

    context('when there is a role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id);
      });

      it('returns the role to assign', async function () {
        const role = await this.streamingService.getStreamerRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when there is no role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.getStreamerRole(this.guild);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#setStreamerRole', function () {
    context('when passed a role', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', async function () {
        await this.streamingService.setStreamerRole(this.guild, this.role);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE);
        expect(savedData).to.eq(this.role.id);
      });

      it('returns the saved role', async function () {
        const role = await this.streamingService.setStreamerRole(this.guild, this.role);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when passed null', function () {
      it('saves null', async function () {
        await this.streamingService.setStreamerRole(this.guild, null);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE);
        expect(savedData).to.eq(null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.setStreamerRole(this.guild, null);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#removeStreamerRole', function () {
    context('when a previous role was set', function () {
      beforeEach(async function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id);
      });

      it('sets the live role to null', async function () {
        await this.streamingService.removeStreamerRole(this.guild);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE);
        expect(savedData).to.eq(null);
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeStreamerRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, 'role-00001');
      });

      it('throws a RoleNotFoundError', async function () {
        try {
          await this.streamingService.removeStreamerRole(this.guild);
        } catch (error) {
          expect(error).to.be.an.instanceOf(RoleNotFoundError);
          return;
        }
        throw new Error("Expected an error to be thrown");
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
      });

      it('throws a RoleNotFoundError', async function () {
        try {
          await this.streamingService.removeStreamerRole(this.guild);
        } catch (error) {
          expect(error).to.be.an.instanceOf(RoleNotFoundError);
          return;
        }
        throw new Error("Expected an error to be thrown");
      });
    });
  });
});
