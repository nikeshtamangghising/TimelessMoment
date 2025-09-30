#!/bin/bash

# Production Deployment Script
# This script automates the production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Configuration
REQUIRED_NODE_VERSION="18"
REQUIRED_COMMANDS=("node" "npm" "vercel" "git")

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        error "Node.js version $REQUIRED_NODE_VERSION or higher is required (current: $(node -v))"
        exit 1
    fi
    
    # Check required commands
    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi
    
    # Check if Vercel is logged in
    if ! vercel whoami &> /dev/null; then
        error "Not logged in to Vercel. Run 'vercel login' first."
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warning "You have uncommitted changes. Consider committing them first."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        warning "You are not on the main/master branch (current: $CURRENT_BRANCH)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        error "package.json not found"
        exit 1
    fi
    
    # Check if .env.production.example exists
    if [ ! -f ".env.production.example" ]; then
        warning ".env.production.example not found"
    fi
    
    log "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci
    
    # Run linting
    if npm run lint &> /dev/null; then
        info "Linting passed"
    else
        error "Linting failed"
        exit 1
    fi
    
    # Run unit tests
    if npm run test &> /dev/null; then
        info "Unit tests passed"
    else
        error "Unit tests failed"
        exit 1
    fi
    
    # Run build test
    info "Testing production build..."
    if npm run build; then
        info "Build test passed"
    else
        error "Build test failed"
        exit 1
    fi
    
    log "All tests passed"
}

# Check environment variables
check_environment_variables() {
    log "Checking environment variables..."
    
    REQUIRED_ENV_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "RESEND_API_KEY"
        "FROM_EMAIL"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if ! vercel env ls | grep -q "$var"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        error "Missing required environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            error "  - $var"
        done
        error "Set them using: vercel env add <name> <value>"
        exit 1
    fi
    
    log "Environment variables check passed"
}

# Database migration
run_database_migration() {
    log "Running database migration..."
    
    # Generate Prisma client
    info "Generating Prisma client..."
    npx prisma generate
    
    # Run migrations
    info "Running database migrations..."
    if npx prisma migrate deploy; then
        info "Database migration completed"
    else
        error "Database migration failed"
        exit 1
    fi
    
    log "Database migration completed successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    # Get current commit hash
    COMMIT_HASH=$(git rev-parse --short HEAD)
    
    # Deploy
    info "Starting deployment (commit: $COMMIT_HASH)..."
    if vercel --prod --yes; then
        log "Deployment completed successfully"
    else
        error "Deployment failed"
        exit 1
    fi
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "$(basename $(pwd))" | head -1 | awk '{print $2}')
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        info "Deployment URL: https://$DEPLOYMENT_URL"
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "$(basename $(pwd))" | head -1 | awk '{print $2}')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        warning "Could not determine deployment URL"
        return
    fi
    
    BASE_URL="https://$DEPLOYMENT_URL"
    
    # Test health endpoint
    info "Testing health endpoint..."
    if curl -f -s "$BASE_URL/api/health" > /dev/null; then
        info "Health check passed"
    else
        warning "Health check failed"
    fi
    
    # Test readiness endpoint
    info "Testing readiness endpoint..."
    if curl -f -s "$BASE_URL/api/health/ready" > /dev/null; then
        info "Readiness check passed"
    else
        warning "Readiness check failed"
    fi
    
    # Test main page
    info "Testing main page..."
    if curl -f -s "$BASE_URL" > /dev/null; then
        info "Main page accessible"
    else
        warning "Main page not accessible"
    fi
    
    log "Post-deployment verification completed"
}

# Send notification
send_notification() {
    if [ -n "$WEBHOOK_URL" ]; then
        log "Sending deployment notification..."
        
        COMMIT_HASH=$(git rev-parse --short HEAD)
        COMMIT_MESSAGE=$(git log -1 --pretty=%B)
        DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "$(basename $(pwd))" | head -1 | awk '{print $2}')
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🚀 Production deployment completed\",
                \"commit\": \"$COMMIT_HASH\",
                \"message\": \"$COMMIT_MESSAGE\",
                \"url\": \"https://$DEPLOYMENT_URL\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }" || warning "Failed to send notification"
    fi
}

# Main deployment function
main() {
    log "Starting production deployment process..."
    
    check_prerequisites
    pre_deployment_checks
    run_tests
    check_environment_variables
    run_database_migration
    deploy_to_vercel
    post_deployment_verification
    send_notification
    
    log "🎉 Production deployment completed successfully!"
    
    # Show final information
    DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "$(basename $(pwd))" | head -1 | awk '{print $2}')
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo ""
        info "🌐 Your application is live at: https://$DEPLOYMENT_URL"
        info "📊 Health check: https://$DEPLOYMENT_URL/api/health"
        info "📈 Monitor your deployment in the Vercel dashboard"
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"