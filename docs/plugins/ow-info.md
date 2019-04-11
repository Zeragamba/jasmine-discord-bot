# Overwatch Info (ow-info)

The Overwatch Info module provides commands to allow users to specify what Region and Platform 
they play on to help users find others to play with.

*Note: This module is disabled by default. Use `!config module enable ow-info` to enable this module*

- Commands
    - [platform](#platform)
    - [region](#region)
- Config Actions
    - [addRegion](#addRegion)
    - [addRegionAlias](#addRegionAlias)
    - [rmRegion](#rmRegion)
    - [rmRegionAlias](#rmRegionAlias)
    - [viewRegions](#viewRegions)

## Commands

### platform
```
!platform {platform}
```
Sets the platform that you most often play Overwatch on.

- `platform`: The platform server you most often play on.

### region
```
!region {region}
```
Sets the Overwatch region that you most often play on, and assigns you the Discord role for the region.

- `region`: The Overwatch region you most often play in

*Admins: the mapped role can be changed via the [addRegion](#addregion) config action.*

## Config Actions

### addRegion
```
!config ow-info addRegion {regionName} {role}
```
Adds an Overwatch region, and maps it to a role. Can also be used to change the role for an existing region.

- `regionName`: The name of region to add.
- `role`: The name the the role to map the region to. Can be a role name or a mention. 

### addRegionAlias
```
!config ow-info addRegionAlias {aliasName} {regionName}
```
Adds an alias to an existing region

- `aliasName`: The name of alias.
- `regionName`: The name of the region the alias is for.

### rmRegion
```
!config ow-info rmRegion {regionName}
```
Removes an Overwatch region.

*Note: Also removes any of the mapped aliases for that region*

- `regionName`: The name of the region to remove.

### rmRegionAlias
```
!config ow-info rmRegionAlias {aliasName}
```
Removes an Overwatch region alias.

- `aliasName`: The name of the alias to remove.

### viewRegions
```
!config ow-info viewRegions
```
Displays a list of all configured regions, and their aliases.
