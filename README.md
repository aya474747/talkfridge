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
