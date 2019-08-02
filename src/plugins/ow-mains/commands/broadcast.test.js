const Discord = require('discord.js');
const {range, EMPTY} = require('rxjs');
const {tap, map, last, delayWhen} = require('rxjs/operators');

describe('owmains: !broadcast', function () {
  beforeEach(function (done) {
    this.jasmine = stubJasmine();

    const OwmnService = this.jasmine.getService('owmains', 'OwmnService');
    const PermissionsService = this.jasmine.getService('core', 'PermissionsService');

    this.test$ = this.jasmine.testCommand({
      pluginName: 'owmains',
      commandName: 'broadcast',
    });

    this.test$.message.guild.id = OwmnService.owmnServerId;
    this.test$.message.member.displayName = "Test User";

    PermissionsService.addUser(this.test$.message.guild, 'broadcaster', this.test$.message.member)
      .subscribe(() => done(), (error) => done(error));
  });

  context('when the user does not have broadcaster permissions', function () {
    beforeEach(function (done) {
      const PermissionsService = this.jasmine.getService('core', 'PermissionsService');
      PermissionsService.removeUser(this.test$.message.guild, 'broadcaster', this.test$.message.member)
        .subscribe(() => done(), (error) => done(error));
    });

    it('does not run the command', function (done) {
      const command = this.jasmine.getCommand('broadcast');
      sinon.spy(command, 'run');

      this.test$.pipe(
        tap(() => expect(command.run).not.to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('when the server is not the OWMN server', function () {
    beforeEach(function (done) {
      this.test$.message.guild.id = Discord.SnowflakeUtil.generate();

      // Re-grant permission as the server id changed
      const PermissionsService = this.jasmine.getService('core', 'PermissionsService');
      PermissionsService.addUser(this.test$.message.guild, 'broadcaster', this.test$.message.member)
        .subscribe(() => done(), (error) => done(error));
    });

    it('does nothing', function (done) {
      this.test$.pipe(
        tap((response) => expect(response.replies.length).to.eq(0)),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!broadcast', function () {
    it('replies with a help message', function (done) {
      const command = this.jasmine.getCommand('broadcast');
      sinon.spy(command, 'run');

      this.test$.pipe(
        tap((response) => expect(response.replies.length).to.eq(1)),
        tap((response) => expect(response.replies[0]).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!broadcast {type}', function () {
    beforeEach(function () {
      this.test$.args.type = "network";
    });

    it('replies with a help message', function (done) {
      const command = this.jasmine.getCommand('broadcast');
      sinon.spy(command, 'run');

      this.test$.pipe(
        tap((response) => expect(response.replies.length).to.eq(1)),
        tap((response) => expect(response.replies[0]).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('!broadcast {type} {message}', function () {
    beforeEach(function () {
      this.test$.args.type = "network";
      this.test$.args.message = "This is a test message";

      this.confirmYesEmoji = {
        id: Discord.SnowflakeUtil.generate(),
        name: "VoteYea",
      };
      this.confirmNoEmoji = {
        id: Discord.SnowflakeUtil.generate(),
        name: "VoteNay",
      };

      this.guild = this.test$.message.guild;
      this.guild.emojis = new Discord.Collection();
      this.guild.emojis.set(this.confirmYesEmoji.id, this.confirmYesEmoji);
      this.guild.emojis.set(this.confirmNoEmoji.id, this.confirmNoEmoji);

      this.confirmMessage = {
        guild: this.guild,
        react: () => Promise.resolve(),
        awaitReactions: () => Promise.resolve([]),
        reactions: new Discord.Collection(),
      };

      this.channel = this.test$.message.channel;
      this.channel.send = (message) => {
        switch (message) {
          case `Broadcast this to "network"?`:
            return Promise.resolve(this.confirmMessage);
          default:
            return Promise.resolve({content: message});
        }
      };
    });

    context('when the message type is unknown', function () {
      beforeEach(function () {
        this.test$.args.type = "foobar";
      });

      it('replies with an error message', function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies.length).to.eq(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
            content: "Broadcast type foobar is not valid. Valid types: blizzard, network, esports",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    it('runs the command', function (done) {
      const command = this.jasmine.getCommand('broadcast');
      sinon.stub(command, 'run').returns(EMPTY);

      this.test$.pipe(
        tap(() => expect(command.run).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    it('sends a confirmation message', function (done) {
      sinon.spy(this.channel, 'send');
      sinon.spy(this.confirmMessage, 'react');

      this.test$.pipe(
        tap(() => expect(this.channel.send)
          .to.have.been.calledWith('Broadcast this to "network"?')),
        tap(() => expect(this.confirmMessage.react)
          .to.have.been.calledWith(this.confirmYesEmoji)),
        tap(() => expect(this.confirmMessage.react)
          .to.have.been.calledWith(this.confirmNoEmoji)),
      ).subscribe(() => done(), (error) => done(error));
    });

    it("waits for the message to be confirmed", function (done) {
      sinon.spy(this.confirmMessage, 'awaitReactions');

      this.test$.pipe(
        tap(() => expect(this.confirmMessage.awaitReactions).to.have.been.called),
      ).subscribe(() => done(), (error) => done(error));
    });

    context('when the confirmation is canceled', function () {
      beforeEach(function () {
        this.confirmMessage.awaitReactions = () => Promise.resolve([
          {emoji: this.confirmNoEmoji},
        ]);
      });

      it('does not broadcast the message', function (done) {
        const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
        sinon.stub(BroadcastService, 'broadcastMessage');

        this.test$.pipe(
          tap(() => expect(BroadcastService.broadcastMessage).not.to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('replies that the broadcast was canceled', function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies.length).to.eq(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
            content: "Ok. Broadcast canceled",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the confirmation is accepted', function () {
      beforeEach(function () {
        this.confirmMessage.awaitReactions = () => Promise.resolve([
          {emoji: this.confirmYesEmoji},
        ]);
      });

      it('broadcasts the message', function (done) {
        const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
        sinon.spy(BroadcastService, 'broadcastMessage');

        this.test$.pipe(
          tap(() => expect(BroadcastService.broadcastMessage).to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('replies that it will broadcast', function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies[0]).to.containSubset({
            content: "Ok, let me broadcast that then.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });

      context('when no servers are subscribed', function () {
        it('replies that there were no broadcasts', function (done) {
          this.test$.pipe(
            tap((response) => expect(response.replies[1]).to.containSubset({
              content: "Done. Broadcasted to 0 servers",
            })),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when servers have subscribed channels', function () {
        beforeEach(function (done) {
          const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
          this.subbedChannels = [];

          range(0, 3).pipe(
            map((index) => ({
              id: Discord.SnowflakeUtil.generate(),
              name: `Guild ${index}`,
              channels: new Discord.Collection(),
            })),
            map((guild) => ({
              id: Discord.SnowflakeUtil.generate(),
              name: "broadcasts",
              send: () => Promise.resolve(),
              guild,
              permissionsFor: () => ({
                has: () => true,
              }),
            })),
            tap((channel) => channel.guild.channels.set(channel.id, channel)),
            tap((channel) => this.jasmine.discord.guilds.set(channel.guild.id, channel.guild)),
            delayWhen((channel) => BroadcastService.setBroadcastChannel(
              channel.guild,
              "network",
              channel,
            )),
            tap((channel) => this.subbedChannels.push(channel)),
            last(),
          ).subscribe(() => done(), (error) => done(error));
        });

        it('replies that there were broadcasts', function (done) {
          this.test$.pipe(
            tap((response) => expect(response.replies[1]).to.containSubset({
              content: "Done. Broadcasted to 3 servers",
            })),
          ).subscribe(() => done(), (error) => done(error));
        });

        it('broadcasts to each server', function (done) {
          this.subbedChannels.forEach((channel) => {
            sinon.spy(channel, 'send');
          });

          this.test$.pipe(
            tap(() => {
              this.subbedChannels.forEach((channel) => {
                expect(channel.send).to.have.been.calledWith(
                  "This is a test message\n" +
                  "*- Test User*",
                );
              });
            }),
          ).subscribe(() => done(), (error) => done(error));
        });
      });
    });

    context('when the type is "blizzard"', function () {
      beforeEach(function () {
        this.test$.args.type = 'blizzard';
      });

      it("requires a link", function (done) {
        this.test$.pipe(
          tap((response) => expect(response.replies.length).to.eq(1)),
          tap((response) => expect(response.replies[0]).to.containSubset({
            content: "A link is required for Blizzard broadcasts.",
          })),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('does not send a confirmation message', function (done) {
        sinon.spy(this.channel, 'send');

        this.test$.pipe(
          tap(() => expect(this.channel.send)
            .not.to.have.been.calledWith('Broadcast this to "blizzard"?')),
        ).subscribe(() => done(), (error) => done(error));
      });

      it('does not broadcast the message', function (done) {
        const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
        sinon.stub(BroadcastService, 'broadcastMessage');

        this.test$.pipe(
          tap(() => expect(BroadcastService.broadcastMessage).not.to.have.been.called),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
