const Rx = require('rx');
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
  onJoinGuild(guild) {
    let mapRoles$ = this.getRegions(guild)
      .filter((roles) => roles === null)
      .flatMap(() => this.setRegions(guild, this.mapDefaultRoles(guild)));

    let mapAliases$ = this.getAliases(guild)
      .filter((aliases) => aliases === null)
      .flatMap(() => this.setAliases(guild, this.mapDefaultAliases()));

    return Rx.Observable
      .merge(mapRoles$, mapAliases$)
      .defaultIfEmpty('')
      .last()
      .map(() => true);
  }

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

  getRegions(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_REGIONS);
  }

  setRegions(guild, roles) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.REGION_REGIONS, roles);
  }

  getAliases(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_ALIASES);
  }

  setAliases(guild, aliases) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.REGION_ALIASES, aliases);
  }

  mapRegion(guild, region, role) {
    return this.getRegions(guild)
      .map((regions) => {
        regions[region.toLowerCase()] = {
          name: region,
          roleId: role.id,
        };
        return regions;
      })
      .flatMap((regions) => this.setRegions(guild, regions))
      .map((regions) => regions[region.toLowerCase()]);
  }

  removeRegion(guild, regionName) {
    regionName = regionName.toLowerCase();

    return Rx.Observable
      .zip(
        this.getAliases(guild),
        this.getRegions(guild),
      )
      .map(([aliases, regions]) => {
        let regionData = regions[regionName.toLowerCase()];
        if (!regionData) {
          throw new RegionNotFoundError(regionName);
        }

        Object.entries(aliases).forEach(([alias, aliasData]) => {
          if (aliasData.region.toLowerCase() === regionName) {
            delete aliases[alias];
          }
        });

        delete regions[regionName];

        return [aliases, regions, regionData];
      })
      .flatMap(([aliases, regions, regionData]) =>
        Rx.Observable
          .merge(
            this.setAliases(guild, aliases),
            this.setRegions(guild, regions),
          )
          .last()
          .map(() => regionData.name),
      );
  }

  mapAlias(guild, aliasName, regionName) {
    return Rx.Observable
      .zip(
        this.getAliases(guild),
        this.getRegions(guild),
      )
      .map(([aliases, regions]) => {
        let regionData = regions[regionName.toLowerCase()];
        if (!regionData) {
          throw new RegionNotFoundError(regionName);
        }

        aliases[aliasName.toLowerCase()] = {
          name: aliasName,
          region: regionData.name,
        };

        return aliases;
      })
      .flatMap((aliases) => this.setAliases(guild, aliases))
      .map((aliases) => aliases[aliasName.toLowerCase()]);
  }

  removeAlias(guild, aliasName) {
    aliasName = aliasName.toLowerCase();

    return Rx.Observable
      .of('')
      .flatMap(() => this.getAliases(guild))
      .map((aliases) => {
        let aliasData = aliases[aliasName];
        if (!aliasData) {
          throw new AliasNotFoundError(aliasName);
        }

        delete aliases[aliasName];

        return [aliases, aliasData];
      })
      .flatMap(([aliases, aliasData]) =>
        this.setAliases(guild, aliases)
          .map(() => aliasData.name),
      );
  }

  getRegion(guild, regionOrAlias) {
    regionOrAlias = regionOrAlias.toLowerCase();

    return Rx.Observable
      .zip(
        this.getRegions(guild),
        this.getAliases(guild),
      )
      .map(([regions, alias]) => {
        if (regions[regionOrAlias]) {
          return regions[regionOrAlias];
        }

        if (alias[regionOrAlias]) {
          let aliasData = alias[regionOrAlias];
          let regionData = regions[aliasData.region.toLowerCase()];

          if (!regionData) {
            throw new BrokenAliasError(aliasData.name, aliasData.region);
          }

          return regionData;
        }

        throw new RegionNotFoundError(regionOrAlias);
      });
  }

  getRegionRole(guild, regionOrAlias) {
    return this.getRegion(guild, regionOrAlias)
      .map((regionData) => {
        let regionRole = guild.roles.get(regionData.roleId);
        if (!regionRole) {
          throw new UnmappedRegionError(regionData.name);
        }
        return regionRole;
      });
  }

  setUserRegion(member, regionOrAlias) {
    let guild = member.guild;

    let rolesToRemove$ = this.getRegions(guild)
      .flatMap((regions) => Rx.Observable.from(Object.values(regions)))
      .map((region) => region.roleId)
      .map((roleId) => guild.roles.get(roleId))
      .filter((role) => role)
      .toArray();

    return this.getRegion(guild, regionOrAlias)
      .flatMap((region) => {
        if (member.roles.get(region.roleId)) {
          throw new RegionAlreadyAssigned(member, region.name);
        }

        let regionRole = guild.roles.get(region.roleId);
        if (!regionRole) {
          throw new UnmappedRegionError(region.name);
        }

        return rolesToRemove$
          .map((rolesToRemove) => [region, rolesToRemove, regionRole]);
      })
      .flatMap(([region, rolesToRemove, regionRole]) => {
        return Rx.Observable
          .of('')
          .flatMap(() => member.removeRoles(rolesToRemove))
          .flatMap(() => member.addRole(regionRole))
          .map(() => region.name);
      });
  }
}

module.exports = RegionService;
