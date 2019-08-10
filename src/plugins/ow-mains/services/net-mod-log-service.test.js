const Discord = require('discord.js');
const {toArray, tap} = require('rxjs/operators');

const DataKeys = require('../datakeys');

describe('NetModLogService', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.jasmine.handleError = (error, embedFields) => {
      error.embedFields = embedFields;
      throw error;
    };

    this.netModLogService = this.jasmine.getService('owmains', 'NetModLogService');

    this.owmnGuild = {
      id: Discord.SnowflakeUtil.generate(),
      channels: new Discord.Collection(),
    };
    this.jasmine.config.owmnServerId = this.owmnGuild.id;
    this.jasmine.discord.guilds.set(this.owmnGuild.id, this.owmnGuild);
  });

  describe('#handleGuildBanAdd', function () {
    beforeEach(function () {
      this.guild = {
        id: Discord.SnowflakeUtil.generate(),
        name: 'Other guild',

        member: (user) => ({
          id: user.id,
          guild: this.owmnGuild,
          user: user,

          hasPermission: () => true,
        }),

        fetchAuditLogs: () => {
          const logs = {
            entries: new Discord.Collection(),
          };

          const entry = {
            id: Discord.SnowflakeUtil.generate(),
            reason: "A Reason",
            target: this.bannedMember,
            executor: {
              id: Discord.SnowflakeUtil.generate(),
              tag: "modUser#0001",
              guild: this.guild,
            },
          };
          logs.entries.set(entry.id, entry);

          return Promise.resolve(logs);
        },
      };

      this.bannedMember = {
        id: Discord.SnowflakeUtil.generate(),
        tag: "banned#0001",
        guild: this.guild,
      };
    });

    context('when the network mod log is enabled', function () {
      beforeEach(function (done) {
        this.modLogChannel = {
          id: Discord.SnowflakeUtil.generate(),
          guild: this.owmnGuild,
          send: () => Promise.resolve({}),
        };
        this.owmnGuild.channels.set(this.modLogChannel.id, this.modLogChannel);

        this.jasmine.setGuildData(this.owmnGuild.id, DataKeys.netModLogChannelId, this.modLogChannel.id)
          .subscribe(() => done(), (error) => done(error));
      });

      it('Adds a log entry', function (done) {
        sinon.spy(this.modLogChannel, 'send');

        this.netModLogService.handleGuildBanAdd(this.guild, this.bannedMember).pipe(
          toArray(),
          tap(() => expect(this.modLogChannel.send).to.have.been.calledOnce),
          tap(() => expect(this.modLogChannel.send.firstCall.args).to.containSubset([
            {
              embed: {
                author: {
                  name: "banned#0001 banned from Other guild",
                },
                description: `User ID: ${this.bannedMember.id}\nReason: A Reason`,
              },
            },
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });

      context('when the audit logs can not be read', function () {
        beforeEach(function () {
          this.guild.member = (user) => ({
            id: user.id,
            guild: this.owmnGuild,
            user: user,

            hasPermission: (flag) => {
              return flag !== Discord.Permissions.FLAGS.VIEW_AUDIT_LOG;
            },
          });
        });

        it('Adds an error to the log entry', function (done) {
          sinon.spy(this.modLogChannel, 'send');

          this.netModLogService.handleGuildBanAdd(this.guild, this.bannedMember).pipe(
            toArray(),
            tap(() => expect(this.modLogChannel.send).to.have.been.calledOnce),
            tap(() => expect(this.modLogChannel.send.firstCall.args).to.containSubset([
              {
                embed: {
                  author: {
                    name: "banned#0001 banned from Other guild",
                  },
                  description:
                    `User ID: ${this.bannedMember.id}\n` +
                    `Reason: ERROR: Unable to view audit log. I need the 'View Audit Log' permission in 'Other guild'`,
                },
              },
            ])),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });

  describe('#handleGuildBanRemove', function () {
    beforeEach(function () {
      this.guild = {
        id: Discord.SnowflakeUtil.generate(),
        name: 'Other guild',

        member: (user) => ({
          id: user.id,
          guild: this.owmnGuild,
          user: user,

          hasPermission: () => true,
        }),
      };

      this.bannedMember = {
        id: Discord.SnowflakeUtil.generate(),
        tag: "banned#0001",
        guild: this.guild,
      };
    });

    context('when the network mod log is enabled', function () {
      beforeEach(function (done) {
        this.modLogChannel = {
          id: Discord.SnowflakeUtil.generate(),
          guild: this.owmnGuild,
          send: () => Promise.resolve({}),
        };
        this.owmnGuild.channels.set(this.modLogChannel.id, this.modLogChannel);

        this.jasmine.setGuildData(this.owmnGuild.id, DataKeys.netModLogChannelId, this.modLogChannel.id)
          .subscribe(() => done(), (error) => done(error));
      });

      it('Adds a log entry', function (done) {
        sinon.spy(this.modLogChannel, 'send');

        this.netModLogService.handleGuildBanRemove(this.guild, this.bannedMember).pipe(
          toArray(),
          tap(() => expect(this.modLogChannel.send).to.have.been.calledOnce),
          tap(() => expect(this.modLogChannel.send.firstCall.args).to.containSubset([
            {
              embed: {
                author: {
                  name: "banned#0001 unbanned from Other guild",
                },
                description: `User ID: ${this.bannedMember.id}`,
              },
            },
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
