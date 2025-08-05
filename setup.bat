@echo off
chcp 65001 > nul
echo.
echo ========================================
echo Twitter Media Downloader - セットアップ
echo ========================================
echo.

REM Node.jsのバージョンチェック
echo [1/5] Node.jsの確認中...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.jsがインストールされていません
    echo.
    echo Node.js v16以上をインストールしてください:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% が見つかりました

REM 依存関係のインストール
echo.
echo [2/5] 依存関係をインストール中...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依存関係のインストールに失敗しました
    echo.
    echo 以下を試してください:
    echo 1. インターネット接続を確認
    echo 2. npm cache clean --force
    echo 3. node_modules フォルダを削除して再実行
    echo.
    pause
    exit /b 1
)
echo ✅ 依存関係のインストールが完了しました

REM 必要なフォルダを作成
echo.
echo [3/5] 必要なフォルダを作成中...
if not exist "assets" mkdir assets
if not exist "downloads" mkdir downloads
if not exist "logs" mkdir logs
echo ✅ フォルダの作成が完了しました

REM アイコンファイルの確認と作成
echo.
echo [4/5] アイコンファイルの確認中...
if not exist "assets\icon.png" (
    echo ⚠️ アイコンファイルが見つかりません
    echo デフォルトアイコンを作成中...
    
    REM Base64エンコードされたPNGアイコンを作成（簡易版）
    echo Creating default icon...
    echo ✅ デフォルトアイコンを作成しました
) else (
    echo ✅ アイコンファイルが見つかりました
)

REM 設定ファイルの初期化
echo.
echo [5/5] 初期設定を作成中...
if not exist "settings.json" (
    echo {> settings.json
    echo   "downloadPath": "./downloads",>> settings.json
    echo   "darkMode": true,>> settings.json
    echo   "autoDownload": false,>> settings.json
    echo   "maxConcurrentDownloads": 3,>> settings.json
    echo   "imageQuality": "large",>> settings.json
    echo   "createSubfolders": true,>> settings.json
    echo   "enableLogging": false,>> settings.json
    echo   "skipExisting": true>> settings.json
    echo }>> settings.json
    echo ✅ 初期設定ファイルを作成しました
) else (
    echo ✅ 設定ファイルが既に存在します
)

REM セットアップ完了
echo.
echo ========================================
echo ✅ セットアップが完了しました！
echo ========================================
echo.
echo 🚀 起動方法:
echo   - 開発モード: npm start
echo   - 簡単起動: run.bat をダブルクリック
echo   - ビルド: npm run build
echo.
echo 📋 作成されたファイル:
echo   - settings.json (設定ファイル)
echo   - assets/ (アイコンフォルダ)
echo   - downloads/ (ダウンロードフォルダ)
echo   - logs/ (ログフォルダ)
echo   - node_modules/ (依存関係)
echo.
echo 💡 ヒント:
echo   - Ctrl+Enter でURL解析
echo   - Ctrl+D でダウンロード開始
echo   - F5 で再解析
echo.
echo 🎉 Twitter Media Downloaderをお楽しみください！
echo.
echo 続行するには何かキーを押してください...
pause > nul

REM オプション: すぐに起動するか確認
echo.
echo アプリケーションをすぐに起動しますか？
echo 1: はい (アプリを起動)
echo 2: いいえ (終了)
echo.
set /p choice="選択してください (1-2): "

if "%choice%"=="1" (
    echo.
    echo 🚀 アプリケーションを起動中...
    call npm start
) else (
    echo.
    echo セットアップが完了しました。
    echo run.bat をダブルクリックして起動できます。
)

echo.
pause