#!/bin/sh
set -e

if [ ! -f /var/lib/tracker/tracker.db ]; then
  sqlite3 /var/lib/tracker/tracker.db "PRAGMA journal_mode=WAL;"
fi

# Keep the container running
tail -f /dev/null
