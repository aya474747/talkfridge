# 🍽️ おしゃべり冷蔵庫

音声で食材を登録、AI でレシピ提案する冷蔵庫管理アプリ

## 📂 ファイル構成

```
food_reminder_app/
├── oshaberi_web_app.py    # メインのWebアプリ（起動ファイル）
├── ingredients_database.py # データベース管理
├── requirements.txt        # 依存関係
├── .env.example           # 環境変数のテンプレート
├── templates/
│   └── oshaberi.html      # フロントエンドUI
└── README_OSHABERI.md     # 詳細な使い方

```

---

## 🚀 起動方法

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

- 📱 **音声入力**: マイクボタンを押すだけ
- 🤖 **AI レシピ提案**: Gemini API 使用
- 📦 **在庫管理**: 数量・賞味期限を管理
- 🗓️ **賞味期限管理**: 期限切れ間近を通知
- 💰 **無料**: Gemini API 無料枠で運用

---

## ⚠️ トラブルシューティング

詳細なトラブルシューティングガイドは [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) を参照してください。

### よくある問題

#### エラー: `Can't find variable: addIngredients`
**原因**: JavaScriptファイルが読み込まれる前に実行されている

**解決方法**:
- `window.addEventListener('load')`を使用して、全てのリソースが読み込まれるまで待つ
- 関数の存在確認を追加（`typeof addIngredients === 'function'`）

#### エラー: IndexedDBのVersionError
**原因**: IndexedDBのバージョンが既存DBより低い

**解決方法**:
- `DB_VERSION`を既存DBのバージョン以上に上げる
- `onupgradeneeded`でバージョンアップ処理を実装

#### 音声認識が動かない

- Chrome ブラウザを使用してください（PC）
- iPhoneの場合はSafariを使用するか、iOSキーボードの音声入力を使用
- マイクの権限を許可してください

#### Vercelデプロイ時のエラー

- `vercel.json`の設定を確認（`outputDirectory`が`public`になっているか）
- ファイルパスは`./`で明示的に指定
- ビルドコマンドが正しく設定されているか確認

---

## 📄 詳細ドキュメント

- **詳しい使い方**: [`README_OSHABERI.md`](./README_OSHABERI.md)
- **トラブルシューティング**: [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)
- **開発メモ**: [`DEVELOPMENT_NOTES.md`](./DEVELOPMENT_NOTES.md)

---

## 🔧 PWA版について

現在の本番環境は**PWA版**（`public/`ディレクトリ）を使用しています。

- **デプロイ先**: Vercel
- **URL**: https://talkfridge.vercel.app
- **データ保存**: IndexedDB（ブラウザのローカルストレージ）
- **音声入力**: Web Speech API（iOSのChromeではiOSキーボードの音声入力を使用）
