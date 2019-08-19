const Discord = require('discord.js');
const {of} = require('rxjs');
const {flatMap, tap} = require('rxjs/operators');

describe('ow-info: !region', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();
    this.test$ = this.jasmine.testCommand({
      pluginName: 'ow-info',
      commandName: 'region',
    });

    this.message = this.test$.message;

    const pluginService = this.jasmine.getService('core', 'PluginService');

    of('').pipe(
      flatMap(() => this.jasmine.emit("guildCreate", this.message.guild)),
      flatMap(() => pluginService.enablePlugin(this.message.guild.id, 'ow-info')),
    ).subscribe(() => done(), (error) => done(error));
  });

  describe('!region', function () {
    it('responds with an error message', function (done) {
      sinon.spy(this.message.channel, "send");

      this.test$.pipe(
        tap(() => expect(this.message.channel.send).to.have.been.calledWith(
          `I'm sorry, but I'm missing some information for that command:`,
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe("!region {region}", function () {
    beforeEach(function () {
      this.test$.args.region = `test`;
    });

    context('when the region is mapped to a role', function () {
      beforeEach(function (done) {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        let regionService = this.jasmine.getService('ow-info', 'RegionService');
        regionService.mapRegion(this.message.guild, 'test', this.role)
          .subscribe(() => done(), (error) => done(error));
      });

      it('gives a success message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies).to.containSubset([
            {
              type: 'reply',
              content: 'I\'ve updated your region to test',
            },
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('adds the role to the user', function (done) {
        sinon.spy(this.message.member, "addRole");

        this.test$.pipe(
          tap(() => expect(this.message.member.addRole).to.have.been.calledWith(
            this.role.id,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the region is not mapped to a role', function () {
      it('returns an error message', function (done) {
        sinon.spy(this.message.channel, "send");
        sinon.spy(this.message.member, "addRole");

        this.test$.pipe(
          tap(() => expect(this.message.channel.send).to.have.been.calledWith(
            'I\'m sorry, but \'test\' is not an available region.',
          )),
          tap(() => expect(this.message.member.addRole).not.to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });

  describe("!region {regionAlias}", function () {
    beforeEach(function () {
      this.test$.args.region = `testAlias`;
    });

    context('when the alias is mapped to a region', function () {
      beforeEach(function (done) {
        this.role = {
          id: Discord.SnowflakeUtil.generate(),
          name: 'testRole',
        };
        this.message.guild.roles.set(this.role.id, this.role);

        let regionService = this.jasmine.getService('ow-info', 'RegionService');
        of('').pipe(
          flatMap(() => regionService.mapRegion(this.message.guild, 'test', this.role)),
          flatMap(() => regionService.mapAlias(this.message.guild, 'testAlias', 'test')),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('gives a success message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies).to.have.length(1)),
          tap((response) => expect(response.replies).to.containSubset([
            {
              type: 'reply',
              content: 'I\'ve updated your region to test',
            },
          ])),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('adds the role to the user', function (done) {
        sinon.spy(this.message.member, "addRole");

        this.test$.pipe(
          tap(() => expect(this.message.member.addRole).to.have.been.calledWith(
            this.role.id,
          )),
        ).subscribe(() => done(), (error) => done(error));
      });

      context('when the user was not cached by Discord.js', function () {
        beforeEach(function () {
          this.test$.args.region = `test`;

          this.member = this.message.member;
          this.message.guild.fetchMember = () => Promise.resolve(this.member);
          delete this.message.member;
        });

        it('fetches the member and works normally', function (done) {
          sinon.spy(this.member.guild, 'fetchMember');
          sinon.spy(this.message, 'reply');

          this.test$.pipe(
            tap(() => expect(this.message.guild.fetchMember).to.have.been.calledWith(
              this.message.author,
            )),
            tap((response) => expect(response.replies).to.have.length(1)),
            tap((response) => expect(response.replies).to.containSubset([
              {
                type: 'reply',
                content: 'I\'ve updated your region to test',
              },
            ])),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });
  });
});
