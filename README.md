# 🍽️ TalkFridge

音声で食材を登録、AI でレシピ提案する冷蔵庫管理アプリ（PWA版）

**バージョン：** `1.0.1` (2025-10-29)  
**最新の変更：** [CHANGELOG.md](./CHANGELOG.md) を参照

## 📂 ファイル構成

```
food_reminder_app/
├── public/                # PWA版（Vercelデプロイ用）
│   ├── index.html        # メインHTML（PWA版）
│   ├── indexdb-store.js  # IndexedDBストア
│   └── parse-utils.js    # 音声解析ユーティリティ
├── oshaberi_web_app.py    # メインのWebアプリ（旧版、未使用）
├── ingredients_database.py # データベース管理（旧版、未使用）
├── requirements.txt        # 依存関係（旧版、未使用）
├── .env.example           # 環境変数のテンプレート
├── vercel.json            # Vercel設定ファイル
├── VERSION                # 現在のバージョン番号
├── CHANGELOG.md           # 更新履歴
└── README.md              # このファイル

```

**注意：** 現在は完全PWA版（`public/`ディレクトリ）をVercelでデプロイしています。旧版のFlaskアプリ（`oshaberi_web_app.py`）は使用していません。

---

## 🚀 デプロイ状況

**本番環境：** Vercelで自動デプロイ  
**URL：** https://talkfridge.vercel.app （例）

詳細は [Vercelダッシュボード](https://vercel.com/dashboard) で確認できます。

---

## 🚀 ローカル開発（旧版、参考用）

### 1. 環境変数の設定

```bash
cd /Users/kaitaaya/Cursor/food_reminder_app

# .env ファイルを作成
cp .env.example .env

# .env ファイルを編集
nano .env
```

`.env` ファイルに Gemini API キーを設定：

```
GEMINI_API_KEY=あなたが取得したAPIキー
FLASK_ENV=development
SECRET_KEY=oshaberi-secret-key
PORT=5001
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. アプリの起動

```bash
python oshaberi_web_app.py
```

### 4. ブラウザでアクセス

```
http://localhost:5001
```

---

## 📱 使い方

### 食材の登録（音声入力）

1. 右下のマイクボタン 🎤 を押す
2. 「鶏肉 2 枚、トマト 3 個、ニンジン 2 本」と話す
3. 自動で食材が登録される

### レシピ提案

1. 「レシピ提案」タブを開く
2. 「今ある食材でレシピ提案」ボタンを押す
3. AI がレシピを提案

### 食材の使用

1. 食材一覧で「使用」ボタンを押す
2. 在庫から自動で減算

---

## 💡 特徴

### PWA版の特徴
- 📱 **PWA対応**: オフライン利用可能、スマホにインストール可能
- 🎤 **音声入力**: 連続食材名の分割・商品名自動認識
- 🤖 **AI レシピ提案**: Gemini API 使用（クライアント側から直接呼び出し）
- 📦 **在庫管理**: IndexedDBでローカル保存
- 💾 **データ保存**: ブラウザのIndexedDBに保存（サーバー不要）
- 💰 **完全無料**: Vercel無料プラン + Gemini API無料枠

### 技術スタック
- **フロントエンド**: HTML/CSS/JavaScript (PWA)
- **データベース**: IndexedDB（ブラウザ内蔵）
- **デプロイ**: Vercel（無料）
- **AI**: Google Gemini API（無料枠）

---

## ⚠️ トラブルシューティング

### エラー: Gemini API is not configured

`.env` ファイルに Gemini API キーを設定してください。

### 音声認識が動かない

- Chrome ブラウザを使用してください
- マイクの権限を許可してください

### ポートが既に使われている

```bash
PORT=5002 python oshaberi_web_app.py
```

---

## 📄 詳細

詳しい使い方は `README_OSHABERI.md` を参照してください。
