const Rx = require('rx');
const Service = require('chaos-core').Service;

const {
  RuleNotFoundError,
} = require("../errors");
const {
  DATAKEYS,
  AUTO_BAN_RULES,
} = require('../utility');

class AutoBanService extends Service {
  constructor(props) {
    super(props);

    this.rules = [
      {
        name: AUTO_BAN_RULES.BAN_DISCORD_INVITE,
        test: (member) => {
          let hasLink = this.memberNameMatches(member, /discord\.gg[/\\]/i);
          this.chaos.logger.debug(`${member.user.tag} has Discord invite in name: ${hasLink}`);
          return hasLink;
        },
        reason: "Username contains or was changed to a Discord invite",
      },
      {
        name: AUTO_BAN_RULES.BAN_TWITCH_LINK,
        test: (member) => {
          let hasLink = this.memberNameMatches(member, /twitch\.tv[/\\]/i);
          this.chaos.logger.debug(`${member.user.tag} has Twitch link in name: ${hasLink}`);
          return hasLink;
        },
        reason: "Username contains or was changed to a Twitch link",
      },
    ];
  }

  onListen() {
    this.chaos.streams.guildMemberAdd$
      .flatMap((member) => this.handleGuildMemberAdd(member))
      .subscribe();

    this.chaos.streams.guildMemberUpdate$
      .flatMap(([oldMember, newMember]) => this.handleGuildMemberUpdate(oldMember, newMember))
      .subscribe();
  }

  handleGuildMemberAdd(member) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.doAutoBans(member))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberAdd$"},
          {name: "Member", value: member.toString()},
          {name: "Guild", value: member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  handleGuildMemberUpdate(oldMember, newMember) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.doAutoBans(newMember))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "AutoBanService"},
          {name: "Hook", value: "guildMemberUpdate$"},
          {name: "Member", value: error.member.toString()},
          {name: "Guild", value: error.member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  getAutoBanRule(rule) {
    let foundRule = Object.values(AUTO_BAN_RULES).find((r) => r.toLowerCase() === rule.toLowerCase());
    if (!foundRule) {
      return new RuleNotFoundError(rule);
    }
    return foundRule;
  }

  setAutoBansEnabled(guild, newValue) {
    return this.chaos
      .setGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED, newValue);
  }

  setAutoBanRule(guild, rule, newValue) {
    rule = this.getAutoBanRule(rule);

    return this.chaos
      .setGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule), newValue)
      .map((enabled) => ([rule, enabled]));
  }
  
  doAutoBans(member) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.isAutoBanEnabled(member.guild).filter(Boolean))
      .do(() => this.chaos.logger.info(`Checking if ${member.user.tag} should be auto banned...`))
      .flatMap(() => Rx.Observable.from(this.rules))
      .flatMap((rule) => this.runRule(rule, member))
      .filter((reason) => reason)
      .take(1)
      .do((reason) => this.chaos.logger.info(`Auto banning ${member.user.tag}; reason: ${reason}`))
      .flatMap((reason) =>
        member.guild.ban(member, {
          days: 1,
          reason: `[AutoBan] ${reason}`,
        }),
      );
  }

  runRule(rule, member) {
    return Rx.Observable
      .of('')
      .flatMap(() => this.isAutoBanRuleEnabled(member.guild, rule.name))
      .filter(Boolean)
      .filter(() => rule.test(member))
      .map(() => rule.reason);
  }

  isAutoBanEnabled(guild) {
    return this.chaos
      .getGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED);
  }

  isAutoBanRuleEnabled(guild, rule) {
    rule = this.getAutoBanRule(rule);

    return this.chaos
      .getGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule));
  }

  getRules(guild) {
    return Rx.Observable
      .from(Object.values(AUTO_BAN_RULES))
      .flatMap((rule) => this.isAutoBanRuleEnabled(guild, rule).map((enabled) => [rule, enabled]))
      .reduce((rules, [rule, enabled]) => {
        rules[rule] = enabled;
        return rules;
      }, {});
  }

  memberNameMatches(member, regex) {
    // check username
    let usernameHasLink = !!member.user.username.match(regex);

    // check nickname if there is one
    let nicknameHasLink = false;
    if (member.nickname) {
      nicknameHasLink = !!member.nickname.match(regex);
    }

    return usernameHasLink || nicknameHasLink;
  }
}

module.exports = AutoBanService;
