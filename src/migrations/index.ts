import * as migration_20240715_102344 from './20240715_102344';
import * as migration_20240716_082105 from './20240716_082105';
import * as migration_20240717_053211 from './20240717_053211';
import * as migration_20240717_112357 from './20240717_112357';
import * as migration_20240805_062336 from './20240805_062336';
import * as migration_20240812_082236 from './20240812_082236';
import * as migration_20240813_071954 from './20240813_071954';
import * as migration_20240902_123931 from './20240902_123931';

export const migrations = [
  {
    up: migration_20240715_102344.up,
    down: migration_20240715_102344.down,
    name: '20240715_102344',
  },
  {
    up: migration_20240716_082105.up,
    down: migration_20240716_082105.down,
    name: '20240716_082105',
  },
  {
    up: migration_20240717_053211.up,
    down: migration_20240717_053211.down,
    name: '20240717_053211',
  },
  {
    up: migration_20240717_112357.up,
    down: migration_20240717_112357.down,
    name: '20240717_112357',
  },
  {
    up: migration_20240805_062336.up,
    down: migration_20240805_062336.down,
    name: '20240805_062336',
  },
  {
    up: migration_20240812_082236.up,
    down: migration_20240812_082236.down,
    name: '20240812_082236',
  },
  {
    up: migration_20240813_071954.up,
    down: migration_20240813_071954.down,
    name: '20240813_071954',
  },
  {
    up: migration_20240902_123931.up,
    down: migration_20240902_123931.down,
    name: '20240902_123931',
  },
];
