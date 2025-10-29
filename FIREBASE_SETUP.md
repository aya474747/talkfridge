# 🔥 Firebase セットアップガイド

## 📋 手順

### Step 1: Firebase Console で設定を取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクトの設定（⚙️ アイコン）をクリック
4. 「マイアプリ」セクションで「Web アプリを追加」をクリック
5. アプリのニックネームを入力して登録
6. **設定情報をコピー**（以下のような形式）：
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
   };
   ```

### Step 2: Authentication を有効化

1. Firebase Console の左メニューから「認証」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを開く
4. 「Google」を選択
5. 「有効にする」を ON にする
6. プロジェクトのサポートメールを選択（自動で設定されている場合が多い）
7. 「保存」をクリック

### Step 3: Firestore を有効化

1. Firebase Console の左メニューから「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. **「本番環境モードで開始」を選択**（テストモードでも OK ですが、本番モードの方が安全）
4. ロケーションを選択（例：`asia-northeast1` = 東京）
5. 「有効にする」をクリック

### Step 4: セキュリティルールを設定（重要）

1. Firestore Database の「ルール」タブを開く
2. 以下のルールを設定（ユーザーは自分のデータのみ読み書き可能）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. 「公開」をクリック

### Step 5: アプリに設定を反映

1. `public/firebase-config.js` ファイルを開く
2. Firebase Console からコピーした設定を貼り付け：

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

3. `YOUR_API_KEY` などを実際の値に置き換える

### Step 6: 動作確認

1. アプリを開く（Vercel デプロイまたはローカルサーバー）
2. 「食べた歴史」タブを開く
3. 「🔐 Google アカウントでログイン」ボタンをクリック
4. Google アカウントでログイン
5. ログイン成功後、「ログイン中: [メールアドレス]」と表示されることを確認
6. 食材を追加してみて、自動的に Firebase に保存されることを確認

---

## ✅ 動作確認チェックリスト

- [ ] Firebase Console でプロジェクトを作成
- [ ] Firebase 設定情報を取得
- [ ] Authentication（Google）を有効化
- [ ] Firestore を有効化
- [ ] セキュリティルールを設定
- [ ] `firebase-config.js` に設定を記述
- [ ] アプリでログインできる
- [ ] 食材を追加すると Firebase に保存される
- [ ] 他のデバイスでログインするとデータが同期される

---

## 🚨 トラブルシューティング

### 「Firebase SDK が読み込まれていません」エラー

→ Firebase SDK の CDN が正しく読み込まれているか確認してください。

### 「Firebase 設定がまだです」エラー

→ `firebase-config.js` に設定が正しく記述されているか確認してください。

### ログインできない

→ Firebase Console で Authentication > Sign-in method で Google が有効になっているか確認してください。

### データが保存されない

→ Firestore のセキュリティルールを確認してください。また、Firebase Console の Firestore Database でデータが保存されているか確認してください。

---

## 💡 その他の機能

### 複数ユーザーでの使用

- 各ユーザーは自分の Google アカウントでログイン
- データは自動的にユーザーごとに分離されます
- 他のユーザーのデータにはアクセスできません

### データの復元

- ログインすると自動的に Firestore からデータを読み込んで IndexedDB に同期します
- ブラウザのデータを削除しても、Firebase にログインすればデータが復元されます

