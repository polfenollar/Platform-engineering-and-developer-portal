#!/bin/bash
# Master startup script for VEYOR Marketplace with Agent

set -e  # Exit on error

PROJECT_DIR="/Users/polfenollarvilla/Documents/veyor-marketplace-standalone"
cd "$PROJECT_DIR"

echo "=========================================="
echo "🚀 Starting VEYOR Marketplace Stack"
echo "=========================================="
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    echo "❌ $name failed to start"
    return 1
}

# Step 1: Start Infrastructure (Docker)
echo "📦 Step 1/4: Starting Infrastructure (Docker)..."
echo "   - PostgreSQL, Redis, Kafka, Prometheus, Grafana, etc."
cd "$PROJECT_DIR/infra"
if docker compose ps | grep -q "Up"; then
    echo "   ℹ️  Infrastructure already running"
else
    docker compose up -d
    echo "   ✅ Infrastructure started"
fi
echo ""

# Wait for PostgreSQL
wait_for_service "http://localhost:5432" "PostgreSQL" || true

# Step 2: Start Backend (Java Spring Boot)
echo "🔧 Step 2/4: Starting Backend (Java)..."
cd "$PROJECT_DIR/backend"

if check_port 8080; then
    echo "   ℹ️  Backend already running on port 8080"
else
    echo "   Starting Spring Boot application..."
    ./gradlew bootRun > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    echo "   ✅ Backend started (PID: $BACKEND_PID)"
fi
echo ""

# Wait for backend
wait_for_service "http://localhost:8080/api/health" "Backend API" || true

# Step 3: Start Frontend (Next.js)
echo "🎨 Step 3/4: Starting Frontend (Next.js)..."
cd "$PROJECT_DIR/frontend"

if check_port 3000; then
    echo "   ℹ️  Frontend already running on port 3000"
else
    echo "   Starting Next.js dev server..."
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
fi
echo ""

# Wait for frontend
wait_for_service "http://localhost:3000" "Frontend" || true

# Step 4: Start Agent API (Python FastAPI)
echo "🤖 Step 4/4: Starting Agent API (Python)..."
cd "$PROJECT_DIR/agents"

if check_port 8000; then
    echo "   ℹ️  Agent API already running on port 8000"
else
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "   📦 Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    
    # Check if dependencies are installed
    if ! python -c "import fastapi" 2>/dev/null; then
        echo "   📦 Installing dependencies..."
        pip install -q -r requirements.txt
    fi
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        echo "   ⚠️  .env file not found. Creating from template..."
        cp .env.example .env
        echo "   ⚠️  WARNING: Please add your API keys to agents/.env"
        echo "   - LANGCHAIN_API_KEY (get from https://smith.langchain.com)"
        echo "   - OPENAI_API_KEY (get from https://platform.openai.com)"
    fi
    
    echo "   Starting FastAPI server..."
    python api_server.py > agent.log 2>&1 &
    AGENT_PID=$!
    echo $AGENT_PID > agent.pid
    echo "   ✅ Agent API started (PID: $AGENT_PID)"
fi
echo ""

# Wait for agent API
wait_for_service "http://localhost:8000/health" "Agent API" || true

echo "=========================================="
echo "✅ All Services Started Successfully!"
echo "=========================================="
echo ""
echo "📊 Service Status:"
echo "   - Infrastructure:  http://localhost:9090 (Prometheus)"
echo "   - Infrastructure:  http://localhost:3001 (Grafana)"
echo "   - Backend API:     http://localhost:8080"
echo "   - Frontend:        http://localhost:3000"
echo "   - Agent API:       http://localhost:8000"
echo "   - Agent Docs:      http://localhost:8000/docs"
echo ""
echo "🎯 Quick Links:"
echo "   - Main App:        http://localhost:3000"
echo "   - API Docs:        http://localhost:8000/docs"
echo "   - LangSmith:       https://smith.langchain.com"
echo ""
echo "📝 Logs:"
echo "   - Backend:  $PROJECT_DIR/backend/backend.log"
echo "   - Frontend: $PROJECT_DIR/frontend/frontend.log"
echo "   - Agent:    $PROJECT_DIR/agents/agent.log"
echo ""
echo "🛑 To stop all services, run:"
echo "   ./stop_all.sh"
echo ""
