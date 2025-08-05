// Application State
let currentSettings = {};
let downloadHistory = [];
let currentMediaItems = [];
let downloadQueue = [];
let isDownloading = false;

// DOM Elements
const elements = {
  // Tab Navigation
  navItems: document.querySelectorAll('.nav-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Window Controls
  minimizeBtn: document.getElementById('minimize-btn'),
  maximizeBtn: document.getElementById('maximize-btn'),
  closeBtn: document.getElementById('close-btn'),
  
  // Theme Toggle
  themeToggle: document.getElementById('theme-toggle'),
  
  // Download Tab
  twitterUrl: document.getElementById('twitter-url'),
  pasteBtn: document.getElementById('paste-btn'),
  autoDownload: document.getElementById('auto-download'),
  mediaType: document.getElementById('media-type'),
  analyzeBtn: document.getElementById('analyze-btn'),
  resultsContainer: document.getElementById('results-container'),
  mediaGrid: document.getElementById('media-grid'),
  selectAllBtn: document.getElementById('select-all-btn'),
  downloadSelectedBtn: document.getElementById('download-selected-btn'),
  progressContainer: document.getElementById('progress-container'),
  progressFill: document.getElementById('progress-fill'),
  progressStats: document.getElementById('progress-stats'),
  progressLogs: document.getElementById('progress-logs'),
  
  // Settings Tab
  downloadPath: document.getElementById('download-path'),
  selectFolderBtn: document.getElementById('select-folder-btn'),
  createSubfolders: document.getElementById('create-subfolders'),
  concurrentDownloads: document.getElementById('concurrent-downloads'),
  enableLogs: document.getElementById('enable-logs'),
  imageQuality: document.getElementById('image-quality'),
  skipExisting: document.getElementById('skip-existing'),
  resetSettingsBtn: document.getElementById('reset-settings-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  
  // About Tab
  appInfo: document.getElementById('app-info'),
  openDownloadFolderBtn: document.getElementById('open-download-folder-btn'),
  
  // UI Components
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.getElementById('loading-text'),
  toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
  await loadSettings();
  await loadAppInfo();
});

// Initialize Application
async function initializeApp() {
  // Set initial theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  
  showToast('success', 'アプリケーション起動', 'iCrawledTw-Electronが正常に起動しました');
}

// Setup Event Listeners
function setupEventListeners() {
  // Window Controls
  elements.minimizeBtn?.addEventListener('click', () => window.electronAPI.windowMinimize());
  elements.maximizeBtn?.addEventListener('click', () => window.electronAPI.windowMaximize());
  elements.closeBtn?.addEventListener('click', () => window.electronAPI.windowClose());
  
  // Theme Toggle
  elements.themeToggle?.addEventListener('click', toggleTheme);
  
  // Tab Navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });
  
  // Download Tab
  elements.pasteBtn?.addEventListener('click', pasteFromClipboard);
  elements.analyzeBtn?.addEventListener('click', analyzeTwitterUrl);
  elements.selectAllBtn?.addEventListener('click', selectAllMedia);
  elements.downloadSelectedBtn?.addEventListener('click', downloadSelectedMedia);
  
  // Settings Tab
  elements.selectFolderBtn?.addEventListener('click', selectDownloadFolder);
  elements.concurrentDownloads?.addEventListener('input', updateRangeValue);
  elements.saveSettingsBtn?.addEventListener('click', saveSettings);
  elements.resetSettingsBtn?.addEventListener('click', resetSettings);
  
  // About Tab
  elements.openDownloadFolderBtn?.addEventListener('click', () => window.electronAPI.openDownloadFolder());
  
  // URL Input
  elements.twitterUrl?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeTwitterUrl();
  });
  
  // Auto-analyze when URL is pasted
  elements.twitterUrl?.addEventListener('input', (e) => {
    const url = e.target.value;
    if (isValidTwitterUrl(url) && elements.autoDownload?.checked) {
      setTimeout(() => analyzeTwitterUrl(), 500);
    }
  });
}

// Tab Management
function switchTab(tabName) {
  // Update navigation
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });
  
  // Update content
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

