const Service = require('chaos-core').Service;

const {RuleNotFoundError} = require("../../mod-tools/errors");
const DATAKEYS = require('../datakeys');
const AUTO_BAN_RULES = require('../rules');

class AutoBanService extends Service {
  rules = Object.values(AUTO_BAN_RULES);

  constructor(chaos) {
    super(chaos);

    this.chaos.on('guildMemberAdd', async (member) => {
      await this.doAutoBans(member);
    });

    this.chaos.on('guildMemberUpdate', async ([_oldMember, newMember]) => {
      await this.doAutoBans(newMember);
    });
  }

  getAutoBanRule(ruleName) {
    let foundRule = Object.values(AUTO_BAN_RULES).find((r) => r.name.toLowerCase() === ruleName.toLowerCase());
    if (!foundRule) {
      throw new RuleNotFoundError(ruleName);
    }
    return foundRule;
  }

  async setAutoBansEnabled(guild, newValue) {
    return this.setGuildData(guild.id, DATAKEYS.AUTO_BAN_ENABLED, newValue);
  }

  async setAutoBanRule(guild, rule, newValue) {
    rule = this.getAutoBanRule(rule);
    return this.setGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule.name), newValue);
  }

  async doAutoBans(member) {
    if (await this.isAutoBanEnabled(member.guild)) {
      this.chaos.logger.info(`Checking if ${member.user.tag} should be auto banned...`);
      const reasons = await Promise.all(this.rules.map((rule) => this.runRule(rule, member)))
        .then((reasons) => reasons.filter((reason) => reason !== ''));

      if (reasons.some(Boolean)) {
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
    return this.chaos.getService('core', 'PluginService')
      .isPluginEnabled(guild.id, 'autoban');
  }

  async isAutoBanRuleEnabled(guild, ruleName) {
    const rule = this.getAutoBanRule(ruleName);
    return this.getGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule.name));
  }

  async getRules(guild) {
    const rules = {};
    for (const rule of Object.values(AUTO_BAN_RULES)) {
      rules[rule] = await this.isAutoBanRuleEnabled(guild, rule);
    }
    return rules;
  }
}

module.exports = AutoBanService;
