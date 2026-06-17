#!/bin/bash
PROJECT_DIR="/Users/polfenollarvilla/Documents/veyor-marketplace-standalone"
DOCKER_BIN="/usr/local/bin/docker"

echo "📦 Starting Infrastructure..."
cd "$PROJECT_DIR/infra"
$DOCKER_BIN compose up -d

echo "🔧 Starting Backend..."
cd "$PROJECT_DIR/backend"
./gradlew bootRun > backend.log 2>&1 &
echo $! > backend.pid

echo "🎨 Starting Frontend..."
cd "$PROJECT_DIR/frontend"
npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

echo "✅ Core services starting in background."
