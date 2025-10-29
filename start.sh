#!/bin/bash
# Render起動用スクリプト（デバッグ用）
echo "🚀 Starting TalkFridge app..."
echo "Port: $PORT"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Files in directory:"
ls -la
echo "---"

# gunicornで起動
exec gunicorn oshaberi_web_app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --threads 2 --access-logfile - --error-logfile - --log-level debug

