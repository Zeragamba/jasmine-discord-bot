const Service = require('chaos-core').Service;

const DATAKEYS = require('../datakeys');
const {
  UnmappedRegionError,
  BrokenAliasError,
  RegionNotFoundError,
  AliasNotFoundError,
  RegionAlreadyAssigned,
} = require('../errors');

const defaultRegions = require('../data/regions');

class RegionService extends Service {
  mapDefaultRoles(guild) {
    let roleMap = {};
    defaultRegions.forEach((region) => {
      let role = guild.roles.find((r) => r.name === region.role);
      roleMap[region.name.toLowerCase()] = {
        name: region.name,
        roleId: role ? role.id : null,
      };
    });
    return roleMap;
  }

  mapDefaultAliases() {
    let aliasMap = {};
    defaultRegions.forEach((region) => {
      region.alias.forEach((alias) => {
        aliasMap[alias.toLowerCase()] = {
          name: alias,
          region: region.name,
        };
      });
    });
    return aliasMap;
  }

  async getRegions(guild) {
    const regions = await this.getGuildData(guild.id, DATAKEYS.REGION_REGIONS);

    if (regions) {
      return regions;
    } else {
      return this.setRegions(guild, this.mapDefaultRoles(guild));
    }
  }

  async setRegions(guild, roles) {
    return this.setGuildData(guild.id, DATAKEYS.REGION_REGIONS, roles);
  }

  async getAliases(guild) {
    const aliases = await this.getGuildData(guild.id, DATAKEYS.REGION_ALIASES);

    if (aliases) {
      return aliases;
    } else {
      return this.setAliases(guild, this.mapDefaultAliases(guild));
    }
  }

  async setAliases(guild, aliases) {
    return this.setGuildData(guild.id, DATAKEYS.REGION_ALIASES, aliases);
  }

  async mapRegion(guild, region, role) {
    let regions = await this.getRegions(guild);
    regions[region.toLowerCase()] = {
      name: region,
      roleId: role.id,
    };
    regions = await this.setRegions(guild, regions);
    return regions[region.toLowerCase()];
  }

  async removeRegion(guild, regionName) {
    regionName = regionName.toLowerCase();

    const [regions, aliases] = await Promise.all([
      this.getRegions(guild),
      this.getAliases(guild),
    ]);

    let regionData = regions[regionName.toLowerCase()];
    if (!regionData) {
      throw new RegionNotFoundError(regionName);
    }

    delete regions[regionName];
    Object.entries(aliases).forEach(([alias, aliasData]) => {
      if (aliasData.region.toLowerCase() === regionName) {
        delete aliases[alias];
      }
    });

    await Promise.all([
      this.setRegions(guild, regions),
      this.setAliases(guild, aliases),
    ]);

    return regionData.name;
  }

  async mapAlias(guild, aliasName, regionName) {
    const [regions, aliases] = await Promise.all([
      this.getRegions(guild),
      this.getAliases(guild),
    ]);

    let regionData = regions[regionName.toLowerCase()];
    if (!regionData) {
      throw new RegionNotFoundError(regionName);
    }

    aliases[aliasName.toLowerCase()] = {
      name: aliasName,
      region: regionData.name,
    };

    return this.setAliases(guild, aliases)
      .then((aliases) => aliases[aliasName.toLowerCase()]);
  }

  async removeAlias(guild, aliasName) {
    aliasName = aliasName.toLowerCase();
    const aliases = await this.getAliases(guild);
    let aliasData = aliases[aliasName];
    if (!aliasData) {
      throw new AliasNotFoundError(aliasName);
    }

    delete aliases[aliasName];
    await this.setAliases(guild, aliases);

    return aliasData.name;
  }

  async getRegion(guild, regionOrAlias) {
    regionOrAlias = regionOrAlias.toLowerCase();

    const [regions, aliases] = await Promise.all([
      this.getRegions(guild),
      this.getAliases(guild),
    ]);

    if (regions[regionOrAlias]) {
      return regions[regionOrAlias];
    }

    if (aliases[regionOrAlias]) {
      let aliasData = aliases[regionOrAlias];
      let regionData = regions[aliasData.region.toLowerCase()];

      if (!regionData) {
        throw new BrokenAliasError(aliasData.name, aliasData.region);
      }

      return regionData;
    }

    throw new RegionNotFoundError(regionOrAlias);
  }

  async getRegionRole(guild, regionOrAlias) {
    const regionData = await this.getRegion(guild, regionOrAlias);
    let regionRole = guild.roles.get(regionData.roleId);
    if (!regionRole) {
      throw new UnmappedRegionError(regionData.name);
    }
    return regionRole;
  }

  async setUserRegion(member, regionOrAlias) {
    let guild = member.guild;
    const region = await this.getRegion(guild, regionOrAlias);

    if (member.roles.get(region.roleId)) {
      throw new RegionAlreadyAssigned(member, region.name);
    }

    if (!guild.roles.get(region.roleId)) {
      throw new UnmappedRegionError(region.name);
    }

    await member.addRole(region.roleId);

    return region;
  }
}

module.exports = RegionService;
