# 🚀 Vercel デプロイ手順（Firebase 対応版）

## 📋 デプロイ前の準備

### Step 1: GitHub にプッシュ（すでにプッシュ済みの場合でも確認）

```bash
cd /Users/kaitaaya/Cursor/food_reminder_app

# 現在の変更をコミット
git add .
git commit -m "Add Firebase cloud saving functionality"

# GitHub にプッシュ
git push origin main
```

### Step 2: Vercel にデプロイ

#### 方法 A: GitHub から自動デプロイ（推奨）

1. [Vercel](https://vercel.com/) にアクセスしてログイン
2. 「Add New Project」をクリック
3. GitHub リポジトリを選択（`aya474747/talkfridge`）
4. プロジェクト設定：
   - **Framework Preset**: Other（または Blank）
   - **Root Directory**: `food_reminder_app`（リポジトリのルートの場合）
   - **Build Command**: （空欄のまま）
   - **Output Directory**: `public`
5. 「Deploy」をクリック
6. デプロイ完了後、Vercel から URL を取得（例：`talkfridge.vercel.app`）

#### 方法 B: Vercel CLI でデプロイ

```bash
# Vercel CLI をインストール（まだの場合）
npm i -g vercel

# ログイン
vercel login

# プロジェクトに移動
cd /Users/kaitaaya/Cursor/food_reminder_app

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

---

## ⚠️ デプロイ後の重要設定

### Step 3: Firebase 認証済みドメインに Vercel URL を追加（必須！）

**この設定をしないと、デプロイ後のサイトでログインできません！**

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `talkfridge-49568` を選択
3. 左メニューから「**Authentication**」をクリック
4. 「**設定**」タブを開く
5. 「**承認済みドメイン**」セクションまでスクロール
6. 「**ドメインを追加**」ボタンをクリック
7. **Vercel の URL を入力**（例：`talkfridge.vercel.app`）
   - ⚠️ **`https://` は含めない**（`talkfridge.vercel.app` のみ）
8. 「**追加**」をクリック

**確認：**

- `localhost` ✅
- `127.0.0.1` ✅（ローカル開発用）
- `talkfridge.vercel.app` ✅（デプロイ後）
- `talkfridge-49568.firebaseapp.com` ✅（自動で追加済み）

---

## ✅ デプロイ後の動作確認

### 1. アプリにアクセス

1. Vercel から取得した URL にアクセス（例：`https://talkfridge.vercel.app`）
2. アプリが正常に読み込まれることを確認

### 2. Firebase ログインを確認

1. 「食べた歴史」タブを開く
2. 「🔐 Google アカウントでログイン」ボタンをクリック
3. ログインが成功することを確認
4. 「ログイン中: [メールアドレス]」と表示されることを確認

### 3. データ保存を確認

1. 食材を追加（音声入力または手動入力）
2. Firebase Console → Firestore Database → データ
3. `users` コレクション → あなたのユーザー ID → データが保存されていることを確認

### 4. データの復元を確認

1. 別のブラウザまたはスマホで同じ URL にアクセス
2. Google アカウントでログイン
3. 先ほど追加した食材が表示されることを確認

---

## 🔄 今後の更新方法

### コードを更新した場合

1. ローカルで変更を加える
2. GitHub にプッシュ：
   ```bash
   git add .
   git commit -m "Update: 変更内容"
   git push origin main
   ```
3. Vercel が自動的にデプロイを開始します
4. 数分で新しいバージョンが公開されます

---

## 🚨 トラブルシューティング

### エラー：ログインできない（デプロイ後）

**原因：** Firebase の認証済みドメインに Vercel の URL が追加されていない

**解決方法：**

1. Firebase Console → Authentication → 設定 → 承認済みドメイン
2. Vercel の URL を追加（`https://` なし）

### エラー：データが保存されない

**確認事項：**

1. Firebase Console で Firestore Database が作成されているか
2. セキュリティルールが正しく設定されているか
3. ブラウザのコンソール（F12 > Console）でエラーを確認

### エラー：ページが表示されない

**確認事項：**

1. Vercel ダッシュボードでデプロイが成功しているか
2. `vercel.json` の設定が正しいか
3. `public` ディレクトリが正しくデプロイされているか

---

## 📝 チェックリスト

デプロイ完了までのチェックリスト：

- [ ] GitHub にコードをプッシュ
- [ ] Vercel でプロジェクトを作成・デプロイ
- [ ] Vercel から URL を取得
- [ ] Firebase Console で認証済みドメインに Vercel URL を追加
- [ ] デプロイ後のサイトでアプリが正常に読み込まれる
- [ ] デプロイ後のサイトで Firebase ログインできる
- [ ] 食材を追加して Firebase に保存されることを確認
- [ ] 別デバイスでログインしてデータが復元されることを確認

---

## 💡 次のステップ

デプロイが完了したら：

1. **URL をシェア**: 他の人にも使ってもらえます
2. **カスタムドメイン**: Vercel でカスタムドメインを設定することも可能
3. **PWA としてインストール**: スマホのホーム画面に追加できます

これで、どこからでもアクセスできて、データは自動的に Firebase に保存されます！

