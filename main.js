const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const TwitterScraper = require('./twitter-scraper');

let mainWindow;
let twitterScraper;
let settings = {
  downloadPath: path.join(__dirname, 'downloads'),
  darkMode: true,
  autoDownload: true,
  downloadFormat: 'original',
  maxConcurrentDownloads: 3,
  imageQuality: 'large',
  createSubfolders: true,
  enableLogging: false,
  skipExisting: true
};

// 設定ファイルのパス
const settingsPath = path.join(__dirname, 'settings.json');

// 設定を読み込み
async function loadSettings() {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    settings = { ...settings, ...JSON.parse(data) };
  } catch (error) {
    // 設定ファイルが存在しない場合はデフォルト値を使用
    await saveSettings();
  }
}

// 設定を保存
async function saveSettings() {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
  }
}

// メインウィンドウを作成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'hidden',
    frame: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    backgroundColor: '#0a0e1a'
  });

  mainWindow.loadFile('index.html');

  // ウィンドウが準備完了したら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 開発モードの場合はDevToolsを開く
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部リンクはデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// アプリケーションの準備完了
app.whenReady().then(async () => {
  await loadSettings();
  
  // TwitterScraperを初期化
  twitterScraper = new TwitterScraper();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC ハンドラー

// 設定を取得
ipcMain.handle('get-settings', () => {
  return settings;
});

// 設定を更新
ipcMain.handle('update-settings', async (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  await saveSettings();
  return settings;
});

// ダウンロードフォルダを選択
ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: settings.downloadPath
  });

  if (!result.canceled && result.filePaths.length > 0) {
    settings.downloadPath = result.filePaths[0];
    await saveSettings();
    return settings.downloadPath;
  }
  return null;
});

// ファイルをダウンロード
ipcMain.handle('download-file', async (event, { url, filepath, filename }) => {
  try {
    // ダウンロードフォルダを作成
    const fullPath = path.join(settings.downloadPath, filepath);
    await fs.mkdir(fullPath, { recursive: true });

    const filePath = path.join(fullPath, filename);
    
    // ファイルが既に存在する場合はスキップ
    if (settings.skipExisting) {
      try {
        await fs.access(filePath);
        return { success: true, message: 'ファイルは既に存在します', skipped: true };
      } catch {
        // ファイルが存在しない場合は続行
      }
    }

    // ダウンロード実行
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const writer = require('fs').createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve) => {
      writer.on('finish', () => {
        resolve({ 
          success: true, 
          message: 'ダウンロード完了', 
          path: filePath,
          size: response.headers['content-length']
        });
      });
      writer.on('error', (error) => {
        resolve({ 
          success: false, 
          message: `ダウンロードエラー: ${error.message}`,
          error: error.message
        });
      });
    });

  } catch (error) {
    return { 
      success: false, 
      message: `ダウンロードエラー: ${error.message}`,
      error: error.message
    };
  }
});

// ウィンドウ操作
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

// ダウンロードフォルダを開く
ipcMain.handle('open-download-folder', async () => {
  try {
    await shell.openPath(settings.downloadPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ログファイルに書き込み
ipcMain.handle('write-log', async (event, logData) => {
  try {
    const logPath = path.join(__dirname, 'logs');
    await fs.mkdir(logPath, { recursive: true });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = path.join(logPath, `download-${timestamp}.log`);
    
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(logData)}\n`;
    await fs.appendFile(logFile, logEntry);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// アプリケーション情報を取得
ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform
  };
});

// TwitterメディアエクストラクションのIPCハンドラー
ipcMain.handle('extract-twitter-media', async (event, { url, mediaType, imageQuality }) => {
  try {
    if (!twitterScraper) {
      twitterScraper = new TwitterScraper();
    }

    const mediaItems = await twitterScraper.extractMediaFromUrl(url, {
      mediaType: mediaType || 'all',
      imageQuality: imageQuality || 'large'
    });

    return {
      success: true,
      mediaItems: mediaItems
    };
  } catch (error) {
    console.error('Twitter メディア抽出エラー:', error);
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
});

// メディアファイルのサイズを取得
ipcMain.handle('get-media-size', async (event, url) => {
  try {
    if (!twitterScraper) {
      twitterScraper = new TwitterScraper();
    }

    const size = await twitterScraper.getMediaSize(url);
    return {
      success: true,
      size: size
    };
  } catch (error) {
    console.error('メディアサイズ取得エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
});