# Vercel + Render ハイブリッド構成

## 🔧 構成

**フロントエンド**: Vercel（無料・高速配信）  
**バックエンド API**: Render（無料枠）

**フロー：**

```
ユーザー → Vercel（HTML） → Render（API） → データベース
```

---

## 📝 実装手順

### Step 1: Render でバックエンド API をデプロイ

1. Render で Flask アプリをデプロイ
2. URL を取得（例：`https://talkfridge-api.onrender.com`）

### Step 2: Vercel のフロントエンドから API を呼び出す

**現在：**

```javascript
fetch("/api/get-ingredients"); // 相対パス（動作しない）
```

**修正後：**

```javascript
const API_URL = "https://talkfridge-api.onrender.com";
fetch(`${API_URL}/api/get-ingredients`); // 絶対パス
```

### Step 3: 環境変数で API URL を管理

**vercel.json に追加：**

```json
{
  "env": {
    "API_URL": "https://talkfridge-api.onrender.com"
  }
}
```

---

## 🚀 今すぐできること

**方法 1：API URL を直接指定**

HTML 内で API URL を環境変数や設定として指定します。

**方法 2：完全 PWA 化**

API 呼び出しを削除して、すべて JavaScript + IndexedDB で処理します。

**どちらで進めますか？**

- ハイブリッド（Vercel + Render）：既存の Flask API を活用
- 完全 PWA 化：サーバー不要、完全無料

