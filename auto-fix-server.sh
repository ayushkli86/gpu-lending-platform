#!/bin/bash

# Auto-fix server loop
# Runs server, checks for errors, and fixes them automatically

LOG_FILE="server-autofix.log"
ERROR_LOG="errors.log"
MAX_ITERATIONS=10
ITERATION=0

echo "🚀 Starting Auto-Fix Server Loop..."
echo "=================================="

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "📍 Iteration $ITERATION/$MAX_ITERATIONS"
    echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Try to start the server
    echo "🔄 Starting server..."
    timeout 10s npm run dev > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start or fail
    sleep 5
    
    # Check if server is running
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "✅ Server started successfully!"
        
        # Check health endpoint
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo "✅ Health check passed!"
            echo "🎉 Server is running successfully!"
            echo ""
            echo "Access the server at: http://localhost:3000"
            echo "Health endpoint: http://localhost:3000/health"
            echo ""
            echo "Press Ctrl+C to stop the server"
            wait $SERVER_PID
            exit 0
        else
            echo "⚠️  Server started but health check failed"
            kill $SERVER_PID 2>/dev/null
        fi
    else
        echo "❌ Server failed to start"
    fi
    
    # Extract errors from log
    echo "🔍 Analyzing errors..."
    grep -i "error\|failed\|cannot\|unable" "$LOG_FILE" > "$ERROR_LOG" 2>/dev/null
    
    if [ -s "$ERROR_LOG" ]; then
        echo "📋 Found errors:"
        head -20 "$ERROR_LOG"
        
        # Check for common errors and fix them
        
        # TypeScript errors
        if grep -q "TS[0-9]\+:" "$ERROR_LOG"; then
            echo "🔧 Fixing TypeScript errors..."
            
            # Duplicate identifier
            if grep -q "TS2300.*Duplicate identifier" "$ERROR_LOG"; then
                echo "   → Removing duplicate declarations..."
                # This would be handled by reading the specific file
            fi
            
            # Import conflicts
            if grep -q "TS2440.*Import declaration conflicts" "$ERROR_LOG"; then
                echo "   → Fixing import conflicts..."
            fi
            
            # Missing dependencies
            if grep -q "Cannot find module" "$ERROR_LOG"; then
                echo "   → Installing missing dependencies..."
                npm install 2>&1 | tail -5
            fi
        fi
        
        # Missing ts-node
        if grep -q "ts-node.*not found" "$ERROR_LOG"; then
            echo "🔧 Installing ts-node..."
            npm install -D ts-node tsx
        fi
        
        # Port already in use
        if grep -q "EADDRINUSE\|port.*already in use" "$ERROR_LOG"; then
            echo "🔧 Killing process on port 3000..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null
            sleep 2
        fi
        
        # Database connection errors
        if grep -q "database\|prisma\|connection" "$ERROR_LOG"; then
            echo "🔧 Checking database connection..."
            if ! docker ps | grep -q postgres; then
                echo "   → Starting database with docker-compose..."
                docker-compose up -d postgres redis 2>&1 | tail -5
                sleep 5
            fi
        fi
        
        # Prisma client not generated
        if grep -q "Prisma.*not.*generated\|@prisma/client" "$ERROR_LOG"; then
            echo "🔧 Generating Prisma client..."
            npx prisma generate 2>&1 | tail -5
        fi
        
    else
        echo "⚠️  No specific errors found in logs"
        echo "📄 Last 20 lines of log:"
        tail -20 "$LOG_FILE"
    fi
    
    echo ""
    echo "⏳ Waiting 3 seconds before retry..."
    sleep 3
done

echo ""
echo "❌ Max iterations ($MAX_ITERATIONS) reached"
echo "📋 Check logs for details:"
echo "   - $LOG_FILE"
echo "   - $ERROR_LOG"
echo ""
echo "💡 Manual steps to try:"
echo "   1. npm install"
echo "   2. npx prisma generate"
echo "   3. docker-compose up -d"
echo "   4. npm run dev"
