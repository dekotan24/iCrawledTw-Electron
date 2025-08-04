# Twitter Media Downloader

🎯 **モダンで高機能なTwitterメディアダウンローダー**

美しいダークテーマのUIとGlassmorphismデザインを採用した、Electron製のTwitterメディアダウンローダーです。

## ✨ 特徴

- 🌙 **ダークテーマ & ライトテーマ** - 目に優しいモダンなデザイン
- 🎨 **Glassmorphism UI** - 半透明効果とブラー効果を活用した美しいインターface
- ⚡ **高速ダウンロード** - 並列ダウンロードによる高速処理
- 📱 **レスポンシブデザイン** - あらゆる画面サイズに対応
- 🔄 **自動リトライ** - ネットワークエラー時の自動再試行
- 📊 **リアルタイム進捗** - ダウンロード状況のリアルタイム表示
- 💾 **スマート命名** - `{username}_{timestamp}_{連番}.{拡張子}` 形式
- 📁 **自動フォルダ分類** - ユーザーごとの自動フォルダ作成
- 🎯 **メディアフィルター** - 画像のみ/動画のみの選択可能

## 🚀 クイックスタート

### 1. 前提条件

- [Node.js](https://nodejs.org/) v16以上
- [Git](https://git-scm.com/)

### 2. インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/twitter-media-downloader.git
cd twitter-media-downloader

# 依存関係をインストール
npm install

# 開発モードで起動
npm start
```

### 3. ビルド（配布用exeファイル作成）

```bash
# Windows用exeファイルを作成
npm run build

# 他のプラットフォーム用
npm run build:mac    # macOS用
npm run build:linux  # Linux用
```

ビルド後、`dist/`フォルダにインストーラーファイルが生成されます。

## 📖 使用方法

### 基本的な使い方

1. **アプリを起動**
2. **TwitterのURLを入力**
   - ツイートURL: `https://twitter.com/username/status/1234567890`
   - ユーザーURL: `https://twitter.com/username`
3. **「メディアを分析」をクリック**
4. **ダウンロードしたいメディアを選択**
5. **「選択項目をダウンロード」をクリック**

### 自動ダウンロード

「自動ダウンロード」にチェックを入れると、URL入力後に自動でメディアを分析・ダウンロードします。

### 設定のカスタマイズ

**設定タブ**で以下を調整できます：

- **保存先フォルダ** - ダウンロード先の変更
- **ファイル名形式** - 命名規則の選択
- **同時ダウンロード数** - パフォーマンス調整
- **画像品質** - オリジナル/大/中サイズ
- **メディアフィルター** - 画像のみ/動画のみ

## 🎨 UI プレビュー

### ダークテーマ（デフォルト）
- 深い紺色ベース (#0a0e1a)
- ネオンブルーアクセント (#3b82f6)
- Glassmorphism効果

### ライトテーマ
- クリーンな白ベース (#f8fafc)
- 同じアクセントカラー
- 読みやすさ重視

## 🛠️ 開発者向け

### プロジェクト構造

```
twitter-media-downloader/
├── main.js              # Electronメインプロセス
├── preload.js           # IPCブリッジ
├── renderer.js          # フロントエンドロジック
├── twitter-scraper.js   # メディア抽出エンジン
├── index.html           # メインUI
├── style.css            # スタイルシート
├── package.json         # プロジェクト設定
├── assets/              # アイコンとリソース
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
└── dist/                # ビルド出力（自動生成）
```

### 開発モードで起動

```bash
# デバッグ情報付きで起動
npm run dev

# または
electron . --dev
```

### デバッグ

開発モードではDeveloper Toolsが自動で開きます。

### カスタムビルド設定

`package.json`の`build`セクションで設定を変更できます：

```json
{
  "build": {
    "appId": "com.yourcompany.twitter-media-downloader",
    "productName": "Twitter Media Downloader",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}
```

## 📂 ファイル命名規則

ダウンロードされるファイルは以下の形式で命名されます：

```
{username}_{yyyyMMddHHmmss}_{連番}.{拡張子}

例:
- user123_20250804143052.jpg      （1つのメディア）
- user123_20250804143052_1.jpg    （複数メディアの1つ目）
- user123_20250804143052_2.mp4    （複数メディアの2つ目）
```

### フォルダ構造

```
Downloads/
├── user123/
│   ├── user123_20250804143052_1.jpg
│   └── user123_20250804143052_2.mp4
└── user456/
    └── user456_20250804150021.jpg
```

## ⚡ パフォーマンス

- **並列ダウンロード**: 最大5つまで同時ダウンロード
- **スマートリトライ**: ネットワークエラー時の自動再試行
- **メモリ効率**: ストリーミングダウンロードでメモリ使用量を最小化
- **キャッシュ機能**: 既存ファイルの重複ダウンロードを回避

## 🔧 トラブルシューティング

### よくある問題

**Q: アプリが起動しない**
```bash
# Node.jsのバージョンを確認
node --version  # v16以上必要

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

**Q: ダウンロードが失敗する**
- インターネット接続を確認
- TwitterのURLが正しいか確認
- ウイルス対策ソフトの設定を確認

**Q: メディアが見つからない**
- ツイートが削除されていないか確認
- 非公開アカウントの場合はアクセス権限を確認
- 時間をおいて再試行

### ログの確認

設定で「詳細ログを有効にする」をチェックすると、`logs/`フォルダにログファイルが作成されます。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎しています！

### 開発手順

1. **フォーク** - このリポジトリをフォーク
2. **ブランチ作成** - 新機能用のブランチを作成
3. **コミット** - 変更をコミット
4. **プッシュ** - フォークしたリポジトリにプッシュ
5. **プルリクエスト** - プルリクエストを作成

### コーディング規約

- ES6+ JavaScript使用
- セミコロン必須
- インデント: 2スペース
- コメントは日本語OK

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 🙏 謝辞

- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリ
- [Lucide](https://lucide.dev/) - 美しいアイコンセット
- [Axios](https://axios-http.com/) - HTTP クライアント
- [Cheerio](https://cheerio.js.org/) - サーバーサイドjQuery

## 📝 更新履歴

### v1.0.0 (2025-01-XX)
- 🎉 初回リリース
- ✨ モダンなGlassmorphism UI
- ⚡ 高速並列ダウンロード
- 🌙 ダーク/ライトテーマ対応
- 📁 自動フォルダ分類機能

---

**💡 ヒント**: Ctrl+Enter でURL解析、Ctrl+D でダウンロード開始、F5 で再解析ができます！
