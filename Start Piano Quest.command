#!/bin/zsh
# Double-click me to start Piano Quest!
cd "$(dirname "$0")"
PORT=8742
( sleep 1 && open "http://localhost:$PORT" ) &
echo "🎹 Piano Quest is running at http://localhost:$PORT"
echo "   Keep this window open while playing. Press Ctrl+C to stop."
python3 -m http.server $PORT
