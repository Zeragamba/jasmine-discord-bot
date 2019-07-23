const {of} = require('rxjs');
const {tap} = require('rxjs/operators');

describe('streaming: !config streaming setStreamerRole', function () {
  beforeEach(function () {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testConfigAction({
      pluginName: 'streaming',
      actionName: 'setStreamerRole',
    });

    this.streamingService = this.jasmine.getService('streaming', 'StreamingService');
  });

  describe('#run', function () {
    context('when role is missing', function () {
      it('returns a user readable error', function (done) {
        this.test$.pipe(
          tap((response) => expect(response).to.containSubset({
            status: 400,
            content: `A role to watch is required`,
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
        this.test$.message.guild.roles.set(this.role.id, this.role);
      });

      Object.entries({
        'a mention': `<@${roleId}>`,
        'a mention (with &)': `<@&${roleId}>`,
        'an id': roleId,
        'a name': roleName,
      }).forEach(([inputType, value]) => {
        context(`when a role is given as ${inputType}`, function () {
          beforeEach(function () {
            this.test$.args.role = value;
            sinon.stub(this.streamingService, 'setStreamerRole')
              .returns(of(this.role));
          });

          it('sets the live role to the correct role', function (done) {
            this.test$.pipe(
              tap(() => expect(this.streamingService.setStreamerRole).to.have.been.calledWith(this.test$.message.guild, this.role)),
            ).subscribe(() => done(), (error) => done(error));
          });

          it('returns a success message', function (done) {
            this.test$.pipe(
              tap((response) => expect(response).to.containSubset({
                status: 200,
                content: `I will now only give the live role to users with the ${this.role.name} role`,
              })),
            ).subscribe(() => done(), (error) => done(error));
          });
        });
      });
    });
  });
});
