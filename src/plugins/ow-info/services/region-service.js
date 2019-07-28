const {of, zip, throwError} = require('rxjs');
const {flatMap, map, mapTo} = require('rxjs/operators');
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

  getRegions(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_REGIONS).pipe(
      flatMap((regions) => (
        regions
          ? of(regions)
          : this.setRegions(guild, this.mapDefaultRoles(guild))
      )),
    );
  }

  setRegions(guild, roles) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.REGION_REGIONS, roles);
  }

  getAliases(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_ALIASES).pipe(
      flatMap((aliases) => (
        aliases
          ? of(aliases)
          : this.setAliases(guild, this.mapDefaultAliases())
      )),
    );
  }

  setAliases(guild, aliases) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.REGION_ALIASES, aliases);
  }

  mapRegion(guild, region, role) {
    return this.getRegions(guild).pipe(
      map((regions) => {
        regions[region.toLowerCase()] = {
          name: region,
          roleId: role.id,
        };
        return regions;
      }),
      flatMap((regions) => this.setRegions(guild, regions)),
      map((regions) => regions[region.toLowerCase()]),
    );
  }

  removeRegion(guild, regionName) {
    regionName = regionName.toLowerCase();

    return zip(
      this.getAliases(guild),
      this.getRegions(guild),
    ).pipe(
      map(([aliases, regions]) => {
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
      }),
      flatMap(([aliases, regions, regionData]) =>
        zip(
          this.setAliases(guild, aliases),
          this.setRegions(guild, regions),
        ).pipe(
          mapTo(regionData.name),
        ),
      ),
    );
  }

  mapAlias(guild, aliasName, regionName) {
    return zip(
      this.getAliases(guild),
      this.getRegions(guild),
    ).pipe(
      map(([aliases, regions]) => {
        let regionData = regions[regionName.toLowerCase()];
        if (!regionData) {
          throw new RegionNotFoundError(regionName);
        }

        aliases[aliasName.toLowerCase()] = {
          name: aliasName,
          region: regionData.name,
        };

        return aliases;
      }),
      flatMap((aliases) => this.setAliases(guild, aliases)),
      map((aliases) => aliases[aliasName.toLowerCase()]),
    );
  }

  removeAlias(guild, aliasName) {
    aliasName = aliasName.toLowerCase();

    return of('').pipe(
      flatMap(() => this.getAliases(guild)),
      map((aliases) => {
        let aliasData = aliases[aliasName];
        if (!aliasData) {
          throw new AliasNotFoundError(aliasName);
        }

        delete aliases[aliasName];

        return [aliases, aliasData];
      }),
      flatMap(([aliases, aliasData]) => this.setAliases(guild, aliases).pipe(
        map(() => aliasData.name),
      )),
    );
  }

  getRegion(guild, regionOrAlias) {
    regionOrAlias = regionOrAlias.toLowerCase();

    return zip(
      this.getRegions(guild),
      this.getAliases(guild),
    ).pipe(
      map(([regions, alias]) => {
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
      }),
    );
  }

  getRegionRole(guild, regionOrAlias) {
    return this.getRegion(guild, regionOrAlias).pipe(
      map((regionData) => {
        let regionRole = guild.roles.get(regionData.roleId);
        if (!regionRole) {
          throw new UnmappedRegionError(regionData.name);
        }
        return regionRole;
      }),
    );
  }

  setUserRegion(member, regionOrAlias) {
    let guild = member.guild;

    return this.getRegion(guild, regionOrAlias).pipe(
      flatMap((region) => (
        member.roles.get(region.roleId)
          ? throwError(new RegionAlreadyAssigned(member, region.name))
          : of(region)
      )),
      flatMap((region) => (
        guild.roles.get(region.roleId)
          ? of(region)
          : throwError(new UnmappedRegionError(region.name))
      )),
      flatMap((region) => of('').pipe(
        flatMap(() => member.addRole(region.roleId)),
        mapTo(region),
      )),
    );
  }
}

module.exports = RegionService;