// Theme Management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  
  const icon = elements.themeToggle.querySelector('i');
  icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
  lucide.createIcons();
  
  showToast('info', 'テーマ変更', `${newTheme === 'dark' ? 'ダーク' : 'ライト'}テーマに変更しました`);
}

// Settings Management
async function loadSettings() {
  try {
    currentSettings = await window.electronAPI.getSettings();
    applySettingsToUI();
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    showToast('error', '設定エラー', '設定の読み込みに失敗しました');
  }
}

function applySettingsToUI() {
  if (elements.downloadPath) elements.downloadPath.value = currentSettings.downloadPath || '';
  if (elements.createSubfolders) elements.createSubfolders.checked = currentSettings.createSubfolders || false;
  if (elements.concurrentDownloads) {
    elements.concurrentDownloads.value = currentSettings.maxConcurrentDownloads || 3;
    updateRangeValue();
  }
  if (elements.enableLogs) elements.enableLogs.checked = currentSettings.enableLogging || false;
  if (elements.imageQuality) elements.imageQuality.value = currentSettings.imageQuality || 'original';
  if (elements.skipExisting) elements.skipExisting.checked = currentSettings.skipExisting || true;
}

async function saveSettings() {
  try {
    const newSettings = {
      downloadPath: elements.downloadPath?.value,
      createSubfolders: elements.createSubfolders?.checked,
      maxConcurrentDownloads: parseInt(elements.concurrentDownloads?.value || 3),
      enableLogging: elements.enableLogs?.checked,
      imageQuality: elements.imageQuality?.value,
      skipExisting: elements.skipExisting?.checked
    };
    
    currentSettings = await window.electronAPI.updateSettings(newSettings);
    showToast('success', '設定保存', '設定が正常に保存されました');
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    showToast('error', '設定エラー', '設定の保存に失敗しました');
  }
}

async function resetSettings() {
  if (confirm('設定をデフォルトに戻しますか？この操作は元に戻せません。')) {
    try {
      const defaultSettings = {
        downloadPath: './downloads',
        createSubfolders: true,
        maxConcurrentDownloads: 3,
        enableLogging: false,
        imageQuality: 'original',
        skipExisting: true
      };
      
      currentSettings = await window.electronAPI.updateSettings(defaultSettings);
      applySettingsToUI();
      showToast('success', '設定リセット', '設定がデフォルトに戻されました');
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
      showToast('error', '設定エラー', '設定のリセットに失敗しました');
    }
  }
}

async function selectDownloadFolder() {
  try {
    const folderPath = await window.electronAPI.selectDownloadFolder();
    if (folderPath) {
      elements.downloadPath.value = folderPath;
      showToast('success', 'フォルダ選択', 'ダウンロードフォルダが設定されました');
    }
  } catch (error) {
    console.error('フォルダ選択に失敗しました:', error);
    showToast('error', 'フォルダエラー', 'フォルダの選択に失敗しました');
  }
}

function updateRangeValue() {
  const rangeInput = elements.concurrentDownloads;
  const valueDisplay = document.querySelector('.range-value');
  if (rangeInput && valueDisplay) {
    valueDisplay.textContent = rangeInput.value;
  }
}

// App Info Management
async function loadAppInfo() {
  try {
    const appInfo = await window.electronAPI.getAppInfo();
    displayAppInfo(appInfo);
  } catch (error) {
    console.error('アプリ情報の取得に失敗しました:', error);
  }
}

function displayAppInfo(appInfo) {
  if (!elements.appInfo) return;
  
  elements.appInfo.innerHTML = `
    <div class="info-item">
      <span class="info-label">バージョン</span>
      <span class="info-value">${appInfo.version}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Electron</span>
      <span class="info-value">${appInfo.electronVersion}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Node.js</span>
      <span class="info-value">${appInfo.nodeVersion}</span>
    </div>
    <div class="info-item">
      <span class="info-label">プラットフォーム</span>
      <span class="info-value">${appInfo.platform}</span>
    </div>
  `;
}

