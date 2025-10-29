# ロリポップでのデプロイ方法

## 📋 前提条件

- ロリポップサーバー（PHP スタンダード以上推奨）
- ムームードメイン
- Python3 対応プラン（ロリポップでは Python3 が利用可能）

## 🚀 デプロイ手順（Nginx + Apache 構成対応）

### 1. ファイルのアップロード

1. **ロリポップのファイルマネージャーまたは FTP でアップロード**

   ```
   アップロードするファイル：
   - oshaberi_web_app.py
   - ingredients_database.py
   - requirements.txt
   - passenger_wsgi.py
   - .htaccess
   - templates/oshaberi.html
   - .env (またはサーバー上で作成)
   ```

2. **ディレクトリ構造**
   ```
   your-domain.com/
   ├── passenger_wsgi.py  ← これがエントリーポイント
   ├── .htaccess         ← Apache設定（Nginx経由）
   ├── oshaberi_web_app.py
   ├── ingredients_database.py
   ├── requirements.txt
   ├── templates/
   │   └── oshaberi.html
   └── .env (サーバー上で作成)
   ```

**重要**: ロリポップのサーバー構成（Nginx + Apache）では、Nginx がフロントエンドのリバースプロキシとして動作し、Apache が Passenger を通じて Python アプリを実行します。

### 2. Python パッケージのインストール

ロリポップのコントロールパネルから：

1. **SSH を有効化**（ロリポップの設定で SSH アクセスを許可）
2. **SSH でログイン**
   ```bash
   ssh your-username@lolipop-server.lolipop.jp
   ```
3. **Python 仮想環境を作成（推奨）**
   ```bash
   cd /home/users/0/your-username/web/your-app-directory
   python3 -m venv venv
   source venv/bin/activate
   pip install --user -r requirements.txt
   ```

または、ロリポップのコントロールパネルから「Python」設定で自動インストールを選択

### 3. 環境変数の設定

`.env`ファイルを作成（サーバー上で）：

```bash
# ロリポップサーバー上で作成
cd /home/users/0/your-username/web/your-app-directory
nano .env
```

`.env`の内容：

```env
GEMINI_API_KEY=your-gemini-api-key-here
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
PORT=5000
```

### 4. データベースの準備

ロリポップでは SQLite を使うか、外部の SQLite ファイルを使用できます。
サーバー上の`oshaberi_reizoko.db`が自動的に作成されます。

必要に応じて、ファイルのパーミッションを設定：

```bash
chmod 666 oshaberi_reizoko.db
```

### 5. HTTPS（SSL 証明書）の設定

1. **ロリポップのコントロールパネルにログイン**
2. **ドメイン設定** → **SSL 証明書**
3. **無料 SSL 証明書を発行**（Let's Encrypt など）
4. **HTTPS を有効化**

### 6. .htaccess の編集

**`.htaccess`ファイル内のパスを実際の値に変更**

SSH でログインして、実際のパスを確認：

```bash
pwd
# 出力例: /home/users/0/your-username/web/your-domain.com
```

`.htaccess`ファイル内の以下を編集：

```apache
PassengerAppRoot /home/users/0/実際のユーザー名/web/実際のディレクトリ名
```

**Nginx + Apache 構成の場合の注意点**:

- Nginx がフロントエンドでリクエストを受け取る
- Apache がバックエンドで Passenger を通じて Python アプリを実行
- `.htaccess`の Rewrite ルールが正常に動作することを確認（内部リクエストの処理）

### 7. アクセス確認

HTTPS の URL でアクセス：

```
https://your-domain.com/
```

マイクボタンを押して、マイクアクセスが許可されることを確認！

## ⚠️ 注意点

1. **Passenger が有効になっているか確認**

   - ロリポップのコントロールパネルで「Passenger」が有効になっているか確認

2. **Python バージョン**

   - ロリポップで利用可能な Python バージョンを確認（通常 Python 3.7 以上）

3. **メモリ制限**

   - ロリポップのプランによってメモリ制限があります
   - エラーが発生した場合は、ロリポップのサポートに問い合わせ

4. **ログの確認**
   - エラーが発生した場合、ロリポップのログを確認
   - `error_log`ファイルを確認

## 🔧 トラブルシューティング

### アプリが動かない場合

1. **`.htaccess`の設定を確認**

   - `PassengerAppRoot`のパスが正しいか確認
   - `PassengerStartupFile`が`passenger_wsgi.py`になっているか確認
   - Nginx + Apache 構成では、Rewrite ルールが適切に設定されているか

2. **`passenger_wsgi.py`のパスを確認**

   - ファイルが正しいディレクトリに配置されているか
   - Python のインポートパスが正しいか

3. **Python パッケージがインストールされているか確認**

   ```bash
   # SSHでログインして確認
   python3 -c "import flask"
   python3 -c "import google.generativeai"
   ```

4. **ロリポップのエラーログを確認**
   - コントロールパネル → ログ → エラーログ
   - Apache エラーログ: `error_log`
   - Passenger ログを確認

### 502 Bad Gateway エラーが出る場合（Nginx + Apache 構成）

Nginx + Apache 構成でよく発生する問題：

1. **Apache が正常に起動しているか確認**
   - ロリポップのコントロールパネルで Apache の状態を確認
2. **Passenger が有効になっているか確認**
   - `.htaccess`の`PassengerEnabled On`が正しいか
   - ロリポップのコントロールパネルで Passenger 設定を確認
3. **Python アプリが正常に起動しているか確認**
   - `passenger_wsgi.py`のインポートエラーがないか
   - 環境変数が正しく読み込まれているか
4. **ロリポップのサポートに問い合わせ**
   - Passenger の設定が必要な場合がある
   - サーバー構成の確認が必要な場合がある

### マイクが使えない場合

1. HTTPS でアクセスしているか確認（HTTP ではなく HTTPS）
2. ブラウザの設定でマイクが許可されているか確認
3. サイトの URL が HTTPS になっているか確認

## 📞 サポート

- ロリポップサポート: https://lolipop.jp/support/
- ドメイン設定: ムームードメインの管理画面
