const DATAKEYS = require('./datakeys');

module.exports = {
  name: 'ow-info',
  description: "Allows users to set their Overwatch Region and Platform",

  defaultData: [
    {
      keyword: DATAKEYS.REGION_REGIONS,
      data: null,
    },
    {
      keyword: DATAKEYS.REGION_ALIASES,
      data: null,
    },
  ],
  services: [
    require('./services/region-service'),
  ],
  configActions: [
    require('./config/view-regions'),
    require('./config/add-region'),
    require('./config/add-region-alias'),
    require('./config/rm-region'),
    require('./config/rm-region-alias'),
  ],
  commands: [
    require('./commands/platform'),
    require('./commands/region'),
  ],
};
