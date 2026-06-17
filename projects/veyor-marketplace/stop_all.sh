#!/bin/bash
# Stop all VEYOR Marketplace services

PROJECT_DIR="/Users/polfenollarvilla/Documents/FREIGHTOS MARKETPLACE 2"

echo "=========================================="
echo "🛑 Stopping VEYOR Marketplace Stack"
echo "=========================================="
echo ""

# Stop Agent API
if [ -f "$PROJECT_DIR/agents/agent.pid" ]; then
    AGENT_PID=$(cat "$PROJECT_DIR/agents/agent.pid")
    if ps -p $AGENT_PID > /dev/null 2>&1; then
        echo "🤖 Stopping Agent API (PID: $AGENT_PID)..."
        kill $AGENT_PID
        rm "$PROJECT_DIR/agents/agent.pid"
        echo "   ✅ Agent API stopped"
    fi
fi

# Stop Frontend
if [ -f "$PROJECT_DIR/frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/frontend/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🎨 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm "$PROJECT_DIR/frontend/frontend.pid"
        echo "   ✅ Frontend stopped"
    fi
fi

# Stop Backend
if [ -f "$PROJECT_DIR/backend/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/backend/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔧 Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm "$PROJECT_DIR/backend/backend.pid"
        echo "   ✅ Backend stopped"
    fi
fi

# Stop Infrastructure
echo "📦 Stopping Infrastructure (Docker)..."
cd "$PROJECT_DIR/infra"
docker compose down
echo "   ✅ Infrastructure stopped"

echo ""
echo "=========================================="
echo "✅ All Services Stopped"
echo "=========================================="
