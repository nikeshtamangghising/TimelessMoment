#!/bin/bash

# Bash script to set up the development database

echo "🐘 Setting up PostgreSQL database..."

# Check if Docker is running
if ! docker version > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if container already exists
if docker ps -a --filter "name=pg" --format "{{.Names}}" | grep -q "^pg$"; then
    echo "📦 PostgreSQL container already exists. Starting it..."
    docker start pg
else
    echo "📦 Creating new PostgreSQL container..."
    docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecommerce -p 5432:5432 -d postgres
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Push schema and seed database
echo "🔄 Pushing database schema..."
npm run db:push

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Database setup complete!"
echo "🔗 Database URL: postgresql://postgres:postgres@localhost:5432/ecommerce"