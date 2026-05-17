import * as migration_20260516_141314_initial_schema from './20260516_141314_initial_schema';
import * as migration_20260517_153200_channel_audio_quality from './20260517_153200_channel_audio_quality';

export const migrations = [
  {
    up: migration_20260516_141314_initial_schema.up,
    down: migration_20260516_141314_initial_schema.down,
    name: '20260516_141314_initial_schema'
  },
  {
    up: migration_20260517_153200_channel_audio_quality.up,
    down: migration_20260517_153200_channel_audio_quality.down,
    name: '20260517_153200_channel_audio_quality'
  },
];
