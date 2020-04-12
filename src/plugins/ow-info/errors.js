const ChaosCore = require('chaos-core');

class RegionError extends ChaosCore.errors.ChaosError {
}

class UnmappedRegionError extends RegionError {
  constructor(regionName) {
    super(`Region '${regionName}' does not have a valid role`);
    this.regionName = regionName;
  }
}

class BrokenAliasError extends RegionError {
  constructor(aliasName, regionName) {
    super(`Alias '${aliasName}' is mapped to ${regionName}, but the region could not be found`);
    this.aliasName = aliasName;
    this.regionName = regionName;
  }
}

class RegionNotFoundError extends RegionError {
  constructor(regionName) {
    super(`Region '${regionName}' was not found`);
    this.regionName = regionName;
  }
}

class AliasNotFoundError extends RegionError {
  constructor(aliasName) {
    super(`Alias '${aliasName}' was not found`);
    this.aliasName = aliasName;
  }
}

class RegionAlreadyAssigned extends RegionError {
  constructor(member, regionName) {
    super(`Member ${member.user.tag} already has the role for ${regionName}`);
    this.member = member;
    this.regionName = regionName;
  }
}

module.exports = {
  RegionError,
  UnmappedRegionError,
  BrokenAliasError,
  RegionNotFoundError,
  AliasNotFoundError,
  RegionAlreadyAssigned,
};
