# Fly.io用Dockerfile
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY . .

# ポートを公開（Fly.ioは自動的にポートを設定）
EXPOSE 8080

# 環境変数を設定
ENV FLASK_APP=oshaberi_web_app.py
ENV FLASK_ENV=production
ENV PORT=8080

# アプリケーションを起動（gunicornを使用）
CMD ["gunicorn", "oshaberi_web_app:app", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120"]


