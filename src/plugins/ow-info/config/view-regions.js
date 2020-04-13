module.exports = {
  name: 'viewRegions',
  description: 'Displays a list of all configured regions, and their aliases',

  async run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    let guild = context.guild;

    const [regions, aliases] = await Promise.all([
      regionService.getRegions(guild),
      regionService.getAliases(guild),
    ]);

    let data = {
      regions: [],
    };

    data.regions = Object.values(regions);
    data.regions.forEach((region) => {
      region.role = guild.roles.get(region.roleId);
      region.aliases = [];
    });

    Object.values(aliases).forEach((alias) => {
      let region = regions[alias.region.toLowerCase()];
      if (region) {
        region.aliases.push(alias.name);
      }
    });
    let embed = {fields: []};

    data.regions.forEach((region) => {
      embed.fields.push({
        name: `${region.name}`,
        value:
          `**Aliases**: ${region.aliases.length >= 1 ? region.aliases.join(', ') : '`none`'}\n` +
          `**Role**: ${region.role ? region.role.name : '`Unknown`'}`,
      });
    });

    return {
      type: 'embed',
      content: 'Here are all the currently configured regions:',
      embed,
    };
  },
};
