import * as migration_20240715_102344 from './20240715_102344';
import * as migration_20240716_082105 from './20240716_082105';
import * as migration_20240717_053211 from './20240717_053211';
import * as migration_20240717_112357 from './20240717_112357';
import * as migration_20240805_062336 from './20240805_062336';
import * as migration_20240812_082236 from './20240812_082236';
import * as migration_20240813_071954 from './20240813_071954';
import * as migration_20240902_123931 from './20240902_123931';
import * as migration_20241007_081453 from './20241007_081453';
import * as migration_20241101_053239 from './20241101_053239';
import * as migration_20241101_054322 from './20241101_054322';
import * as migration_20250121_081211 from './20250121_081211';
import * as migration_20250311_084429 from './20250311_084429';

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
  {
    up: migration_20241007_081453.up,
    down: migration_20241007_081453.down,
    name: '20241007_081453',
  },
  {
    up: migration_20241101_053239.up,
    down: migration_20241101_053239.down,
    name: '20241101_053239',
  },
  {
    up: migration_20241101_054322.up,
    down: migration_20241101_054322.down,
    name: '20241101_054322',
  },
  {
    up: migration_20250121_081211.up,
    down: migration_20250121_081211.down,
    name: '20250121_081211',
  },
  {
    up: migration_20250311_084429.up,
    down: migration_20250311_084429.down,
    name: '20250311_084429'
  },
];
