const {of, from, merge, zip, throwError} = require('rxjs');
const {flatMap, map, last, toArray, filter, mapTo} = require('rxjs/operators');
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
  constructor(chaos) {
    super(chaos);

    this.chaos.on('guildCreate', (guild) => this.onGuildCreate(guild));
  }

  onGuildCreate(guild) {
    let mapRoles$ = this.getRegions(guild).pipe(
      filter((roles) => roles === null),
      flatMap(() => this.setRegions(guild, this.mapDefaultRoles(guild))),
    );

    let mapAliases$ = this.getAliases(guild).pipe(
      filter((aliases) => aliases === null),
      flatMap(() => this.setAliases(guild, this.mapDefaultAliases())),
    );

    return merge(mapRoles$, mapAliases$).pipe(
      last(null, ''),
      map(() => true),
    );
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
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_REGIONS).pipe(
      map((regions) => regions || {}),
    );
  }

  setRegions(guild, roles) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.REGION_REGIONS, roles);
  }

  getAliases(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.REGION_ALIASES).pipe(
      map((aliases) => aliases || {}),
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

    let rolesToRemove$ = this.getRegions(guild).pipe(
      flatMap((regions) => from(Object.values(regions))),
      map((region) => region.roleId),
      map((roleId) => guild.roles.get(roleId)),
      filter((role) => role),
      toArray(),
    );

    return this.getRegion(guild, regionOrAlias).pipe(
      flatMap((region) => {
        if (member.roles.get(region.roleId)) {
          return throwError(new RegionAlreadyAssigned(member, region.name));
        }

        let regionRole = guild.roles.get(region.roleId);
        if (!regionRole) {
          return throwError(new UnmappedRegionError(region.name));
        }

        return rolesToRemove$.pipe(
          map((rolesToRemove) => [region, rolesToRemove, regionRole]),
        );
      }),
      flatMap(([region, rolesToRemove, regionRole]) => of('').pipe(
        flatMap(() => member.removeRoles(rolesToRemove)),
        flatMap(() => member.addRole(regionRole)),
        map(() => region.name),
      )),
    );
  }
}

module.exports = RegionService;
