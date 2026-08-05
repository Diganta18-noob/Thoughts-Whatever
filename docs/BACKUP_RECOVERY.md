# Backup & Recovery Documentation

The Backup & Recovery System provides dual-redundancy backup storage (Local filesystem + Cloudflare R2 Cloud Storage), automated SHA-256 verification, and quick restoration tools.

## Architecture

1. **Database Backup**: Exports all Prisma models into a compressed `database.json.gz` snapshot.
2. **Media Assets**: Downloads Cloudinary media assets and metadata manifest (`media-manifest.json`).
3. **Local Content**: Compresses the local `/Content` directory into `content.tar.gz`.
4. **Verification**: Generates SHA-256 hashes for all backup artifacts and records them in `manifest.json`.
5. **Storage**: Saves locally to `/backups/backup_YYYY-MM-DD/` and syncs to Cloudflare R2 bucket.
6. **Retention**: Maintains 30 daily backups with automatic rotation (retains a minimum of 7 backups as a safeguard).

---

## Restoration

### Admin Dashboard UI
Navigate to `/admin/system` -> **Available Backups** -> Click **Restore** on the target snapshot.

### Emergency CLI Restoration
```bash
npx tsx scripts/restore-backup.ts <backup_id> [full|database|content]
```
Example:
```bash
npx tsx scripts/restore-backup.ts backup_2026-08-06-03-30-00 full
```
