const Discord = require('discord.js');
const {of} = require('rxjs');
const {tap} = require('rxjs/operators');

describe('streaming: !config streaming setLiveRole', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'streaming',
      actionName: 'setLiveRole',
    });

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('#run', function () {
    context('when role is missing', function () {
      it('returns a user readable error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `I'm sorry, but I'm missing some information for that command:`,
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the role can not be found', function () {
      beforeEach(function () {
        this.test$.args.role = "role-not-found";
      });

      it('returns a user readable error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `The role 'role-not-found' could not be found.`,
          })),
        ).subscribe(() => done(), (error) => done(error));
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
        this.test$.message.guild.roles = new Discord.Collection();
        this.test$.message.guild.roles.set(this.role.id, this.role);
      });

      Object.entries({
        'when a role is given as a mention': `<@${roleId}>`,
        'when a role is given as a mention (with &)': `<@&${roleId}>`,
        'when a role is given as an id': roleId,
        'when a role is given as a name': roleName,
      }).forEach(([contextMsg, value]) => {
        context(contextMsg, function () {
          beforeEach(function () {
            this.test$.args.role = value;
            this.streamingService.setLiveRole = () => of(this.role);
          });

          it('sets the live role to the correct role', function (done) {
            sinon.spy(this.streamingService, 'setLiveRole');

            this.test$.pipe(
              tap(() => expect(this.streamingService.setLiveRole).to.have.been.calledWith(this.test$.message.guild, this.role)),
            ).subscribe(() => done(), (error) => done(error));
          });

          it('returns a success message', function (done) {
            this.test$.pipe(
              tap((response) => expect(response).to.containSubset({
                status: 200,
                content: `Live streamers will now be given the ${this.role.name} role.`,
              })),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});
