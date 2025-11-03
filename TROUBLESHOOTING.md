# 🔧 トラブルシューティングガイド

このドキュメントは、TalkFridgeアプリで発生した問題とその解決方法を記録しています。

---

## 🎤 音声入力で登録できない問題

### 症状
- 音声入力後に `Can't find variable: addIngredients` エラーが発生
- IndexedDBの `VersionError` が発生

### 原因

#### 1. JavaScript読み込み順序の問題
**問題**: `DOMContentLoaded`で即座に実行していたため、`indexdb-store.js`が読み込まれる前に`addIngredients`を呼び出していた

**解決方法**:
```javascript
// ❌ 悪い例
document.addEventListener('DOMContentLoaded', function() {
    loadIngredients(); // addIngredientsがまだ読み込まれていない可能性
});

// ✅ 良い例
window.addEventListener('load', function() {
    // 関数の存在確認を追加
    if (typeof getIngredients === 'function' && typeof addIngredients === 'function') {
        loadIngredients();
    }
});
```

#### 2. IndexedDBのバージョンエラー
**問題**: 既存のDBがより高いバージョンで作成されているのに、コードで低いバージョンを使おうとしていた

**解決方法**:
```javascript
// ❌ 悪い例
const DB_VERSION = 1; // 既存DBがバージョン2以上だとエラー

// ✅ 良い例
const DB_VERSION = 2; // 既存DBのバージョン以上にする
// バージョンアップ処理も追加
request.onupgradeneeded = (event) => {
    const oldVersion = event.oldVersion;
    // 移行処理を追加
};
```

#### 3. ファイルパスの問題（Vercel環境）
**問題**: Vercel環境で相対パスが正しく解決されない場合がある

**解決方法**:
```html
<!-- ❌ 悪い例 -->
<script src="indexdb-store.js"></script>

<!-- ✅ 良い例 -->
<script src="./indexdb-store.js"></script>
```

---

## ⚠️ デプロイ時の注意事項

### Vercel設定
1. **vercel.jsonの確認**
   - `outputDirectory`が`public`になっているか
   - `rewrites`が正しく設定されているか

2. **ビルドコマンド**
   - 静的サイトの場合は`buildCommand`は最小限に
   - コミット情報を更新する場合は`node update-commit-info.js`

3. **ファイルパス**
   - 相対パスを使用する場合は`./`を明示
   - Vercel環境での動作確認を必須にする

### JavaScript読み込み順序の原則
1. **外部ライブラリを先に読み込む**
   ```html
   <script src="外部ライブラリ.js"></script>
   ```

2. **内部モジュールを次に読み込む**
   ```html
   <script src="./indexdb-store.js"></script>
   <script src="./parse-utils.js"></script>
   ```

3. **実行コードは最後に**
   - `window.addEventListener('load')`を使用
   - 関数の存在確認を追加

---

## 🐛 よくあるエラーと対処法

### エラー: `Can't find variable: addIngredients`
**原因**: JavaScriptファイルが読み込まれる前に実行されている

**対処法**:
1. `window.addEventListener('load')`を使用
2. 関数の存在確認を追加
3. エラーハンドリングを強化

### エラー: `VersionError: An attempt was made to open a database using a lower version`
**原因**: IndexedDBのバージョンが既存DBより低い

**対処法**:
1. `DB_VERSION`を既存DBのバージョン以上に上げる
2. `onupgradeneeded`でバージョンアップ処理を実装
3. 必要に応じてデータ移行処理を追加

### エラー: `404 Not Found` (JavaScriptファイル)
**原因**: ファイルパスが正しく解決されていない

**対処法**:
1. 相対パスを使用する場合は`./`を明示
2. Vercelの`outputDirectory`設定を確認
3. ブラウザの開発者ツールのNetworkタブで確認

---

## 📝 チェックリスト

### 新機能追加時
- [ ] JavaScriptファイルの読み込み順序を確認
- [ ] 関数の存在確認を追加
- [ ] エラーハンドリングを実装
- [ ] IndexedDBのバージョンを確認
- [ ] ファイルパスが正しく設定されているか確認

### デプロイ前
- [ ] `vercel.json`の設定を確認
- [ ] コミット情報が正しく表示されるか確認
- [ ] ブラウザの開発者ツールでエラーがないか確認
- [ ] 音声入力が動作するか確認
- [ ] データの保存・読み込みが正常に動作するか確認

### エラー発生時
- [ ] ブラウザのコンソールでエラーメッセージを確認
- [ ] Networkタブでファイルの読み込み状況を確認
- [ ] ApplicationタブでIndexedDBの状態を確認
- [ ] このドキュメントで過去の解決方法を確認

---

## 🔄 問題が発生した時のデバッグ手順

1. **ブラウザの開発者ツールを開く**
   - コンソールタブでエラーメッセージを確認
   - Networkタブでファイルの読み込み状況を確認

2. **エラーメッセージを記録**
   - エラーメッセージ全文をコピー
   - エラースタックトレースも記録

3. **状況を確認**
   - どの操作でエラーが発生したか
   - エラーが再現するか
   - 他のブラウザでも同じエラーが発生するか

4. **解決方法を検討**
   - このドキュメントで過去の事例を確認
   - エラーメッセージから原因を特定
   - 小さな変更で試行

---

最終更新: 2025-11-03

