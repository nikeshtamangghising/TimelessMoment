#!/bin/bash

# Database Restore Script for Production
# This script restores a PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Usage function
usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ecommerce_backup_20231201_120000.sql.gz"
    echo ""
    echo "Environment variables:"
    echo "  DATABASE_URL    - PostgreSQL connection string"
    echo "  BACKUP_DIR      - Directory containing backups (default: ./backups)"
    echo "  FORCE_RESTORE   - Set to 'yes' to skip confirmation prompt"
    exit 1
}

# Check arguments
if [ $# -ne 1 ]; then
    usage
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    error "Backup file not found: $BACKUP_PATH"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse DATABASE_URL
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    error "Invalid DATABASE_URL format"
    exit 1
fi

log "Database restore configuration:"
log "Database: $DB_NAME"
log "Host: $DB_HOST"
log "Backup file: $BACKUP_PATH"

# Confirmation prompt
if [ "$FORCE_RESTORE" != "yes" ]; then
    echo ""
    warning "WARNING: This will completely replace the current database!"
    warning "Database: $DB_NAME on $DB_HOST"
    warning "All existing data will be lost!"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Set password for pg_restore
export PGPASSWORD="$DB_PASS"

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing backup file..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_PATH" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_PATH"
fi

# Create a pre-restore backup (safety measure)
if [ "$SKIP_SAFETY_BACKUP" != "yes" ]; then
    log "Creating safety backup before restore..."
    SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --file="$SAFETY_BACKUP"; then
        log "Safety backup created: $SAFETY_BACKUP"
    else
        warning "Failed to create safety backup, continuing anyway..."
    fi
fi

# Perform restore
log "Starting database restore..."

if pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$RESTORE_FILE"; then
    
    log "Database restore completed successfully"
    
else
    error "Database restore failed"
    
    # Clean up temp file if created
    if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi
    
    exit 1
fi

# Clean up temp file if created
if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
    log "Cleaned up temporary files"
fi

# Run database migrations to ensure schema is up to date
if command -v npx &> /dev/null && [ -f "package.json" ]; then
    log "Running database migrations..."
    if npx prisma migrate deploy; then
        log "Database migrations completed"
    else
        warning "Database migrations failed - manual intervention may be required"
    fi
fi

# Send notification (optional)
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"Database restore completed successfully\",
            \"backup_file\": \"$BACKUP_FILE\",
            \"database\": \"$DB_NAME\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }" || warning "Failed to send notification"
fi

log "Restore process completed successfully"
log "Please verify that your application is working correctly"