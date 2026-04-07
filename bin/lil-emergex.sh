#!/bin/bash
# Launch Lil EmergeX - the emergex dock companion
# Usage: lil-emergex [build|open|kill|log|status]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$SCRIPT_DIR/apps/lil-emergex/build/Lil EmergeX.app"

case "${1:-start}" in
  build)
    bash "$SCRIPT_DIR/apps/lil-emergex/build.sh"
    ;;
  open|start)
    # Build if not built
    if [ ! -d "$APP_DIR" ]; then
      echo "Building Lil EmergeX first..."
      bash "$SCRIPT_DIR/apps/lil-emergex/build.sh"
    fi
    # Kill existing if running
    pkill -f LilEmergeX 2>/dev/null || true
    sleep 0.5
    open "$APP_DIR"
    echo "Lil EmergeX is on your Dock"
    ;;
  kill|stop)
    pkill -f LilEmergeX 2>/dev/null && echo "Lil EmergeX stopped" || echo "Not running"
    ;;
  restart)
    pkill -f LilEmergeX 2>/dev/null || true
    sleep 1
    open "$APP_DIR"
    echo "Lil EmergeX restarted"
    ;;
  log|logs)
    tail -f ~/.emergex/lil-emergex.log
    ;;
  status)
    if pgrep -f LilEmergeX > /dev/null 2>&1; then
      PID=$(pgrep -f LilEmergeX)
      echo "Lil EmergeX running (pid $PID)"
      echo "Log: ~/.emergex/lil-emergex.log"
      tail -3 ~/.emergex/lil-emergex.log 2>/dev/null
    else
      echo "Lil EmergeX is not running"
    fi
    ;;
  *)
    echo "Usage: lil-emergex [start|build|kill|restart|log|status]"
    ;;
esac
