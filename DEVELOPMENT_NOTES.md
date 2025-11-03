# 📝 開発メモ

このファイルは、開発中に発生した問題や学んだことを記録しています。

---

## 🎯 重要な原則

### 1. JavaScript読み込み順序の原則

**原則**: 外部依存関数を使う前に、必ずその関数が読み込まれていることを確認する

```javascript
// ✅ 正しいパターン
window.addEventListener('load', function() {
    if (typeof addIngredients === 'function') {
        // 安全に使用できる
        loadIngredients();
    } else {
        console.error('必要な関数が読み込まれていません');
    }
});
```

**なぜ重要か**:
- `DOMContentLoaded`はDOMが読み込まれた時点で発火するが、JavaScriptファイルはまだ読み込まれていない可能性がある
- Vercelなどの本番環境では、ファイルの読み込みタイミングが開発環境と異なる場合がある

### 2. IndexedDBのバージョン管理

**原則**: IndexedDBのバージョンは、既存のDBより低いバージョンで開こうとしない

```javascript
// ✅ 正しいパターン
const DB_VERSION = 2; // 既存DBのバージョン以上にする

request.onupgradeneeded = (event) => {
    const oldVersion = event.oldVersion;
    // バージョンアップ時の処理を実装
};
```

**なぜ重要か**:
- ユーザーのブラウザに既にDBが作成されている場合、バージョンが下がるとエラーになる
- データ移行が必要な場合は、`onupgradeneeded`で処理する

### 3. ファイルパスの明示

**原則**: Vercelなどの本番環境では、相対パスを明示的に指定する

```html
<!-- ✅ 正しいパターン -->
<script src="./indexdb-store.js"></script>
```

**なぜ重要か**:
- 開発環境と本番環境でパスの解決方法が異なる場合がある
- `./`を明示することで、確実に相対パスとして解決される

---

## 🔄 過去に発生した問題

### 2025-11-03: 音声入力で登録できない問題

**発生したエラー**:
1. `Can't find variable: addIngredients`
2. `VersionError: An attempt was made to open a database using a lower version`

**原因**:
1. JavaScript読み込み順序の問題（`DOMContentLoaded`を使用していた）
2. IndexedDBのバージョンが既存DBより低かった
3. ファイルパスが明示的でなかった

**解決方法**:
1. `window.addEventListener('load')`に変更し、関数の存在確認を追加
2. `DB_VERSION`を2に上げ、バージョンアップ処理を実装
3. ファイルパスを`./indexdb-store.js`に変更

**学んだこと**:
- 本番環境での動作確認は必須
- エラーハンドリングは積極的に追加する
- 過去のエラーを記録しておくことで、同じ問題を繰り返さない

---

## ✅ デプロイ前チェックリスト

### Vercelデプロイ時
- [ ] `vercel.json`の設定が正しいか確認
- [ ] `outputDirectory`が`public`になっているか
- [ ] ファイルパスが`./`で明示されているか
- [ ] JavaScriptファイルの読み込み順序が正しいか
- [ ] 関数の存在確認が追加されているか
- [ ] IndexedDBのバージョンが既存DB以上か
- [ ] コミット情報が正しく表示されるか

### コード変更時
- [ ] 外部依存関数を使う前に存在確認を追加
- [ ] エラーハンドリングを実装
- [ ] コンソールログでデバッグ情報を出力
- [ ] ブラウザの開発者ツールで動作確認

---

## 🚫 やってはいけないこと

### ❌ 悪い例1: 読み込み順序を考慮しない
```javascript
// ❌ DOMContentLoadedですぐ実行
document.addEventListener('DOMContentLoaded', function() {
    loadIngredients(); // addIngredientsが読み込まれていない可能性
});
```

### ❌ 悪い例2: IndexedDBのバージョンを下げる
```javascript
// ❌ 既存DBがバージョン2なのに、コードでバージョン1を使う
const DB_VERSION = 1; // エラーになる
```

### ❌ 悪い例3: ファイルパスを明示しない
```html
<!-- ❌ 相対パスが曖昧 -->
<script src="indexdb-store.js"></script>
```

---

## 💡 ベストプラクティス

1. **常に存在確認を追加**
   ```javascript
   if (typeof functionName === 'function') {
       functionName();
   }
   ```

2. **エラーハンドリングを積極的に実装**
   ```javascript
   try {
       // 処理
   } catch (error) {
       console.error('エラー:', error);
       alert('エラーが発生しました: ' + error.message);
   }
   ```

3. **本番環境での動作確認**
   - Vercelデプロイ後に必ず動作確認
   - 複数のブラウザで確認
   - モバイルデバイスでも確認

4. **過去のエラーを記録**
   - このファイルに記録
   - `TROUBLESHOOTING.md`にも追加

---

最終更新: 2025-11-03

