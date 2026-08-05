#!/bin/bash
set -e

echo "🚀 VisionFlow — Starting all services..."
docker compose up --build -d

echo ""
echo "✅ VisionFlow is running!"
echo ""
echo "   Web:       http://localhost:3000"
echo "   API:       http://localhost:3333"
echo "   API Health: http://localhost:3333/api/health"
echo ""
echo "   Logs: docker compose logs -f"
echo "   Stop: docker compose down"