// Clipboard Management
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (elements.twitterUrl) {
      elements.twitterUrl.value = text;
      if (isValidTwitterUrl(text)) {
        showToast('success', 'URL貼り付け', 'TwitterのURLが貼り付けられました');
        if (elements.autoDownload?.checked) {
          setTimeout(() => analyzeTwitterUrl(), 500);
        }
      } else {
        showToast('warning', 'URL警告', '有効なTwitterのURLではありません');
      }
    }
  } catch (error) {
    console.error('クリップボードからの貼り付けに失敗しました:', error);
    showToast('error', 'クリップボードエラー', 'クリップボードからの貼り付けに失敗しました');
  }
}

// URL Validation
function isValidTwitterUrl(url) {
  const twitterRegex = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/(status\/\d+|media)?/i;
  return twitterRegex.test(url);
}

// Twitter URL Analysis
async function analyzeTwitterUrl() {
  const url = elements.twitterUrl?.value.trim();
  
  if (!url) {
    showToast('warning', 'URL警告', 'TwitterのURLを入力してください');
    return;
  }
  
  if (!isValidTwitterUrl(url)) {
    showToast('error', 'URL エラー', '有効なTwitterのURLを入力してください');
    return;
  }
  
  showLoading('Twitterページを解析中...');
  
  try {
    // TwitterページからメディアURLを抽出
    const mediaItems = await extractMediaFromTwitterUrl(url);
    
    if (mediaItems.length === 0) {
      hideLoading();
      showToast('warning', '解析結果', 'メディアが見つかりませんでした');
      return;
    }
    
    currentMediaItems = mediaItems;
    displayMediaResults(mediaItems);
    hideLoading();
    
    showToast('success', '解析完了', `${mediaItems.length}個のメディアが見つかりました`);
    
    // 自動ダウンロードが有効な場合
    if (elements.autoDownload?.checked) {
      setTimeout(() => downloadAllMedia(), 1000);
    }
  } catch (error) {
    hideLoading();
    console.error('URL解析に失敗しました:', error);
    showToast('error', '解析エラー', 'Twitterページの解析に失敗しました');
  }
}

// Media Extraction - TwitterScraperを使用した実装
async function extractMediaFromTwitterUrl(url) {
  try {
    showLoading('Twitterページにアクセス中...');
    
    // メインプロセスにTwitterスクレイピングを依頼
    const result = await window.electronAPI.extractTwitterMedia({
      url: url,
      mediaType: elements.mediaType?.value || 'all',
      imageQuality: currentSettings.imageQuality || 'large'
    });
    
    if (!result.success) {
      throw new Error(result.error || 'メディアの抽出に失敗しました');
    }
    
    // 抽出されたメディアアイテムを処理
    const mediaItems = result.mediaItems.map((item, index) => ({
      id: `${item.tweetId}_${index}`,
      type: item.type,
      url: item.url,
      thumbnail: item.type === 'image' ? 
        `${item.url.split('?')[0]}?name=small` : 
        `${item.url.split('?')[0]}?name=small`,
      filename: item.filename,
      size: item.size || 'Unknown',
      selected: true,
      tweetId: item.tweetId,
      username: item.username
    }));
    
    // メディアサイズを非同期で取得
    setTimeout(async () => {
      for (const item of mediaItems) {
        try {
          const sizeResult = await window.electronAPI.getMediaSize(item.url);
          if (sizeResult.success) {
            item.size = sizeResult.size;
            // UIを更新
            const element = document.querySelector(`.media-item[data-id="${item.id}"] .media-size`);
            if (element) {
              element.textContent = sizeResult.size;
            }
          }
        } catch (error) {
          console.error('サイズ取得エラー:', error);
        }
      }
    }, 1000);
    
    return mediaItems;
  } catch (error) {
    console.error('メディア抽出エラー:', error);
    throw error;
  }
}

