const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスに安全なAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
  // 設定関連
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),

  // ファイル操作
  downloadFile: (data) => ipcRenderer.invoke('download-file', data),
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),

  // ウィンドウ操作
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // ログ
  writeLog: (logData) => ipcRenderer.invoke('write-log', logData),

  // アプリ情報
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Twitter関連API
  extractTwitterMedia: (data) => ipcRenderer.invoke('extract-twitter-media', data),
  getMediaSize: (url) => ipcRenderer.invoke('get-media-size', url),

  // イベントリスナー
  on: (channel, callback) => {
    const validChannels = ['download-progress', 'download-complete', 'log-message'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});