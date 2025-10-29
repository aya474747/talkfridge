# Render デプロイ問題の解決方法

## 🔍 よくある問題と解決策

### 1. デプロイが失敗する

**確認項目：**

- `Procfile`が正しく存在しているか
- `requirements.txt`が最新か
- `runtime.txt`の Python バージョンが正しいか

**解決方法：**

```bash
# 最新の変更をプッシュ
cd /Users/kaitaaya/Cursor/food_reminder_app
git add .
git commit -m "Fix Render deployment settings"
git push origin main
```

### 2. アプリが起動しない（502 エラー）

**原因：**

- ポート設定の不備
- gunicorn の設定問題
- 環境変数の不備

**解決方法：**

- Render ダッシュボードで環境変数を確認
- `GEMINI_API_KEY`が設定されているか確認
- ログを確認してエラーメッセージを特定

### 3. ビルドがタイムアウトする

**解決方法：**

- `requirements.txt`を最適化（不要なパッケージを削除）
- ビルドキャッシュをクリア

### 4. 環境変数が読み込まれない

**解決方法：**

1. Render ダッシュボード → サービス → Environment
2. `GEMINI_API_KEY`を追加
3. `FLASK_ENV=production`を追加
4. デプロイを再実行

## 🛠️ 手動修正手順

### Step 1: Render ダッシュボードで確認

1. https://dashboard.render.com にログイン
2. サービス一覧から「talkfridge」を選択
3. **Events**タブでエラーログを確認
4. **Logs**タブで実行時エラーを確認

### Step 2: 環境変数の設定

Render ダッシュボードで以下を設定：

```
GEMINI_API_KEY=your-api-key-here
FLASK_ENV=production
PYTHON_VERSION=3.11.7
PORT=10000
```

### Step 3: デプロイを再実行

- サービスの「Manual Deploy」→「Deploy latest commit」

## 🔄 代替案：手動でデプロイ設定をリセット

もし Render で解決しない場合：

### 方法 1: サービスを削除して再作成

1. Render ダッシュボードでサービスを削除
2. 新しい Web サービスを作成
3. GitHub リポジトリを選択：`aya474747/talkfridge`
4. 設定：
   - **Name**: `talkfridge`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn oshaberi_web_app:app --bind 0.0.0.0:$PORT --timeout 120`
5. 環境変数を設定
6. デプロイ

### 方法 2: Render 以外のサービスを使う

**Vercel（推奨）：**

- より簡単にデプロイ可能
- 無料枠あり
- HTTPS 自動

**Fly.io：**

- 完全な制御が可能
- 無料枠あり

**Railway：**

- GitHub 連携が簡単
- 無料枠あり

## 📝 デバッグ用チェックリスト

- [ ] `Procfile`が存在し、正しい形式か
- [ ] `requirements.txt`に gunicorn が含まれているか
- [ ] `runtime.txt`の Python バージョンが正しいか
- [ ] 環境変数`GEMINI_API_KEY`が設定されているか
- [ ] ポートが`$PORT`環境変数を使用しているか
- [ ] ログにエラーメッセージが出ていないか

## 🆘 まだ解決しない場合

具体的なエラーメッセージを共有してください。以下の情報があると解決しやすくなります：

1. Render のログ（エラーメッセージ）
2. デプロイの状態（Build / Deploy / Running）
3. どの段階で失敗するか（ビルド中 / デプロイ中 / 起動時）
