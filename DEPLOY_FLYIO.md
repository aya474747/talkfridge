# Fly.io デプロイガイド（推奨）

## 🚀 Fly.io は Flask アプリに最適！

**メリット：**

- ✅ Flask アプリをそのままデプロイ可能
- ✅ SQLite データベースが使える
- ✅ 無料枠が充実（3 つの共有 CPU、3GB RAM）
- ✅ 全世界に高速配信
- ✅ HTTPS 自動設定

## 📋 セットアップ手順

### Step 1: Fly.io CLI をインストール

**macOS:**

```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Linux:**

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Fly.io にログイン

```bash
fly auth login
```

ブラウザが開くので、Fly.io アカウントでログイン（無料で作成可能）

### Step 3: アプリを作成

```bash
cd /Users/kaitaaya/Cursor/food_reminder_app
fly launch
```

初回起動時に以下を設定：

- App name: `talkfridge`（または好きな名前）
- Region: `nrt`（東京）を推奨
- PostgreSQL: `n`（SQLite を使うため不要）
- Redis: `n`（不要）

### Step 4: 環境変数を設定

```bash
# Gemini APIキーを設定
fly secrets set GEMINI_API_KEY=your-api-key-here

# その他の環境変数（オプション）
fly secrets set FLASK_ENV=production
```

### Step 5: デプロイ

```bash
fly deploy
```

初回デプロイには数分かかります。

### Step 6: アクセス確認

```bash
# URLを確認
fly open

# または
fly status
```

例：`https://talkfridge.fly.dev`

## 🔧 トラブルシューティング

### デプロイが失敗する場合

```bash
# ログを確認
fly logs

# ビルドログを確認
fly logs --build
```

### 環境変数を確認

```bash
# 設定されている環境変数を確認
fly secrets list
```

### アプリを再起動

```bash
fly apps restart talkfridge
```

### データベースのパスを確認

```bash
# シェルにアクセス
fly ssh console

# データベースファイルの場所を確認
ls -la *.db
```

## 💰 無料枠について

**Fly.io 無料枠：**

- 3 つの共有 CPU マシン
- 3GB RAM
- 160GB 転送/月
- 通常の個人利用では十分

**料金が発生する場合：**

- 有料プランにアップグレードした場合
- 無料枠を超えた使用量がある場合

## 📊 パフォーマンス調整

### メモリを増やす（必要に応じて）

`fly.toml`を編集：

```toml
[[vm]]
  memory_mb = 1024  # 512MB → 1GBに増やす
```

```bash
fly deploy
```

## 🔒 HTTPS 設定

Fly.io は自動的に HTTPS を設定します。追加の設定は不要です。

## 🎯 マイクアクセスの確認

1. HTTPS の URL でアクセス（例：`https://talkfridge.fly.dev`）
2. マイクボタンを押す
3. ブラウザからマイク許可のプロンプトが表示される
4. 「許可」を選択

## 📝 よくある質問

**Q: SQLite データベースは永続化されますか？**
A: はい、Fly.io のボリューム機能で永続化できます。必要に応じて設定できます。

**Q: 無料枠で使えますか？**
A: はい、このアプリは無料枠で十分動作します。

**Q: Render と比べて何が違いますか？**
A: Fly.io は完全な VM 環境で動作するため、従来の Flask アプリをそのまま動かせます。Render はプラットフォーム特有の設定が必要な場合があります。

## 🆘 サポート

問題が発生した場合：

1. `fly logs`でログを確認
2. Fly.io のドキュメント: https://fly.io/docs
3. Fly.io コミュニティ: https://community.fly.io

