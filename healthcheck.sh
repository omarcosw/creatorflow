#!/bin/bash
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$STATUS" != "200" ]; then
  echo "$(date) — App down (HTTP $STATUS), restarting..."
  cd "$(dirname "$0")"
  docker compose restart
  sleep 15
  NEW_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  echo "$(date) — After restart: HTTP $NEW_STATUS"
fi
