const {from, zip} = require('rxjs');
const {map} = require('rxjs/operators');

module.exports = {
  name: 'viewRegions',
  description: 'Displays a list of all configured regions, and their aliases',

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    let guild = context.guild;

    return zip(
      from(regionService.getRegions(guild)),
      from(regionService.getAliases(guild)),
    ).pipe(
      map(([regions, aliases]) => {
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

        return data;
      }),
      map((data) => {
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
      }),
    );
  },
};
