import * as migration_20260516_141314_initial_schema from './20260516_141314_initial_schema';
import * as migration_20260517_153200_channel_audio_quality from './20260517_153200_channel_audio_quality';
import * as migration_20260518_154200_ablaut_rebrand from './20260518_154200_ablaut_rebrand';
import * as migration_20260519_120000_organizations from './20260519_120000_organizations';
import * as migration_20260519_150000_organizations_locked_documents_rels from './20260519_150000_organizations_locked_documents_rels';
import * as migration_20260520_100000_ablaut_qr_style_cleanup from './20260520_100000_ablaut_qr_style_cleanup';

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
  {
    up: migration_20260518_154200_ablaut_rebrand.up,
    down: migration_20260518_154200_ablaut_rebrand.down,
    name: '20260518_154200_ablaut_rebrand'
  },
  {
    up: migration_20260519_120000_organizations.up,
    down: migration_20260519_120000_organizations.down,
    name: '20260519_120000_organizations'
  },
  {
    up: migration_20260519_150000_organizations_locked_documents_rels.up,
    down: migration_20260519_150000_organizations_locked_documents_rels.down,
    name: '20260519_150000_organizations_locked_documents_rels'
  },
  {
    up: migration_20260520_100000_ablaut_qr_style_cleanup.up,
    down: migration_20260520_100000_ablaut_qr_style_cleanup.down,
    name: '20260520_100000_ablaut_qr_style_cleanup'
  },
];
