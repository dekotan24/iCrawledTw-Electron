# 🚀 クイックスタートガイド

## 📁 ファイル構成

以下のファイルをすべて同じフォルダに配置してください：

```
twitter-media-downloader/
├── 📄 package.json              # プロジェクト設定
├── 📄 main.js                   # Electronメインプロセス
├── 📄 preload.js                # IPCブリッジ
├── 📄 renderer.js               # フロントエンドロジック  
├── 📄 twitter-scraper.js        # メディア抽出エンジン
├── 📄 index.html                # メインUI
├── 📄 style.css                 # スタイルシート
├── 📄 setup.bat                 # Windows用セットアップ
├── 📄 run.bat                   # Windows用起動スクリプト
├── 📄 README.md                 # 詳細マニュアル
└── 📁 assets/                   # アイコンフォルダ（後で作成）
    ├── 🖼️ icon.png             # アプリアイコン（256x256推奨）
    ├── 🖼️ icon.ico             # Windows用アイコン
    └── 🖼️ icon.icns            # macOS用アイコン
```

## ⚡ 超簡単セットアップ（Windows）

### 1️⃣ 準備
1. **Node.js をインストール** (まだの場合)
   - https://nodejs.org/ から最新版をダウンロード
   - インストール時は全部「次へ」でOK

### 2️⃣ セットアップ
1. **setup.bat をダブルクリック**
   ```
   Twitter Media Downloader - セットアップ
   [1/5] Node.jsの確認中...
   ✅ Node.js v18.17.0 が見つかりました
   [2/5] 依存関係をインストール中...
   ✅ 依存関係のインストールが完了しました
   ...
   ✅ セットアップが完了しました！
   ```

### 3️⃣ 起動
1. **run.bat をダブルクリック**
   ```
   🚀 Twitter Media Downloader を起動中...
   ✅ アプリケーションを起動しています...
   ```

2. **美しいアプリが起動！** 🎉

## 🐧 Linux/macOS の場合

### 1️⃣ 準備
```bash
# Node.jsをインストール（まだの場合）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu/Debian

# または
brew install node  # macOS
```

### 2️⃣ セットアップ
```bash
# 実行権限を付与
chmod +x install.sh run.sh

# セットアップ実行
./install.sh
```

### 3️⃣ 起動
```bash
./run.sh
```

## 🎯 基本的な使い方

### 1. TwitterのURLをコピー
- ツイートページを開く
- URLをコピー（例：`https://twitter.com/username/status/1234567890`）

### 2. アプリでURLを貼り付け
- URL入力欄にペースト
- または「📋貼り付け」ボタンをクリック

### 3. メディアを分析
- 「🔍メディアを分析」をクリック
- 自動で画像・動画を検出

### 4. ダウンロード
- 欲しいメディアを選択
- 「⬇️選択項目をダウンロード」をクリック

### 5. 完了！
- `downloads/ユーザー名/` フォルダに保存
- ファイル名：`username_20250804143052_1.jpg`

## ⚙️ 便利な設定

### 自動ダウンロード
- 「自動ダウンロード」にチェック
- URL入力後、自動で分析・ダウンロード

### 保存先変更
- 「設定」タブ → 「📁選択」
- 好きなフォルダを指定

### 並列ダウンロード
- 「設定」タブ → 「同時ダウンロード数」
- 1-5の範囲で調整（推奨：3）

## 🎨 テーマ切り替え

- 左下の「🌙」ボタンをクリック
- ダークテーマ ⇄ ライトテーマ

## ⌨️ キーボードショートカット

- **Ctrl + Enter** : URL解析
- **Ctrl + D** : ダウンロード開始
- **Ctrl + A** : 全選択
- **F5** : 再解析

## 🐛 トラブルシューティング

### 起動しない場合
```bash
# 依存関係を再インストール
npm install

# 手動起動
npm start
```

### メディアが見つからない場合
- URLが正しいか確認
- ツイートが削除されていないか確認
- 時間をおいて再試行

### ダウンロードが失敗する場合
- インターネット接続を確認
- ウイルス対策ソフトの設定を確認
- 「設定」で同時ダウンロード数を下げる

## 🎉 完成！

これで **Twitter Media Downloader** が使えるようになりました！

### 📱 主な機能
- ✅ 高速並列ダウンロード
- ✅ 美しいダークテーマUI
- ✅ 自動ファイル命名
- ✅ フォルダ自動分類
- ✅ 進捗リアルタイム表示
- ✅ 履歴管理

### 🆘 サポート
- README.md で詳細な説明を確認
- GitHub Issues でバグ報告・機能要望

**楽しいTwitterメディア生活を！** 🚀✨