#!/usr/bin/env bash
# Layer 13: Backup script — copies nayab.db to /var/backups/nayab/ with timestamp, keeps last 7
set -euo pipefail

DB_PATH="${DB_PATH:-/var/data/nayab.db}"
BACKUP_DIR="/var/backups/nayab"
KEEP=7

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "[backup] Database not found at $DB_PATH — skipping"
  exit 0
fi

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/nayab_$TIMESTAMP.db"

# Use SQLite's backup command (safer than cp for live database)
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup $BACKUP_FILE"
else
  cp "$DB_PATH" "$BACKUP_FILE"
fi

echo "[backup] Backed up to $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Keep only the last $KEEP backups
ls -t "$BACKUP_DIR"/nayab_*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --
echo "[backup] Kept last $KEEP backups"
