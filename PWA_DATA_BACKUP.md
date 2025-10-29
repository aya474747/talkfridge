# PWA 版でのデータ保護方法

## ⚠️ データが消える可能性があるケース

1. **ブラウザのデータクリア**

   - キャッシュ・Cookie 削除時に消える可能性
   - ブラウザの設定で「サイトデータを削除」すると消える

2. **プライベートモード**

   - プライベートブラウジング中は一時的な保存のみ
   - タブを閉じると消える

3. **デバイスの初期化**

   - スマホの初期化で消える

4. **ブラウザの再インストール**
   - アプリを削除して再インストールすると消える

## 🛡️ データ保護の解決策

### 1. **自動バックアップ機能** ⭐⭐⭐⭐⭐

**実装内容：**

- 定期的にデータをエクスポート（JSON 形式）
- Google Drive / Dropbox に自動アップロード
- または、ローカルファイルとしてダウンロード

**メリット：**

- ✅ 自動でバックアップ
- ✅ 複数の場所に保存可能
- ✅ 手動操作不要

**実装例：**

```javascript
// 1日1回、自動でバックアップ
function autoBackup() {
  const data = exportAllData(); // 全データを取得
  const json = JSON.stringify(data, null, 2);

  // Google Drive APIでアップロード
  // または、ダウンロードリンクを作成
  downloadAsFile(json, `talkfridge-backup-${Date.now()}.json`);
}
```

---

### 2. **手動エクスポート/インポート機能** ⭐⭐⭐⭐

**実装内容：**

- 「データをエクスポート」ボタン
- JSON ファイルとしてダウンロード
- 「データをインポート」ボタン
- ファイルを選択して復元

**メリット：**

- ✅ ユーザーが完全にコントロール
- ✅ 任意のタイミングでバックアップ
- ✅ 別のデバイスに移行可能

**UI 例：**

```
[設定] タブ
├─ [データをエクスポート] → ダウンロード
├─ [データをインポート] → ファイル選択
└─ [自動バックアップ設定]
   ├─ 毎日自動バックアップ
   └─ Google Driveに保存
```

---

### 3. **ブラウザの同期機能を活用** ⭐⭐⭐

**実装内容：**

- Chrome の場合：Google アカウントでログインすると自動同期
- Firefox の場合：Firefox アカウントで同期

**メリット：**

- ✅ ブラウザ標準機能を使用
- ✅ 複数デバイスで同期
- ✅ 追加実装不要

**注意点：**

- ❌ ブラウザ依存
- ❌ ユーザーがログインしている必要がある

---

### 4. **クラウドストレージ連携** ⭐⭐⭐⭐⭐

**実装内容：**

- Google Drive API と連携
- または Dropbox API と連携
- 定期的に自動バックアップ

**メリット：**

- ✅ 安全な場所に保存
- ✅ 複数デバイスでアクセス可能
- ✅ ブラウザに依存しない

**実装例：**

```javascript
// Google Drive APIを使用
async function backupToGoogleDrive() {
  const data = await getAllIngredients();
  const file = new Blob([JSON.stringify(data)], { type: "application/json" });

  // Google Driveにアップロード
  await uploadToGoogleDrive(file, "talkfridge-backup.json");
}
```

---

### 5. **ローカルファイルへのバックアップ** ⭐⭐⭐

**実装内容：**

- 「バックアップをダウンロード」ボタン
- 定期ダウンロードの推奨メッセージ表示

**メリット：**

- ✅ シンプル
- ✅ 追加の API 登録不要
- ✅ ユーザーの PC に保存

**デメリット：**

- ❌ ユーザーが手動で実行する必要
- ❌ PC が壊れると消えるリスク

---

## 🎯 推奨実装：複数機能の組み合わせ

### レベル 1：基本機能

1. **手動エクスポート/インポート**
   - 「設定」タブに追加
   - JSON 形式でダウンロード/アップロード

### レベル 2：自動化

2. **自動バックアップ**
   - 1 日 1 回、自動でローカルファイルにエクスポート
   - または、Google Drive に自動アップロード

### レベル 3：高度な機能

3. **クラウド同期**
   - Google Drive / Dropbox と連携
   - 複数デバイスで同じデータを共有

## 📊 実装の優先順位

| 機能                             | 難易度 | 効果       | 優先度   |
| -------------------------------- | ------ | ---------- | -------- |
| **手動エクスポート/インポート**  | ⭐⭐   | ⭐⭐⭐⭐   | 最優先   |
| **自動バックアップ（ローカル）** | ⭐⭐   | ⭐⭐⭐     | 優先     |
| **Google Drive 連携**            | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 将来的に |
| **Dropbox 連携**                 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 将来的に |

## 💡 実装例：エクスポート/インポート機能

```javascript
// エクスポート機能
function exportData() {
  const ingredients = getAllIngredientsFromIndexedDB();
  const recipeHistory = getAllRecipeHistory();

  const exportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    ingredients: ingredients,
    recipeHistory: recipeHistory,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `talkfridge-backup-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// インポート機能
async function importData(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  // データを検証
  if (!data.ingredients || !data.recipeHistory) {
    throw new Error("無効なバックアップファイルです");
  }

  // IndexedDBに復元
  await restoreIngredients(data.ingredients);
  await restoreRecipeHistory(data.recipeHistory);

  alert("✅ データを復元しました！");
  location.reload();
}
```

## 🚀 実装する？

これらの機能を追加すれば、データ損失のリスクを大幅に減らせます。

**最小実装（最優先）：**

1. 手動エクスポート/インポート機能
2. 定期的なバックアップ推奨メッセージ

**完全実装：** 3. 自動バックアップ（ローカル） 4. Google Drive 連携（オプション）

これらを追加すれば、ユーザーが安心して使えます！