// Media Results Display
function displayMediaResults(mediaItems) {
  if (!elements.mediaGrid || !elements.resultsContainer) return;
  
  elements.mediaGrid.innerHTML = '';
  
  mediaItems.forEach(item => {
    const mediaElement = createMediaElement(item);
    elements.mediaGrid.appendChild(mediaElement);
  });
  
  elements.resultsContainer.style.display = 'block';
  elements.resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function createMediaElement(item) {
  const div = document.createElement('div');
  div.className = `media-item ${item.selected ? 'selected' : ''}`;
  div.dataset.id = item.id;
  
  div.innerHTML = `
    <img src="${item.thumbnail}" alt="Media preview" class="media-preview" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'">
    <div class="media-info">
      <span class="media-type">${item.type === 'image' ? '画像' : '動画'}</span>
      <div class="media-size">${item.size}</div>
    </div>
  `;
  
  div.addEventListener('click', () => toggleMediaSelection(item.id));
  
  return div;
}

function toggleMediaSelection(itemId) {
  const item = currentMediaItems.find(m => m.id === itemId);
  if (item) {
    item.selected = !item.selected;
    const element = document.querySelector(`.media-item[data-id="${itemId}"]`);
    if (element) {
      element.classList.toggle('selected', item.selected);
    }
  }
}

function selectAllMedia() {
  currentMediaItems.forEach(item => {
    item.selected = true;
  });
  
  document.querySelectorAll('.media-item').forEach(element => {
    element.classList.add('selected');
  });
  
  showToast('info', '全選択', 'すべてのメディアが選択されました');
}

// Download Management
async function downloadSelectedMedia() {
  const selectedItems = currentMediaItems.filter(item => item.selected);
  
  if (selectedItems.length === 0) {
    showToast('warning', 'ダウンロード警告', 'ダウンロードするメディアを選択してください');
    return;
  }
  
  await downloadMediaItems(selectedItems);
}

async function downloadAllMedia() {
  await downloadMediaItems(currentMediaItems);
}

async function downloadMediaItems(items) {
  if (isDownloading) {
    showToast('warning', 'ダウンロード中', '既にダウンロード処理が実行中です');
    return;
  }
  
  isDownloading = true;
  downloadQueue = [...items];
  
  showProgressContainer();
  updateProgress(0, items.length);
  
  let completed = 0;
  let failed = 0;
  
  // 並列ダウンロード処理
  const concurrentDownloads = Math.min(currentSettings.maxConcurrentDownloads || 3, items.length);
  const downloadPromises = [];
  
  for (let i = 0; i < concurrentDownloads; i++) {
    downloadPromises.push(processDownloadQueue());
  }
  
  try {
    await Promise.all(downloadPromises);
    
    hideProgressContainer();
    isDownloading = false;
    
    const successCount = items.length - failed;
    showToast('success', 'ダウンロード完了', `${successCount}個のファイルをダウンロードしました`);
    
    // 履歴に追加
    addToHistory(items, successCount, failed);
    
  } catch (error) {
    hideProgressContainer();
    isDownloading = false;
    console.error('ダウンロードエラー:', error);
    showToast('error', 'ダウンロードエラー', 'ダウンロード処理中にエラーが発生しました');
  }
  
  async function processDownloadQueue() {
    while (downloadQueue.length > 0) {
      const item = downloadQueue.shift();
      if (!item) break;
      
      try {
        addLogEntry(`ダウンロード開始: ${item.filename}`, 'info');
        
        const result = await window.electronAPI.downloadFile({
          url: item.url,
          filepath: currentSettings.createSubfolders ? extractUsername(elements.twitterUrl.value) : '',
          filename: item.filename
        });
        
        if (result.success) {
          if (result.skipped) {
            addLogEntry(`スキップ: ${item.filename} (既存)`, 'warning');
          } else {
            addLogEntry(`完了: ${item.filename}`, 'success');
          }
          completed++;
        } else {
          addLogEntry(`エラー: ${item.filename} - ${result.message}`, 'error');
          failed++;
        }
        
        updateProgress(completed + failed, items.length);
        
      } catch (error) {
        addLogEntry(`エラー: ${item.filename} - ${error.message}`, 'error');
        failed++;
        updateProgress(completed + failed, items.length);
      }
    }
  }
}

function extractUsername(url) {
  try {
    const urlParts = url.split('/');
    return urlParts[urlParts.findIndex(part => part === 'twitter.com' || part === 'x.com') + 1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Progress Management
function showProgressContainer() {
  if (elements.progressContainer) {
    elements.progressContainer.style.display = 'block';
    elements.progressContainer.scrollIntoView({ behavior: 'smooth' });
  }
  if (elements.progressLogs) {
    elements.progressLogs.innerHTML = '';
  }
}

function hideProgressContainer() {
  if (elements.progressContainer) {
    setTimeout(() => {
      elements.progressContainer.style.display = 'none';
    }, 2000);
  }
}

function updateProgress(completed, total) {
  if (elements.progressFill) {
    const percentage = (completed / total) * 100;
    elements.progressFill.style.width = `${percentage}%`;
  }
  
  if (elements.progressStats) {
    elements.progressStats.textContent = `${completed}/${total} 完了`;
  }
}

function addLogEntry(message, type = 'info') {
  if (!elements.progressLogs) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  
  elements.progressLogs.appendChild(logEntry);
  elements.progressLogs.scrollTop = elements.progressLogs.scrollHeight;
  
  // ログを保存（設定で有効な場合）
  if (currentSettings.enableLogging) {
    window.electronAPI.writeLog({
      timestamp: new Date().toISOString(),
      message: message,
      type: type
    });
  }
}

// History Management
function addToHistory(items, successCount, failedCount) {
  const historyEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    url: elements.twitterUrl?.value || '',
    totalItems: items.length,
    successCount: successCount,
    failedCount: failedCount,
    items: items.map(item => ({
      filename: item.filename,
      type: item.type,
      size: item.size
    }))
  };
  
  downloadHistory.unshift(historyEntry);
  
  // 履歴を最大100件に制限
  if (downloadHistory.length > 100) {
    downloadHistory = downloadHistory.slice(0, 100);
  }
  
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;
  
  if (downloadHistory.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="history"></i>
        <h3>まだ履歴がありません</h3>
        <p>メディアをダウンロードすると、ここに履歴が表示されます</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  historyList.innerHTML = downloadHistory.map(entry => `
    <div class="glass-card history-entry">
      <div class="history-header">
        <h4>${new Date(entry.timestamp).toLocaleString()}</h4>
        <span class="history-stats">${entry.successCount}成功 / ${entry.failedCount}失敗</span>
      </div>
      <div class="history-url">${entry.url}</div>
      <div class="history-details">
        ${entry.items.map(item => `
          <div class="history-item">
            <span class="item-type">${item.type === 'image' ? '📷' : '🎥'}</span>
            <span class="item-filename">${item.filename}</span>
            <span class="item-size">${item.size}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Utility Functions
function showLoading(text = '処理中...') {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'flex';
  }
  if (elements.loadingText) {
    elements.loadingText.textContent = text;
  }
}

function hideLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'none';
  }
}

function showToast(type, title, message, duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };
  
  toast.innerHTML = `
    <div class="toast-content">
      <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
      <div class="toast-message">
        <div class="toast-title">${title}</div>
        <div class="toast-description">${message}</div>
      </div>
    </div>
  `;
  
  elements.toastContainer.appendChild(toast);
  lucide.createIcons();
  
  // 自動削除
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Enter: Analyze URL
  if (e.ctrlKey && e.key === 'Enter') {
    analyzeTwitterUrl();
  }
  
  // Ctrl+D: Download selected
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    downloadSelectedMedia();
  }
  
  // Ctrl+A: Select all (when in results)
  if (e.ctrlKey && e.key === 'a' && currentMediaItems.length > 0) {
    e.preventDefault();
    selectAllMedia();
  }
  
  // F5: Refresh/Re-analyze
  if (e.key === 'F5') {
    e.preventDefault();
    analyzeTwitterUrl();
  }
});

// Error Handling
window.addEventListener('error', (e) => {
  console.error('アプリケーションエラー:', e.error);
  showToast('error', 'アプリケーションエラー', 'エラーが発生しました。詳細はコンソールを確認してください。');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('未処理のPromise拒否:', e.reason);
  showToast('error', 'システムエラー', '予期しないエラーが発生しました。');
});