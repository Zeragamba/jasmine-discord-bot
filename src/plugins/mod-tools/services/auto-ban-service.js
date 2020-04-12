const Service = require('chaos-core').Service;

const {RuleNotFoundError} = require("../errors");
const {DATAKEYS, AUTO_BAN_RULES} = require('../utility');

class AutoBanService extends Service {
  rules = [
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

  constructor(chaos) {
    super(chaos);

    this.chaos.on('guildMemberAdd', async (member) => {
      await this.doAutoBans(member);
    });

    this.chaos.on('guildMemberUpdate', async ([_oldMember, newMember]) => {
      await this.doAutoBans(newMember);
    });
  }

  getAutoBanRule(rule) {
    let foundRule = Object.values(AUTO_BAN_RULES).find((r) => r.toLowerCase() === rule.toLowerCase());
    if (!foundRule) {
      throw new RuleNotFoundError(rule);
    }
    return foundRule;
  }

  async setAutoBansEnabled(guild, newValue) {
    return this.setGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED, newValue);
  }

  async setAutoBanRule(guild, rule, newValue) {
    rule = this.getAutoBanRule(rule);
    return this.setGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule), newValue);
  }

  async doAutoBans(member) {
    if (await this.isAutoBanEnabled(member.guild)) {
      this.chaos.logger.info(`Checking if ${member.user.tag} should be auto banned...`);
      const reasons = await Promise.all(this.rules.map((rule) => this.runRule(rule, member)))
        .then((reasons) => reasons.filter((reason) => reason !== ''));

      if (reasons.length >= 1) {
        this.chaos.logger.info(`Auto banning ${member.user.tag}; reasons: ${reasons.join(',')}`);
        await member.guild.ban(member, {reason: `[AutoBan] ${reasons.join('; ')}`});
      }
    }
  }

  async runRule(rule, member) {
    if (await this.isAutoBanRuleEnabled(member.guild, rule.name) && rule.test(member)) {
      return rule.reason;
    }
  }

  async isAutoBanEnabled(guild) {
    return this.getGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED)
      .then((enabled) => (typeof enabled === "undefined" ? false : enabled));
  }

  async isAutoBanRuleEnabled(guild, rule) {
    rule = this.getAutoBanRule(rule);
    return this.getGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule));
  }

  async getRules(guild) {
    const rules = {};
    for (const rule of Object.values(AUTO_BAN_RULES)) {
      rules[rule] = await this.isAutoBanRuleEnabled(guild, rule);
    }
    return rules;
  }

  memberNameMatches(member, regex) {
    const names = [
      member.user.username,
      member.nickname,
    ];

    return names
      .filter((name) => name)
      .some((name) => name.match(regex));
  }
}

module.exports = AutoBanService;
