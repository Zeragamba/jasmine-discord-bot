const Service = require('chaos-core').Service;

const DATAKEYS = require('../datakeys');
const autoBanRules = require('../rules');
const {RuleNotFoundError} = require("../errors");

class AutoBanService extends Service {
  rules = Object.values(autoBanRules);

  constructor(chaos) {
    super(chaos);
    this.chaos.on('guildMemberAdd', async (member) => this.doAutoBans(member));
    this.chaos.on('guildMemberUpdate', async ([_oldMember, newMember]) => this.doAutoBans(newMember));
  }

  async pluginEnabled(guild) {
    return this.chaos.getService('core', 'PluginService')
      .isPluginEnabled(guild.id, 'autoban');
  }

  async doAutoBans(member) {
    if (await this.pluginEnabled(member.guild)) {
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
    if (await this.isRuleEnabled(member.guild, rule) && rule.test(member)) {
      return rule.reason;
    }
  }

  async setRuleEnabled(guild, rule, newValue) {
    return this.setGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule), newValue);
  }

  async isRuleEnabled(guild, rule) {
    return this.getGuildData(guild.id, DATAKEYS.AUTO_BAN_RULE(rule));
  }

  async getRule(ruleName) {
    let foundRule = Object.values(autoBanRules)
      .find((r) => r.name.toLowerCase() === ruleName.toLowerCase());

    if (!foundRule) {
      throw new RuleNotFoundError(ruleName);
    }

    return foundRule;
  }
}

module.exports = AutoBanService;
