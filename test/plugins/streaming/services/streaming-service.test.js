const {of, from, throwError, Subject, EMPTY} = require('rxjs');
const {tap, toArray, catchError} = require('rxjs/operators');

const ChaosDataMemory = require('chaos-data-memory');
const Collection = require('discord.js').Collection;
const DiscordAPIError = require('discord.js').DiscordAPIError;

const StreamingService = require('../../../../plugins/streaming/services/streaming-service');
const DATAKEYS = require('../../../../plugins/streaming/lib/datakeys');
const {RoleNotFoundError} = require('../../../../plugins/streaming/lib/errors');

describe('StreamingService', function () {
  beforeEach(function () {
    this.dataSource = new ChaosDataMemory();
    this.presenceUpdate$ = new Subject();

    this.jasmine = stubJasmine();
    this.jasmine.streams = {
      presenceUpdate$: this.presenceUpdate$,
    };

    this.streamingService = new StreamingService(this.jasmine);
  });

  afterEach(function () {
    this.presenceUpdate$.complete();
  });

  describe('#onListen', function () {
    beforeEach(function () {
      this.pluginService = {};
      this.jasmine.stubService('core', 'PluginService', this.pluginService);
    });

    it('gets PluginService from Nix', function () {
      this.streamingService.onListen();
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

      sinon.stub(this.streamingService, 'handlePresenceUpdate').returns(of(''));

      this.triggerEvent = (done, callback) => {
        this.presenceUpdate$.subscribe(() => {}, (error) => done(error), () => {
          callback();
          done();
        });

        this.presenceUpdate$.next(this.eventPayload);
        this.presenceUpdate$.complete();
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

      sinon.stub(this.pluginService, 'isPluginEnabled').returns(of(false));
      sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      sinon.stub(this.streamingService, 'memberIsStreamer').returns(of(true));

      sinon.stub(this.streamingService, 'updateMemberRoles').returns(of(''));
    });

    context('when the module is enabled', function () {
      beforeEach(function () {
        this.streamingService.pluginService.isPluginEnabled.returns(of(true));
      });

      context('when a live role is not set', function () {
        beforeEach(function () {
          this.streamingService.getLiveRole.returns(from([undefined]));
        });

        it('does not call #updateMemberRoles', function (done) {
          this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
            toArray(),
            tap(() => expect(this.streamingService.updateMemberRoles).not.to.have.been.called),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when a live role is set', function () {
        beforeEach(function () {
          this.liveRole = {id: 'role-00001', name: 'liveRole'};
          this.streamingService.getLiveRole.returns(of(this.liveRole));
        });

        context('when the user is not a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(of(false));
          });

          it('does not call #updateMemberRoles', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
              toArray(),
              tap(() => expect(this.streamingService.updateMemberRoles).not.to.have.been.called),
            ).subscribe(() => done(), (error) => done(error));
          });
        });

        context('when the user is a streamer', function () {
          beforeEach(function () {
            this.streamingService.memberIsStreamer.returns(of(true));
          });

          it('calls #updateMemberRoles', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
              toArray(),
              tap(() => expect(this.streamingService.updateMemberRoles).to.have.been.called),
            ).subscribe(() => done(), (error) => done(error));
          });

          it('passes the new member to #updateMemberRoles', function (done) {
            this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
              toArray(),
              tap(() => expect(this.streamingService.updateMemberRoles).to.have.been.calledWith(this.newMember)),
            ).subscribe(() => done(), (error) => done(error));
          });

          context('when #updateMemberRoles raises an Discord "Missing Permissions" error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(DiscordAPIError);
              this.error.message = 'Missing Permissions';
              this.streamingService.memberIsStreamer.returns(throwError(this.error));
            });

            it('silences the error', function (done) {
              this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
                toArray(),
              ).subscribe(() => done(), (error) => done(error));
            });
          });

          context('when #updateMemberRoles raises an unknown Discord error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(DiscordAPIError);
              this.error.message = 'Example Error';
              this.streamingService.memberIsStreamer.returns(throwError(this.error));

              this.jasmine.handleError = sinon.fake.returns(EMPTY);
            });

            it('does not crash the stream', function (done) {
              this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
                toArray(),
                tap((emitted) => expect(emitted).to.deep.eq([])),
              ).subscribe(() => done(), (error) => done(error));
            });
          });

          context('when #updateMemberRoles raises an unknown error', function () {
            beforeEach(function () {
              this.error = sinon.createStubInstance(Error);
              this.error.message = 'Example Error';
              this.streamingService.memberIsStreamer.returns(throwError(this.error));

              this.jasmine.handleError = sinon.fake.returns(EMPTY);
            });

            it('lets chaos handle the error', function (done) {
              this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
                toArray(),
                tap(() => expect(this.jasmine.handleError).to.have.been.calledWith(this.error)),
              ).subscribe(() => done(), (error) => done(error));
            });

            it('does not crash the stream', function (done) {
              this.streamingService.handlePresenceUpdate(this.oldMember, this.newMember).pipe(
                toArray(),
              ).subscribe(() => done(), (error) => done(error));
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
      sinon.stub(this.streamingService, 'addLiveRoleToMember').returns(of(''));
      sinon.stub(this.streamingService, 'removeLiveRoleFromMember').returns(of(''));
    });

    it('calls #memberIsStreaming', function (done) {
      this.streamingService.updateMemberRoles(this.member).pipe(
        toArray(),
        tap(() => expect(this.streamingService.memberIsStreaming).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('passes the member to #memberIsStreaming', function (done) {
      this.streamingService.updateMemberRoles(this.member).pipe(
        toArray(),
        tap(() => expect(this.streamingService.memberIsStreaming).to.have.been.calledWith(this.member)),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when member is streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(true);
      });

      it('calls #addLiveRoleToMember', function (done) {
        this.streamingService.updateMemberRoles(this.member).pipe(
          toArray(),
          tap(() => expect(this.streamingService.addLiveRoleToMember).to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('passes the member to #addLiveRoleToMember', function (done) {
        this.streamingService.updateMemberRoles(this.member).pipe(
          toArray(),
          tap(() => expect(this.streamingService.addLiveRoleToMember).to.have.been.calledWith(this.member)),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when member is not streaming', function () {
      beforeEach(function () {
        this.streamingService.memberIsStreaming.returns(true);
      });

      it('calls #removeLiveRoleFromMember', function (done) {
        this.streamingService.updateMemberRoles(this.member).pipe(
          toArray(),
          tap(() => expect(this.streamingService.removeLiveRoleFromMember).to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('passes the member to #removeLiveRoleFromMember', function (done) {
        this.streamingService.updateMemberRoles(this.member).pipe(
          toArray(),
          tap(() => expect(this.streamingService.removeLiveRoleFromMember).to.have.been.calledWith(this.member)),
        ).subscribe(() => done(), (error) => done(error));
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
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      });

      it('does not emit anything', function (done) {
        this.streamingService.addLiveRoleToMember(this.member).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(of(this.liveRole));
      });

      context('when the user is missing the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.liveRole.id);
        });

        it('assigns the role to the member', function (done) {
          this.streamingService.addLiveRoleToMember(this.member).pipe(
            toArray(),
            tap(() => expect(this.member.addRole).to.have.been.calledWith(this.liveRole)),
          ).subscribe(() => done(), (error) => done(error));
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
        sinon.stub(this.streamingService, 'getLiveRole').returns(from([undefined]));
      });

      it('does not emit anything', function (done) {
        this.streamingService.removeLiveRoleFromMember(this.member).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there is a live role set', function () {
      beforeEach(function () {
        this.liveRole = {id: 'role-00001', name: 'liveRole'};
        sinon.stub(this.streamingService, 'getLiveRole').returns(of(this.liveRole));
      });

      context('when the user does not have the role', function () {
        it('does not emit anything', function (done) {
          this.streamingService.removeLiveRoleFromMember(this.member).pipe(
            toArray(),
            tap((emitted) => expect(emitted).to.deep.eq([])),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the user has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.liveRole.id, this.liveRole);
        });

        it('removes the role', function (done) {
          this.streamingService.removeLiveRoleFromMember(this.member).pipe(
            toArray(),
            tap(() => expect(this.member.removeRole).to.have.been.calledWith(this.liveRole)),
          ).subscribe(() => done(), (error) => done(error));
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
        this.streamingService.getLiveRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        this.streamingService.getLiveRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted.length).to.eq(1)),
        ).subscribe(() => done(), (error) => done(error));
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

        this.streamingService.setLiveRole(this.guild, this.role).pipe(
          toArray(),
          tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
            this.guild.id,
            DATAKEYS.LIVE_ROLE,
            this.role.id,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns the saved role', function (done) {
        this.streamingService.setLiveRole(this.guild, this.role).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        this.streamingService.setLiveRole(this.guild, null).pipe(
          toArray(),
          tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
            this.guild.id,
            DATAKEYS.LIVE_ROLE,
            null,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns undefined', function (done) {
        this.streamingService.setLiveRole(this.guild, null).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([undefined])),
        ).subscribe(() => done(), (error) => done(error));
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

      this.streamingService.removeLiveRole(this.guild, null).pipe(
        toArray(),
        tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
          this.guild.id,
          DATAKEYS.LIVE_ROLE,
          null,
        )),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when a previous role was set', function () {
      beforeEach(function (done) {
        this.role = {id: 'role-00001', name: 'test-role'};
        this.guild.roles.set(this.role.id, this.role);

        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, this.role.id)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        this.streamingService.removeLiveRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns the previously set role', function (done) {
        this.streamingService.removeLiveRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([undefined])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.LIVE_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('returns undefined', function (done) {
        this.streamingService.removeLiveRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([undefined])),
        ).subscribe(() => done(), (error) => done(error));
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
        sinon.stub(this.streamingService, 'getStreamerRole').returns(from([undefined]));
      });

      it('emits true', function (done) {
        this.streamingService.memberIsStreamer(this.member).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([true])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there is a streamer role set', function () {
      beforeEach(function () {
        this.streamerRole = {id: 'streamerRoleId', name: 'streamerRole'};
        sinon.stub(this.streamingService, 'getStreamerRole').returns(of(this.streamerRole));
      });

      context('when the member does not have the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.streamerRole.id);
        });

        it('emits false', function (done) {
          this.streamingService.memberIsStreamer(this.member).pipe(
            toArray(),
            tap((emitted) => expect(emitted).to.deep.eq([false])),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the member has the role', function () {
        beforeEach(function () {
          this.member.roles.set(this.streamerRole.id, this.streamerRole);
        });

        it('emits true', function (done) {
          this.streamingService.memberIsStreamer(this.member).pipe(
            toArray(),
            tap((emitted) => expect(emitted).to.deep.eq([true])),
          ).subscribe(() => done(), (error) => done(error));
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
        this.streamingService.getStreamerRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when there is no role set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('emits undefined', function (done) {
        this.streamingService.getStreamerRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted.length).to.eq(1)),
        ).subscribe(() => done(), (error) => done(error));
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

        this.streamingService.setStreamerRole(this.guild, this.role).pipe(
          toArray(),
          tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
            this.guild.id,
            DATAKEYS.STREAMER_ROLE,
            this.role.id,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns the saved role', function (done) {
        this.streamingService.setStreamerRole(this.guild, this.role).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when passed null', function () {
      it('saves null', function (done) {
        sinon.spy(this.jasmine, 'setGuildData');

        this.streamingService.setStreamerRole(this.guild, null).pipe(
          toArray(),
          tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
            this.guild.id,
            DATAKEYS.STREAMER_ROLE,
            null,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns undefined', function (done) {
        this.streamingService.setStreamerRole(this.guild, null).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([undefined])),
        ).subscribe(() => done(), (error) => done(error));
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

        this.streamingService.removeStreamerRole(this.guild).pipe(
          toArray(),
          tap(() => expect(this.jasmine.setGuildData).to.have.been.calledWith(
            this.guild.id,
            DATAKEYS.STREAMER_ROLE,
            null,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('returns the previously set role', function (done) {
        this.streamingService.removeStreamerRole(this.guild).pipe(
          toArray(),
          tap((emitted) => expect(emitted).to.deep.eq([this.role])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when a previous role was set, but no longer exists', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, 'role-00001')
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        this.streamingService.removeStreamerRole(this.guild).pipe(
          toArray(),
          catchError((error) => {
            expect(error).to.be.an.instanceOf(RoleNotFoundError);
            return EMPTY;
          }),
        ).subscribe(() => done(new Error("Expected an error to be thrown")), (error) => done(error), () => done());
      });
    });

    context('when a previous role was not set', function () {
      beforeEach(function (done) {
        this.jasmine.setGuildData(this.guild.id, DATAKEYS.STREAMER_ROLE, null)
          .subscribe(() => {}, (error) => done(error), () => done());
      });

      it('throws a RoleNotFoundError', function (done) {
        this.streamingService.removeStreamerRole(this.guild).pipe(
          toArray(),
          catchError((error) => {
            expect(error).to.be.an.instanceOf(RoleNotFoundError);
            return EMPTY;
          }),
        ).subscribe(() => done(new Error("Expected an error to be thrown")), (error) => done(error), () => done());
      });
    });
  });
});
