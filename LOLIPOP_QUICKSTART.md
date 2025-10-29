# ロリポップ クイックスタートガイド

## ⚠️ 重要な前提条件

**ロリポップスタンダードプラン以上が必要です**
- ライトプランではPythonアプリは動作しません
- スタンダードプラン以上にアップグレードしてください

## 📦 アップロードするファイル一覧

ロリポップのファイルマネージャーまたはFTPで、以下のファイルをアップロードしてください：

```
✅ oshaberi_web_app.py
✅ ingredients_database.py
✅ passenger_wsgi.py
✅ .htaccess
✅ requirements.txt
✅ templates/
   └── oshaberi.html
```

**注意**: `.env`ファイルはサーバー上で作成します（後述）

## 🚀 デプロイ手順（簡易版）

### Step 1: ファイルをアップロード
ロリポップのファイルマネージャーまたはFTPで、上記のファイルをアップロード

### Step 2: SSHでログイン
```bash
ssh your-username@lolipop-server.lolipop.jp
```

### Step 3: Pythonパッケージをインストール
```bash
cd /home/users/0/your-username/web/your-domain.com
pip3 install --user -r requirements.txt
```

### Step 4: .htaccessを編集
```bash
nano .htaccess
```

以下の行を実際のパスに変更：
```apache
PassengerAppRoot /home/users/0/実際のユーザー名/web/実際のディレクトリ名
PassengerPython /usr/local/bin/python3
```

**現在のパスを確認：**
```bash
pwd
```

### Step 5: .envファイルを作成
```bash
nano .env
```

以下を入力：
```env
GEMINI_API_KEY=your-gemini-api-key-here
FLASK_ENV=production
SECRET_KEY=your-random-secret-key-here
```

**SECRET_KEYの生成方法：**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 6: ファイルのパーミッションを設定
```bash
chmod 644 .htaccess
chmod 644 passenger_wsgi.py
chmod 644 oshaberi_web_app.py
chmod 755 templates
chmod 644 templates/oshaberi.html
```

### Step 7: SSL証明書を設定
1. ロリポップのコントロールパネルにログイン
2. 「ドメイン設定」→「SSL証明書」
3. 無料SSL証明書を発行（Let's Encrypt推奨）
4. HTTPSを有効化

### Step 8: アクセス確認
```
https://your-domain.com/
```

ブラウザでアクセスして、アプリが表示されることを確認！

## 🔍 トラブルシューティング

### 502 Bad Gatewayエラー
- `.htaccess`の`PassengerAppRoot`のパスが正しいか確認
- Pythonパッケージがインストールされているか確認
- ロリポップのコントロールパネルでPassengerが有効か確認

### アプリが起動しない
- SSHでログを確認：
  ```bash
  tail -f error_log
  ```
- `passenger_wsgi.py`のインポートエラーを確認

### マイクが使えない
- **HTTPSでアクセスしているか確認**（HTTPではなくHTTPS）
- ブラウザの設定でマイクが許可されているか確認

## 📞 サポート

- ロリポップ公式サポート: https://lolipop.jp/support/
- エラーログを確認して、ロリポップサポートに問い合わせる場合は、エラーメッセージを共有してください

## ✅ チェックリスト

- [ ] ロリポップスタンダードプラン以上にアップグレード済み
- [ ] ファイルをアップロード済み
- [ ] SSHアクセスが可能
- [ ] Pythonパッケージをインストール済み
- [ ] `.htaccess`のパスを編集済み
- [ ] `.env`ファイルを作成済み
- [ ] SSL証明書を設定済み
- [ ] HTTPSでアクセスできることを確認済み
- [ ] マイクボタンが動作することを確認済み

## 💡 ヒント

- 初回デプロイでは、ロリポップのサポートに問い合わせることも検討してください
- Passengerの設定が必要な場合があります
- エラーログを確認することで、問題を特定しやすくなります


