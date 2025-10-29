"""
ロリポップ（Nginx + Apache構成）でのデプロイ用WSGI設定ファイル
"""
import sys
import os

# アプリケーションのディレクトリをパスに追加
app_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, app_dir)

# 環境変数の読み込み（.envファイルがある場合）
from dotenv import load_dotenv
load_dotenv()

# アプリケーションをインポート
try:
    from oshaberi_web_app import app
    # Passenger用のアプリケーションオブジェクト
    application = app
except Exception as e:
    # エラーログを出力（本番環境では確認できるように）
    import logging
    logging.basicConfig(level=logging.ERROR)
    logging.error(f"Failed to import application: {e}")
    raise

if __name__ == "__main__":
    # ローカルテスト用
    port = int(os.environ.get('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=False)
