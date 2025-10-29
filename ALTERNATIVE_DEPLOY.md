# ロリポップライトプラン非対応の代替デプロイ方法

## ⚠️ ロリポップライトプランの制限

**ロリポップライトプランでは以下の理由で Python アプリが動作しません：**

- Python/Flask 非対応（PHP/CGI のみ）
- Passenger 非対応
- SSH アクセス制限

## ✅ 推奨解決策

### 1. Render を使う（既に設定済み・無料）

**メリット：**

- ✅ 無料枠あり
- ✅ HTTPS 自動設定
- ✅ GitHub 連携で自動デプロイ
- ✅ Python/Flask 完全対応

**手順：**

1. GitHub にプッシュ済み（`aya474747/talkfridge`）
2. Render ダッシュボードでサービスを確認
3. 環境変数`GEMINI_API_KEY`を設定
4. デプロイ完了後に HTTPS でアクセス

**URL 例：**

```
https://talkfridge.onrender.com
```

### 2. Fly.io を使う（無料）

**メリット：**

- ✅ 無料枠あり（3 つの共有 CPU、3GB RAM）
- ✅ HTTPS 自動設定
- ✅ 全世界に高速配信

**セットアップ：**

```bash
# Fly.io CLIをインストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# アプリを作成
cd /Users/kaitaaya/Cursor/food_reminder_app
fly launch

# デプロイ
fly deploy
```

**必要なファイル：**

- `fly.toml`（自動生成される）
- `Dockerfile`（作成が必要な場合）

### 3. Railway を使う（無料枠あり）

**メリット：**

- ✅ 無料枠あり（$5 分のクレジット）
- ✅ HTTPS 自動設定
- ✅ GitHub 連携

**手順：**

1. https://railway.app でアカウント作成
2. 「New Project」→「Deploy from GitHub」
3. `aya474747/talkfridge`を選択
4. 環境変数を設定
5. 自動デプロイ

### 4. プランアップグレード（ロリポップスタンダード以上）

**ロリポップスタンダードプランにアップグレード：**

- Python/Flask 対応
- Passenger 利用可能
- SSH アクセス可能

**料金：**

- スタンダードプラン：月額数百円〜数千円
- ドメイン代が別途必要（ムームードメイン使用可能）

## 📊 比較表

| サービス                   | 無料枠 | HTTPS | セットアップ     | 推奨度     |
| -------------------------- | ------ | ----- | ---------------- | ---------- |
| **Render**                 | ✅     | ✅    | 簡単（設定済み） | ⭐⭐⭐⭐⭐ |
| Fly.io                     | ✅     | ✅    | 中程度           | ⭐⭐⭐⭐   |
| Railway                    | ✅     | ✅    | 簡単             | ⭐⭐⭐⭐   |
| ロリポップ（スタンダード） | ❌     | ✅    | 中程度           | ⭐⭐⭐     |

## 🎯 今すぐ使える方法

**Render を使う（最も簡単）：**

1. https://dashboard.render.com にログイン
2. 「talkfridge」サービスを確認
3. 環境変数に`GEMINI_API_KEY`が設定されているか確認
4. デプロイが完了したら、HTTPS の URL でアクセス

```bash
# 最新の変更をプッシュ（既に完了済み）
cd /Users/kaitaaya/Cursor/food_reminder_app
git push origin main
```

**Render の URL：**

```
https://talkfridge.onrender.com
```

## 💡 おすすめ

**Render を使用することをおすすめします：**

- ✅ 既に GitHub にプッシュ済み
- ✅ Procfile などの設定ファイルも用意済み
- ✅ 無料で HTTPS 利用可能
- ✅ 自動デプロイ設定済み

ロリポップライトプランでは動作しないため、Render か他の無料ホスティングサービスをご利用ください。
