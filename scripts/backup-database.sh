#!/bin/bash

# Database Backup Script for Production
# This script creates a backup of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ecommerce_backup_${TIMESTAMP}.sql"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

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

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://username:password@host:port/database
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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."
log "Database: $DB_NAME"
log "Host: $DB_HOST"
log "Backup file: $BACKUP_FILE"

# Set password for pg_dump
export PGPASSWORD="$DB_PASS"

# Create backup
if pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_DIR/$BACKUP_FILE"; then
    
    log "Backup completed successfully: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress backup
    if command -v gzip &> /dev/null; then
        gzip "$BACKUP_DIR/$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        log "Backup compressed: $BACKUP_DIR/$BACKUP_FILE"
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
    
else
    error "Backup failed"
    exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "ecommerce_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "ecommerce_backup_*.sql*" -type f | wc -l)
log "Total backups retained: $BACKUP_COUNT"

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Uploading backup to S3..."
    if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/$BACKUP_FILE"; then
        log "Backup uploaded to S3 successfully"
    else
        warning "Failed to upload backup to S3"
    fi
fi

# Send notification (optional)
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"Database backup completed successfully\",
            \"backup_file\": \"$BACKUP_FILE\",
            \"backup_size\": \"$BACKUP_SIZE\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }" || warning "Failed to send notification"
fi

log "Backup process completed"