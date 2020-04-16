const {of, throwError} = require('rxjs');
const Collection = require('discord.js').Collection;
const DiscordAPIError = require('discord.js').DiscordAPIError;
const {MockGuild, MockUser, MockGuildMember} = require("chaos-core").test.discordMocks;

const DATAKEYS = require('../lib/datakeys');
const {RoleNotFoundError} = require('../lib/errors');

describe('streaming: StreamingService', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    await this.jasmine.listen().toPromise();
    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('on presence update', function () {
    beforeEach(function () {
      this.guild = new MockGuild({client: this.jasmine.discord});
      this.user = new MockUser({client: this.jasmine.discord});
      this.oldMember = new MockGuildMember({guild: this.guild, user: this.user});
      this.newMember = new MockGuildMember({guild: this.guild, user: this.user});
      this.eventPayload = [this.oldMember, this.newMember];

      sinon.stub(this.streamingService, 'handlePresenceUpdate').resolves();
    });

    it('calls #handlePresenceUpdate', async function () {
      await this.jasmine.emit('presenceUpdate', this.eventPayload).toPromise();
      expect(this.streamingService.handlePresenceUpdate).to.have.been.called;
    });

    it('passes #handlePresenceUpdate oldMember and newMember', async function () {
      await this.jasmine.emit('presenceUpdate', this.eventPayload).toPromise();
      expect(this.streamingService.handlePresenceUpdate).to.have.been.calledWith(this.oldMember, this.newMember);
    });
  });

  describe('#handlePresenceUpdate', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        name: 'testGuild',
      };

      this.oldMember = {
        name: 'oldMember',
        guild: this.guild,
      };

      this.newMember = {
        name: 'newMember',
        user: {tag: 'newMember#0001'},
        guild: this.guild,
      };

      this.pluginService = this.jasmine.getService('core', 'pluginService');
      this.streamingService.pluginService = this.pluginService;

      sinon.stub(this.pluginService, 'isPluginEnabled').returns(of(false));
      sinon.stub(this.streamingService, 'getLiveRole').resolves();
      sinon.stub(this.streamingService, 'memberIsStreamer').resolves(true);

      sinon.stub(this.streamingService, 'updateMemberRoles').resolves();
    });

    context('when the module is enabled', function () {
      beforeEach(function () {
        this.streamingService.pluginService.isPluginEnabled.returns(of(true));
      });

      context('when a live role is not set', function () {
        beforeEach(function () {
          this.streamingService.getLiveRole.resolves();
        });

        it('does not call #updateMemberRoles', async function () {
          await this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember);
          expect(this.streamingService.updateMemberRoles).not.to.have.been.called;
        });
      });

      context('when a live role is set', function () {
        beforeEach(function () {
          this.liveRole = {id: 'role-00001', name: 'liveRole'};
          this.streamingService.getLiveRole.resolves(this.liveRole);
        });

        context('when the user is not a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(false);
          });

          it('does not call #updateMemberRoles', async function () {
            await this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember);
            expect(this.streamingService.updateMemberRoles).not.to.have.been.called;
          });
        });

        context('when the user is a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(true);
          });

          it('calls #updateMemberRoles', async function () {
            await this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember);
            expect(this.streamingService.updateMemberRoles).to.have.been.called;
          });

          it('passes the new member to #updateMemberRoles', async function () {
            await this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember);
            expect(this.streamingService.updateMemberRoles).to.have.been.calledWith(this.newMember);
          });

          context('when #updateMemberRoles raises an Discord "Missing Permissions" error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(DiscordAPIError);
              this.error.message = 'Missing Permissions';
              this.streamingService.updateMemberRoles.returns(throwError(this.error));
            });

            it('silences the error', async function () {
              await this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember);
            });
          });
        });
      });
    });
  });

  describe('#updateMemberRoles', function () {
    beforeEach(function () {
      this.member = {
        guild: {name: 'testGuild'},
        user: {tag: 'member#0001'},
      };
      sinon.stub(this.streamingService, 'memberIsStreaming').returns(false);
      sinon.stub(this.streamingService, 'addLiveRoleToMember').resolves();
      sinon.stub(this.streamingService, 'removeLiveRoleFromMember').resolves();
    });

    it('calls #memberIsStreaming', async function () {
      await this.streamingService.updateMemberRoles(this.member);
      expect(this.streamingService.memberIsStreaming).to.have.been.called;
    });

    it('passes the member to #memberIsStreaming', async function () {
      await this.streamingService.updateMemberRoles(this.member);
      expect(this.streamingService.memberIsStreaming).to.have.been.calledWith(this.member);
    });

    context('when member is streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(true);
      });

      it('calls #addLiveRoleToMember', async function () {
        await this.streamingService.updateMemberRoles(this.member);
        expect(this.streamingService.addLiveRoleToMember).to.have.been.called;
      });

      it('passes the member to #addLiveRoleToMember', async function () {
        await this.streamingService.updateMemberRoles(this.member);
        expect(this.streamingService.addLiveRoleToMember).to.have.been.calledWith(this.member);
      });
    });

    context('when member is not streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(false);
      });

      it('calls #removeLiveRoleFromMember', async function () {
        await this.streamingService.updateMemberRoles(this.member);
        expect(this.streamingService.removeLiveRoleFromMember).to.have.been.called;
      });

      it('passes the member to #removeLiveRoleFromMember', async function () {
        await this.streamingService.updateMemberRoles(this.member);
        expect(this.streamingService.removeLiveRoleFromMember).to.have.been.calledWith(this.member);
      });
    });
  });

  describe('#addLiveRoleToMember', function () {
    beforeEach(function () {
      this.member = {
        guild: {name: 'testGuild'},
        user: {tag: 'member#0001'},
        roles: new Collection(),
        addRole: sinon.fake.returns(of('')),
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
        guild: {name: 'testGuild'},
        user: {tag: 'member#0001'},
        roles: new Collection(),
        removeRole: sinon.fake.returns(of('')),
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

      this.roles = new Map();
      this.roles.set(this.role.id, this.role);

      this.guild = {
        id: 'guild-00001',
        roles: this.roles,
      };
    });

    context('when there is a role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id).toPromise();
      });

      it('returns the role to assign', async function () {
        const role = await this.streamingService.getLiveRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when there is no role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null).toPromise();
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.getLiveRole(this.guild);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#setLiveRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when passed a role', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', async function () {
        await this.streamingService.setLiveRole(this.guild, this.role);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE).toPromise();
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
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE).toPromise();
        expect(savedData).to.eq(null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.setLiveRole(this.guild, null);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#removeLiveRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    it('sets the live role to null', async function () {
      await this.streamingService.removeLiveRole(this.guild);
      const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.LIVE_ROLE).toPromise();
      expect(savedData).to.eq(null);
    });

    context('when a previous role was set', function () {
      beforeEach(async function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id).toPromise();
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeLiveRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, 'role-00001').toPromise();
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeLiveRole(this.guild);
        expect(role).to.be.undefined;
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null).toPromise();
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
        presence: {},
      };
    });

    context('when the member is not playing a game', function () {
      beforeEach(function () {
        delete this.member.presence.game;
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is playing a game, but not streaming', function () {
      beforeEach(function () {
        this.member.presence.game = {
          streaming: false,
        };
      });

      it('returns false', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(false);
      });
    });

    context('when the member is streaming', function () {
      beforeEach(function () {
        this.member.presence.game = {
          streaming: true,
        };
      });

      it('returns true', function () {
        expect(this.streamingService.memberIsStreaming(this.member)).to.eq(true);
      });
    });
  });

  describe('#getStreamerRole', function () {
    beforeEach(function () {
      this.role = {id: 'role-00001', name: 'test-role'};

      this.roles = new Map();
      this.roles.set(this.role.id, this.role);

      this.guild = {
        id: 'guild-00001',
        roles: this.roles,
      };
    });

    context('when there is a role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id).toPromise();
      });

      it('returns the role to assign', async function () {
        const role = await this.streamingService.getStreamerRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when there is no role set', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null).toPromise();
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.getStreamerRole(this.guild);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#setStreamerRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when passed a role', function () {
      beforeEach(function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);
      });

      it('saves the role id', async function () {
        await this.streamingService.setStreamerRole(this.guild, this.role);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE).toPromise();
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
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE).toPromise();
        expect(savedData).to.eq(null);
      });

      it('returns undefined', async function () {
        const role = await this.streamingService.setStreamerRole(this.guild, null);
        expect(role).to.be.undefined;
      });
    });
  });

  describe('#removeStreamerRole', function () {
    beforeEach(function () {
      this.guild = {
        id: 'guild-00001',
        roles: new Map(),
      };
    });

    context('when a previous role was set', function () {
      beforeEach(async function () {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id).toPromise();
      });

      it('sets the live role to null', async function () {
        await this.streamingService.removeStreamerRole(this.guild);
        const savedData = await this.jasmine.getGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE).toPromise();
        expect(savedData).to.eq(null);
      });

      it('returns the previously set role', async function () {
        const role = await this.streamingService.removeStreamerRole(this.guild);
        expect(role).to.deep.eq(this.role);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(async function () {
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, 'role-00001').toPromise();
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
        await this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null).toPromise();
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
