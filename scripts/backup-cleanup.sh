#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"

echo "[$(date)] Cleaning old backups..."

# 7 günden eski günlük backup'ları sil
find "$BACKUP_DIR" -name "dtf_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true

echo "[$(date)] Cleanup complete. Remaining backups:"
ls -lh "$BACKUP_DIR"/ 2>/dev/null || echo "(empty)"
