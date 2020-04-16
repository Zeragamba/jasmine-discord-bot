const Discord = require('discord.js');
const {range} = require('range');
const {MockMessage} = require("chaos-core").test.discordMocks;

describe('owmains: !broadcast', function () {
  beforeEach(async function () {
    this.jasmine = stubJasmine();
    this.message = new MockMessage();

    this.message.member.displayName = "Test User";
    this.message.guild.id = this.jasmine.getService('owmains', 'OwmnService')
      .owmnServerId;

    await this.jasmine.listen();
    await this.jasmine.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'owmains');
    await this.jasmine.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'broadcaster', this.message.member);
  });
  describe('!broadcast', function () {
    beforeEach(function () {
      this.message.content = '!broadcast';
    });

    context('when the user does not have broadcaster permissions', function () {
      beforeEach(async function () {
        await this.jasmine.getService('core', 'PermissionsService')
          .removeUser(this.message.guild, 'broadcaster', this.message.member);
      });

      it('does not run the command', async function () {
        const command = this.jasmine.getCommand('broadcast');
        sinon.spy(command, 'run');

        await this.jasmine.testMessage(this.message);
        expect(command.run).not.to.have.been.called;
      });
    });

    context('when the server is not the OWMN server', function () {
      beforeEach(async function () {
        this.message.guild.id = Discord.SnowflakeUtil.generate();

        // Re-grant permission as the server id changed
        await this.jasmine.getService('core', 'PermissionsService')
          .addUser(this.message.guild, 'broadcaster', this.message.member);
      });

      it('does nothing', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses.length).to.eq(0);
      });
    });

    it('replies with a help message', async function () {
      const command = this.jasmine.getCommand('broadcast');
      sinon.spy(command, 'run');

      const responses = await this.jasmine.testMessage(this.message);
      expect(responses.length).to.eq(1);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
      });
    });
  });

  describe('!broadcast {type}', function () {
    beforeEach(function () {
      this.message.content = '!broadcast network';
    });

    it('replies with a help message', async function () {
      const command = this.jasmine.getCommand('broadcast');
      sinon.spy(command, 'run');

      const responses = await this.jasmine.testMessage(this.message);
      expect(responses.length).to.eq(1);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
      });
    });
  });

  describe('!broadcast {type} {message}', function () {
    beforeEach(function () {
      this.message.content = '!broadcast network This is a test message';

      this.confirmYesEmoji = {
        id: Discord.SnowflakeUtil.generate(),
        name: "VoteYea",
      };
      this.confirmNoEmoji = {
        id: Discord.SnowflakeUtil.generate(),
        name: "VoteNay",
      };

      this.guild = this.message.guild;
      this.guild.emojis = new Discord.Collection();
      this.guild.emojis.set(this.confirmYesEmoji.id, this.confirmYesEmoji);
      this.guild.emojis.set(this.confirmNoEmoji.id, this.confirmNoEmoji);

      this.confirmMessage = {
        guild: this.guild,
        react: () => Promise.resolve(),
        awaitReactions: () => Promise.resolve([]),
        reactions: new Discord.Collection(),
      };

      this.channel = this.message.channel;
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
        this.message.content = '!broadcast foobar This is a test message';
      });

      it('replies with an error message', async function () {
        const responses = await this.jasmine.testMessage(this.message);
        expect(responses.length).to.eq(1);
        expect(responses[0]).to.containSubset({
          content: "Broadcast type foobar is not valid. Valid types: blizzard, network, esports",
        });
      });
    });

    context('when the message type is valid', function () {
      beforeEach(function () {
        this.message.content = '!broadcast network This is a test message';
      });

      it('sends a confirmation message', async function () {
        sinon.spy(this.channel, 'send');
        sinon.spy(this.confirmMessage, 'react');

        await this.jasmine.testMessage(this.message);
        expect(this.channel.send)
          .to.have.been.calledWith('Broadcast this to "network"?');
        expect(this.confirmMessage.react)
          .to.have.been.calledWith(this.confirmYesEmoji);
        expect(this.confirmMessage.react)
          .to.have.been.calledWith(this.confirmNoEmoji);
      });

      it("waits for the message to be confirmed", async function () {
        sinon.spy(this.confirmMessage, 'awaitReactions');

        await this.jasmine.testMessage(this.message);
        expect(this.confirmMessage.awaitReactions).to.have.been.called;
      });

      context('when the confirmation is canceled', function () {
        beforeEach(function () {
          this.confirmMessage.awaitReactions = () => Promise.resolve([
            {emoji: this.confirmNoEmoji},
          ]);
        });

        it('does not broadcast the message', async function () {
          const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
          sinon.stub(BroadcastService, 'broadcastMessage');

          await this.jasmine.testMessage(this.message);
          expect(BroadcastService.broadcastMessage).not.to.have.been.called;
        });

        it('replies that the broadcast was canceled', async function () {
          const responses = await this.jasmine.testMessage(this.message);
          expect(responses.length).to.eq(1);
          expect(responses[0]).to.containSubset({
            content: "Ok. Broadcast canceled",
          });
        });
      });

      context('when the confirmation is accepted', function () {
        beforeEach(function () {
          this.confirmMessage.awaitReactions = () => Promise.resolve([
            {emoji: this.confirmYesEmoji},
          ]);
        });

        it('broadcasts the message', async function () {
          const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
          sinon.spy(BroadcastService, 'broadcastMessage');

          await this.jasmine.testMessage(this.message);
          expect(BroadcastService.broadcastMessage).to.have.been.called;
        });

        it('replies that it will broadcast', async function () {
          const responses = await this.jasmine.testMessage(this.message);
          expect(responses[0]).to.containSubset({
            content: "Ok, let me broadcast that then.",
          });
        });

        context('when no servers are subscribed', function () {
          it('replies that there were no broadcasts', async function () {
            const responses = await this.jasmine.testMessage(this.message);
            expect(responses[1]).to.containSubset({
              content: "Done. Broadcasted to 0 servers",
            });
          });
        });

        context('when servers have subscribed channels', function () {
          beforeEach(async function () {
            const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
            this.subbedChannels = [];
            this.guilds = range(0, 3).map((index) => ({
              id: Discord.SnowflakeUtil.generate(),
              name: `Guild ${index}`,
              channels: new Discord.Collection(),
            }));

            this.channels = this.guilds.map((guild) => ({
              id: Discord.SnowflakeUtil.generate(),
              name: "broadcasts",
              send: () => Promise.resolve(),
              guild,
              permissionsFor: () => ({
                has: () => true,
              }),
            }));

            for (const channel of this.channels) {
              channel.guild.channels.set(channel.id, channel);
              this.jasmine.discord.guilds.set(channel.guild.id, channel.guild);
              this.subbedChannels.push(channel);

              await BroadcastService.setBroadcastChannel(channel.guild, "network", channel);
            }
          });

          it('replies that there were broadcasts', async function () {
            const responses = await this.jasmine.testMessage(this.message);
            expect(responses[1]).to.containSubset({
              content: "Done. Broadcasted to 3 servers",
            });
          });

          it('broadcasts to each server', async function () {
            this.subbedChannels.forEach((channel) => {
              sinon.spy(channel, 'send');
            });

            await this.jasmine.testMessage(this.message);
            this.subbedChannels.forEach((channel) => {
              expect(channel.send).to.have.been.calledWith(
                "This is a test message\n" +
                "*- Test User*",
              );
            });
          });
        });
      });

      context('when the type is "blizzard"', function () {
        beforeEach(function () {
          this.message.content = '!broadcast blizzard This is a test message';
        });

        it("requires a link", async function () {
          const responses = await this.jasmine.testMessage(this.message);
          expect(responses.length).to.eq(1);
          expect(responses[0]).to.containSubset({
            content: "A link is required for Blizzard broadcasts.",
          });
        });

        it('does not send a confirmation message', async function () {
          sinon.spy(this.channel, 'send');

          await this.jasmine.testMessage(this.message);
          expect(this.channel.send)
            .not.to.have.been.calledWith('Broadcast this to "blizzard"?');
        });

        it('does not broadcast the message', async function () {
          const BroadcastService = this.jasmine.getService('owmains', 'BroadcastService');
          sinon.stub(BroadcastService, 'broadcastMessage');

          await this.jasmine.testMessage(this.message);
          expect(BroadcastService.broadcastMessage).not.to.have.been.called;
        });
      });
    });
  });
});
