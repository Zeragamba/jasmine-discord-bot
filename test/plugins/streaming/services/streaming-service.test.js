const Rx = require('rx');
const ChaosDataMemory = require('chaos-data-memory');
const Collection = require('discord.js').Collection;
const DiscordAPIError = require('discord.js').DiscordAPIError;

const StreamingService = require('../../../../plugins/streaming/services/streaming-service');
const DATAKEYS = require('../../../../plugins/streaming/lib/datakeys');
const {RoleNotFoundError} = require('../../../../plugins/streaming/lib/errors');

describe('StreamingService', function () {
  beforeEach(function () {
    this.dataSource = new ChaosDataMemory();
    this.presenceUpdate$ = new Rx.Subject();

    this.jasmine = stubJasmine();
    this.jasmine.streams = {
      presenceUpdate$: this.presenceUpdate$,
    };

    this.streamingService = new StreamingService(this.jasmine);
  });

  afterEach(function () {
    this.presenceUpdate$.onCompleted();
  });

  describe('#configureService', function () {
    beforeEach(function () {
      this.pluginService = {};
      this.jasmine.stubService('core', 'PluginService', this.pluginService);
    });

    it('gets PluginService from Nix', function () {
      this.streamingService.configureService();
      expect(this.streamingService.pluginService).to.eq(this.pluginService);
    });
  });

  describe('#onListen', function () {
    it('subscribes to the presence update event stream', function () {
      this.streamingService.onListen();
      expect(this.presenceUpdate$.observers.length).to.eq(1);
    });
  });

  describe('on presence update', function () {
    beforeEach(function () {
      this.streamingService.onListen();

      this.oldMember = {name: 'oldMember'};
      this.newMember = {name: 'newMember'};
      this.eventPayload = [this.oldMember, this.newMember];

      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(Rx.Observable.of(''));

      this.triggerEvent = (done, callback) => {
        expect(this.presenceUpdate$).to.complete(done, callback);

        this.presenceUpdate$.onNext(this.eventPayload);
        this.presenceUpdate$.onCompleted();
      };
    });

    it('calls #handlePresenceUpdate', function (done) {
      this.triggerEvent(done, () => {
        expect(this.streamingService.handlePresenceUpdate).to.have.been.called;
      });
    });

    it('passes #handlePresenceUpdate oldMember and newMember', function (done) {
      this.triggerEvent(done, () => {
        expect(this.streamingService.handlePresenceUpdate).to.have.been.calledWith(this.oldMember, this.newMember);
      });
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

      sinon.stub(this.pluginService, 'isPluginEnabled').returns(Rx.Observable.of(false));
      sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.from([undefined]));
      sinon.stub(this.streamingService, 'memberIsStreamer').returns(Rx.Observable.of(true));

      sinon.stub(this.streamingService, 'updateMemberRoles').returns(Rx.Observable.of(''));
    });

    context('when the module is enabled', function () {
      beforeEach(function () {
        this.streamingService.pluginService.isPluginEnabled.returns(Rx.Observable.of(true));
      });

      context('when a live role is not set', function () {
        beforeEach(function () {
          this.streamingService.getLiveRole.returns(Rx.Observable.from([undefined]));
        });

        it('does not call #updateMemberRoles', function (done) {
          expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
            .to.complete(done, () => {
            expect(this.streamingService.updateMemberRoles).not.to.have.been.called;
          });
        });
      });

      context('when a live role is set', function () {
        beforeEach(function () {
          this.liveRole = {id: 'role-00001', name: 'liveRole'};
          this.streamingService.getLiveRole.returns(Rx.Observable.of(this.liveRole));
        });

        context('when the user is not a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(Rx.Observable.of(false));
          });

          it('does not call #updateMemberRoles', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(done, () => {
              expect(this.streamingService.updateMemberRoles).not.to.have.been.called;
            });
          });
        });

        context('when the user is a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(Rx.Observable.of(true));
          });

          it('calls #updateMemberRoles', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(done, () => {
              expect(this.streamingService.updateMemberRoles).to.have.been.called;
            });
          });

          it('passes the new member to #updateMemberRoles', function (done) {
            expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
              .to.complete(done, () => {
              expect(this.streamingService.updateMemberRoles).to.have.been.calledWith(this.newMember);
            });
          });

          context('when #updateMemberRoles raises an Discord "Missing Permissions" error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(DiscordAPIError);
              this.error.message = 'Missing Permissions';
              this.streamingService.memberIsStreamer.returns(Rx.Observable.throw(this.error));
            });

            it('silences the error', function (done) {
              expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
                .to.emit([]).and.complete(done);
            });
          });

          context('when #updateMemberRoles raises an unknown Discord error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(DiscordAPIError);
              this.error.message = 'Example Error';
              this.streamingService.memberIsStreamer.returns(Rx.Observable.throw(this.error));

              this.jasmine.handleError.returns(Rx.Observable.empty());
            });

            it('does not crash the stream', function (done) {
              expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
                .to.emit([]).and.complete(done);
            });
          });

          context('when #updateMemberRoles raises an unknown error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(Error);
              this.error.message = 'Example Error';
              this.streamingService.memberIsStreamer.returns(Rx.Observable.throw(this.error));

              this.jasmine.handleError.returns(Rx.Observable.empty());
            });

            it('lets chaos handle the error', function (done) {
              expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
                .to.complete(done, () => {
                expect(this.jasmine.handleError).to.have.been.calledWith(this.error);
              });
            });

            it('does not crash the stream', function (done) {
              expect(this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember))
                .to.emit([]).and.complete(done);
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
      sinon.stub(this.streamingService, 'addLiveRoleToMember').returns(Rx.Observable.of(''));
      sinon.stub(this.streamingService, 'removeLiveRoleFromMember').returns(Rx.Observable.of(''));
    });

    it('calls #memberIsStreaming', function (done) {
      expect(this.streamingService.updateMemberRoles(this.member))
        .to.complete(done, () => {
        expect(this.streamingService.memberIsStreaming).to.have.been.called;
      });
    });

    it('passes the member to #memberIsStreaming', function (done) {
      expect(this.streamingService.updateMemberRoles(this.member))
        .to.complete(done, () => {
        expect(this.streamingService.memberIsStreaming).to.have.been.calledWith(this.member);
      });
    });

    context('when member is streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(true);
      });

      it('calls #addLiveRoleToMember', function (done) {
        expect(this.streamingService.updateMemberRoles(this.member))
          .to.complete(done, () => {
          expect(this.streamingService.addLiveRoleToMember).to.have.been.called;
        });
      });

      it('passes the member to #addLiveRoleToMember', function (done) {
        expect(this.streamingService.updateMemberRoles(this.member))
          .to.complete(done, () => {
          expect(this.streamingService.addLiveRoleToMember).to.have.been.calledWith(this.member);
        });
      });
    });

    context('when member is not streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(true);
      });

      it('calls #removeLiveRoleFromMember', function (done) {
        expect(this.streamingService.updateMemberRoles(this.member))
          .to.complete(done, () => {
          expect(this.streamingService.removeLiveRoleFromMember).to.have.been.called;
        });
      });

      it('passes the member to #removeLiveRoleFromMember', function (done) {
        expect(this.streamingService.updateMemberRoles(this.member))
          .to.complete(done, () => {
          expect(this.streamingService.removeLiveRoleFromMember).to.have.been.calledWith(this.member);
        });
      });
    });
  });

  describe('#addLiveRoleToMember', function () {
    beforeEach(function () {
      this.member = {
        guild: {name: 'testGuild'},
        user: {tag: 'member#0001'},
        roles: new Collection(),
        addRole: sinon.fake.returns(Rx.Observable.of('')),
      };
    });

    context('when there is no live role set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.from([undefined]));
      });

      it('does not emit anything', function (done) {
        expect(this.streamingService.addLiveRoleToMember(this.member))
          .to.emit([])
          .and.complete(done);
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.of(this.liveRole));
      });

      context('when the user is missing the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.liveRole.id);
        });

        it('assigns the role to the member', function (done) {
          expect(this.streamingService.addLiveRoleToMember(this.member))
            .to.complete(done, () => {
            expect(this.member.addRole).to.have.been.calledWith(this.liveRole);
          });
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
        removeRole: sinon.fake.returns(Rx.Observable.of('')),
      };
    });

    context('when there is no live role set', function () {
      beforeEach(function () {
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.from([undefined]));
      });

      it('does not emit anything', function (done) {
        expect(this.streamingService.removeLiveRoleFromMember(this.member))
          .to.emit([])
          .and.complete(done);
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(Rx.Observable.of(this.liveRole));
      });

      context('when the user does not have the role', function () {
        it('does not emit anything', function (done) {
          expect(this.streamingService.removeLiveRoleFromMember(this.member))
            .to.emit([])
            .and.complete(done);
        });
      });

      context('when the user has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.liveRole.id, this.liveRole);
        });

        it('removes the role', function (done) {
          expect(this.streamingService.removeLiveRoleFromMember(this.member))
            .to.complete(done, () => {
            expect(this.member.removeRole).to.have.been.calledWith(this.liveRole);
          });
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
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the role to assign', function (done) {
        expect(this.streamingService.getLiveRole(this.guild))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.getLiveRole(this.guild))
          .to.emitLength(1).and.emit([undefined])
          .and.complete(done);
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

      it('saves the role id', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        expect(this.streamingService.setLiveRole(this.guild, this.role))
          .to.complete(done, () => {
          expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id);
        });
      });

      it('returns the saved role', function (done) {
        expect(this.streamingService.setLiveRole(this.guild, this.role))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        expect(this.streamingService.setLiveRole(this.guild, null))
          .to.complete(done, () => {
          expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, null);
        });
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.setLiveRole(this.guild, null))
          .to.emit([undefined])
          .and.complete(done);
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

    it('sets the live role to null', function (done) {
      sinon.spy(this.jasmine, 'setGuildData');

      expect(this.streamingService.removeLiveRole(this.guild))
        .to.complete(done, () => {
        expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.LIVE_ROLE, null);
      });
    });

    context('when a previous role was set', function () {
      beforeEach(function (done) {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([undefined])
          .and.complete(done);
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.removeLiveRole(this.guild))
          .to.emit([undefined])
          .and.complete(done);
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
        sinon.stub(this.streamingService, 'getStreamerRole').returns(Rx.Observable.from([undefined]));
      });

      it('emits true', function (done) {
        expect(this.streamingService.memberIsStreamer(this.member))
          .to.emit([true]).and.complete(done);
      });
    });

    context('when there is a streamer role set', function () {
      beforeEach(function () {
        this.streamerRole = {id: 'streamerRoleId', name: 'streamerRole'};
        sinon.stub(this.streamingService, 'getStreamerRole').returns(Rx.Observable.of(this.streamerRole));
      });

      context('when the member does not have the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.streamerRole.id);
        });

        it('emits false', function (done) {
          expect(this.streamingService.memberIsStreamer(this.member))
            .to.emit([false]).and.complete(done);
        });
      });

      context('when the member has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.streamerRole.id, this.streamerRole);
        });

        it('emits true', function (done) {
          expect(this.streamingService.memberIsStreamer(this.member))
            .to.emit([true]).and.complete(done);
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
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the role to assign', function (done) {
        expect(this.streamingService.getStreamerRole(this.guild))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('emits undefined', function (done) {
        expect(this.streamingService.getStreamerRole(this.guild))
          .to.emitLength(1).and.emit([undefined])
          .and.complete(done);
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

      it('saves the role id', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        expect(this.streamingService.setStreamerRole(this.guild, this.role))
          .to.complete(done, () => {
          expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id);
        });
      });

      it('returns the saved role', function (done) {
        expect(this.streamingService.setStreamerRole(this.guild, this.role))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        expect(this.streamingService.setStreamerRole(this.guild, null))
          .to.complete(done, () => {
          expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
        });
      });

      it('returns undefined', function (done) {
        expect(this.streamingService.setStreamerRole(this.guild, null))
          .to.emit([undefined])
          .and.complete(done);
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
      beforeEach(function (done) {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('sets the live role to null', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.complete(done, () => {
          expect(this.jasmine.setGuildData).to.have.been.calledWith(this.guild.id, DATAKEYS.STREAMER_ROLE, null);
        });
      });

      it('returns the previously set role', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.emit([this.role])
          .and.complete(done);
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.throw(RoleNotFoundError)
          .and.close(done);
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        expect(this.streamingService.removeStreamerRole(this.guild))
          .to.throw(RoleNotFoundError)
          .and.close(done);
      });
    });
  });
});
