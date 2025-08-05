@echo off
chcp 65001 > nul
title Twitter Media Downloader

echo.
echo 🚀 Twitter Media Downloader を起動中...
echo.

REM Node.jsの確認
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.jsが見つかりません
    echo.
    echo まずセットアップを実行してください:
    echo 1. setup.bat をダブルクリック
    echo 2. または https://nodejs.org/ からNode.jsをインストール
    echo.
    pause
    exit /b 1
)

REM プロジェクトファイルの確認
if not exist "package.json" (
    echo ❌ package.json が見つかりません
    echo.
    echo 正しいフォルダで実行していることを確認してください。
    echo 必要なファイル:
    echo - package.json
    echo - main.js
    echo - index.html
    echo.
    pause
    exit /b 1
)

REM node_modulesの確認
if not exist "node_modules" (
    echo 📦 初回起動: 依存関係をインストール中...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ インストールに失敗しました
        echo.
        echo setup.bat を実行してください
        echo.
        pause
        exit /b 1
    )
    echo ✅ インストール完了
    echo.
)

REM 設定ファイルの確認
if not exist "settings.json" (
    echo ⚙️ 初期設定ファイルを作成中...
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
    echo ✅ 設定ファイルを作成しました
    echo.
)

REM 必要なフォルダを作成
if not exist "downloads" mkdir downloads
if not exist "logs" mkdir logs
if not exist "assets" mkdir assets

REM アプリケーションを起動
echo ✅ 起動準備完了
echo.
echo 📱 アプリケーションを起動しています...
echo    ウィンドウが表示されるまでお待ちください
echo.
echo 💡 使い方:
echo    1. TwitterのURLをコピー
echo    2. アプリに貼り付け
echo    3. 「メディアを分析」をクリック
echo    4. 欲しいメディアを選択してダウンロード
echo.
echo 🎯 キーボードショートカット:
echo    Ctrl+Enter : URL解析
echo    Ctrl+D     : ダウンロード開始  
echo    Ctrl+A     : 全選択
echo    F5         : 再解析
echo.

REM Electronアプリを起動
call npm start

REM 終了時の処理
echo.
echo アプリケーションが終了しました
echo.
echo 🔄 再起動する場合:
echo    run.bat をもう一度ダブルクリック
echo.
echo 🛠️ 問題が発生した場合:
echo    setup.bat を実行して再セットアップ
echo.
echo ❓ サポート:
echo    README.md を確認してください
echo.

pause