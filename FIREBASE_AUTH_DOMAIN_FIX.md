# 🔧 Firebase 認証ドメインエラーの解決方法

エラーメッセージ：

```
Firebase: This domain is not authorized for OAuth operations for your Firebase project.
Edit the list of authorized domains from the Firebase console. (auth/unauthorized-domain).
```

## 📝 解決手順

### ステップ 1: Firebase Console を開く

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `talkfridge-49568` を選択

### ステップ 2: Authentication の設定を開く

1. 左メニューから「**Authentication**」をクリック
2. 上にある「**設定**」タブをクリック
3. 下にスクロールして「**承認済みドメイン**」セクションを探す

### ステップ 3: ドメインを追加

以下のドメインを追加してください：

#### ローカル開発用

**`localhost` が既に入っていても、以下を試してください：**

1. **`127.0.0.1` を追加**（重要！）

   - 「**ドメインを追加**」ボタンをクリック
   - `127.0.0.1` と入力
   - 「**追加**」をクリック

   → ローカルサーバーが `127.0.0.1` で動いている場合、`localhost` だけでは認証できません。

#### デプロイ後（Vercel を使用している場合）

1. Vercel にデプロイした後の URL を取得（例：`talkfridge.vercel.app`）
2. Firebase Console で「**ドメインを追加**」ボタンをクリック
3. Vercel の URL を入力（`talkfridge.vercel.app`）
4. 「**追加**」をクリック

### ステップ 4: 動作確認

1. ブラウザでアプリを開く（強制リロード：Cmd + Shift + R）
2. 「食べた歴史」タブを開く
3. 「🔐 Google アカウントでログイン」ボタンをクリック
4. 今度はエラーなくログインできるはずです！

---

## ✅ 確認項目

追加したドメインが「承認済みドメイン」のリストに表示されていることを確認してください：

- ✅ `localhost`
- ✅ `127.0.0.1`（念のため）
- ✅ `talkfridge-49568.firebaseapp.com`（自動で追加されている）
- ✅ `your-app.vercel.app`（デプロイ後）

---

## 💡 よくある質問

**Q: ローカルでのみ使う場合も追加が必要？**
A: はい、ローカル開発でも `localhost` は必ず追加が必要です。

**Q: デプロイしたら自動で追加される？**
A: いいえ、手動で追加する必要があります。デプロイした URL も追加してください。

**Q: `localhost` が既に入っているのにまだエラーが出る**
A: 以下の対処を試してください：

1. **`127.0.0.1` を追加**（ローカルサーバーが `127.0.0.1` で動いている場合）
2. **ブラウザの完全なキャッシュクリア**：
   - Chrome: 設定 > プライバシーとセキュリティ > 閲覧履歴データの削除 > 「キャッシュされた画像とファイル」にチェック
   - Safari: 開発メニュー > キャッシュを空にする
3. **シークレット/プライベートモードで試す**
4. **ポート番号を確認**：URL が `localhost:5555` などになっていませんか？Firebase はポート番号を自動で認識するので、通常は問題ありませんが、念のため `localhost` だけで登録されていることを確認
