const axios = require('axios');
const cheerio = require('cheerio');

class TwitterScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.headers = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  // TwitterのURLからメディアURLを抽出
  async extractMediaFromUrl(twitterUrl, options = {}) {
    try {
      const { mediaType = 'all', imageQuality = 'large' } = options;
      
      // URLの正規化
      const normalizedUrl = this.normalizeTwitterUrl(twitterUrl);
      if (!normalizedUrl) {
        throw new Error('有効なTwitter URLではありません');
      }

      // ユーザー名とツイートIDを抽出
      const urlInfo = this.parseTwitterUrl(normalizedUrl);
      
      // ツイートページのHTMLを取得
      const html = await this.fetchTweetHtml(normalizedUrl);
      
      // HTMLからメディアURLを抽出
      const mediaItems = await this.extractMediaFromHtml(html, urlInfo, { mediaType, imageQuality });
      
      return mediaItems;
    } catch (error) {
      console.error('メディア抽出エラー:', error);
      throw error;
    }
  }

  // Twitter URLを正規化
  normalizeTwitterUrl(url) {
    try {
      // twitter.com を x.com に統一
      let normalizedUrl = url.replace('twitter.com', 'x.com');
      
      // HTTPSに統一
      if (!normalizedUrl.startsWith('https://')) {
        normalizedUrl = normalizedUrl.replace(/^https?:\/\//, 'https://');
      }
      
      // URLの検証
      const urlPattern = /^https:\/\/(x\.com|twitter\.com)\/\w+\/status\/\d+/i;
      if (!urlPattern.test(normalizedUrl)) {
        return null;
      }
      
      return normalizedUrl;
    } catch (error) {
      return null;
    }
  }

  // Twitter URLからユーザー名とツイートIDを解析
  parseTwitterUrl(url) {
    const urlParts = url.split('/');
    const domainIndex = urlParts.findIndex(part => part.includes('x.com') || part.includes('twitter.com'));
    
    if (domainIndex === -1) {
      throw new Error('無効なTwitter URLです');
    }

    const username = urlParts[domainIndex + 1];
    const statusIndex = urlParts.findIndex(part => part === 'status');
    const tweetId = statusIndex !== -1 ? urlParts[statusIndex + 1] : null;

    if (!username || !tweetId) {
      throw new Error('ユーザー名またはツイートIDが取得できません');
    }

    return {
      username,
      tweetId,
      originalUrl: url
    };
  }

  // ツイートページのHTMLを取得
  async fetchTweetHtml(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 30000,
        maxRedirects: 5
      });

      if (response.status !== 200) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ツイートの取得に失敗しました`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('インターネット接続を確認してください');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('リクエストがタイムアウトしました');
      }
      throw new Error(`ネットワークエラー: ${error.message}`);
    }
  }

  // HTMLからメディアURLを抽出
  async extractMediaFromHtml(html, urlInfo, options) {
    const { mediaType, imageQuality } = options;
    const $ = cheerio.load(html);
    const mediaItems = [];

    try {
      // メタデータからメディア情報を抽出
      const twitterCardData = this.extractTwitterCardData($);
      
      // Open Graphデータからメディア情報を抽出
      const ogData = this.extractOpenGraphData($);
      
      // JSON-LDデータからメディア情報を抽出
      const jsonLdData = this.extractJsonLdData($);
      
      // 画像の抽出
      if (mediaType === 'all' || mediaType === 'images') {
        const images = this.extractImages($, urlInfo, imageQuality, twitterCardData, ogData);
        mediaItems.push(...images);
      }

      // 動画の抽出
      if (mediaType === 'all' || mediaType === 'videos') {
        const videos = this.extractVideos($, urlInfo, twitterCardData, ogData, jsonLdData);
        mediaItems.push(...videos);
      }

      // GIFの抽出
      if (mediaType === 'all' || mediaType === 'videos') {
        const gifs = this.extractGifs($, urlInfo, twitterCardData, ogData);
        mediaItems.push(...gifs);
      }

      // 重複を除去
      const uniqueMediaItems = this.removeDuplicateMedia(mediaItems);
      
      // ファイル名を生成
      const itemsWithFilenames = this.generateFilenames(uniqueMediaItems, urlInfo);

      return itemsWithFilenames;
    } catch (error) {
      console.error('HTML解析エラー:', error);
      throw new Error('メディアデータの解析に失敗しました');
    }
  }

  // Twitter Cardデータを抽出
  extractTwitterCardData($) {
    const cardData = {};
    
    $('meta[name^="twitter:"]').each((i, elem) => {
      const name = $(elem).attr('name').replace('twitter:', '');
      const content = $(elem).attr('content');
      if (content) {
        cardData[name] = content;
      }
    });

    return cardData;
  }

  // Open Graphデータを抽出
  extractOpenGraphData($) {
    const ogData = {};
    
    $('meta[property^="og:"]').each((i, elem) => {
      const property = $(elem).attr('property').replace('og:', '');
      const content = $(elem).attr('content');
      if (content) {
        ogData[property] = content;
      }
    });

    return ogData;
  }

  // JSON-LDデータを抽出
  extractJsonLdData($) {
    const jsonLdData = {};
    
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        Object.assign(jsonLdData, data);
      } catch (error) {
        // JSON解析エラーは無視
      }
    });

    return jsonLdData;
  }

  // 画像を抽出
  extractImages($, urlInfo, imageQuality, twitterCardData, ogData) {
    const images = [];
    const seenUrls = new Set();

    // Twitter Cardから画像を抽出
    if (twitterCardData.image) {
      const imageUrl = this.enhanceImageQuality(twitterCardData.image, imageQuality);
      if (!seenUrls.has(imageUrl)) {
        images.push({
          type: 'image',
          url: imageUrl,
          originalUrl: twitterCardData.image,
          source: 'twitter:image'
        });
        seenUrls.add(imageUrl);
      }
    }

    // Open Graphから画像を抽出
    if (ogData.image) {
      const imageUrl = this.enhanceImageQuality(ogData.image, imageQuality);
      if (!seenUrls.has(imageUrl)) {
        images.push({
          type: 'image',
          url: imageUrl,
          originalUrl: ogData.image,
          source: 'og:image'
        });
        seenUrls.add(imageUrl);
      }
    }

    // HTMLから画像タグを抽出
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && this.isTwitterMediaUrl(src)) {
        const imageUrl = this.enhanceImageQuality(src, imageQuality);
        if (!seenUrls.has(imageUrl)) {
          images.push({
            type: 'image',
            url: imageUrl,
            originalUrl: src,
            source: 'img_tag',
            alt: $(elem).attr('alt') || ''
          });
          seenUrls.add(imageUrl);
        }
      }
    });

    return images;
  }

  // 動画を抽出
  extractVideos($, urlInfo, twitterCardData, ogData, jsonLdData) {
    const videos = [];
    const seenUrls = new Set();

    // Twitter Cardから動画を抽出
    if (twitterCardData.player) {
      if (!seenUrls.has(twitterCardData.player)) {
        videos.push({
          type: 'video',
          url: twitterCardData.player,
          source: 'twitter:player',
          width: twitterCardData.player_width,
          height: twitterCardData.player_height
        });
        seenUrls.add(twitterCardData.player);
      }
    }

    // Open Graphから動画を抽出
    if (ogData.video) {
      if (!seenUrls.has(ogData.video)) {
        videos.push({
          type: 'video',
          url: ogData.video,
          source: 'og:video',
          width: ogData.video_width,
          height: ogData.video_height
        });
        seenUrls.add(ogData.video);
      }
    }

    // HTMLから動画タグを抽出
    $('video').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && this.isTwitterMediaUrl(src)) {
        if (!seenUrls.has(src)) {
          videos.push({
            type: 'video',
            url: src,
            source: 'video_tag',
            poster: $(elem).attr('poster') || ''
          });
          seenUrls.add(src);
        }
      }

      // source要素も確認
      $(elem).find('source').each((j, sourceElem) => {
        const srcUrl = $(sourceElem).attr('src');
        if (srcUrl && this.isTwitterMediaUrl(srcUrl)) {
          if (!seenUrls.has(srcUrl)) {
            videos.push({
              type: 'video',
              url: srcUrl,
              source: 'source_tag',
              mimeType: $(sourceElem).attr('type') || ''
            });
            seenUrls.add(srcUrl);
          }
        }
      });
    });

    return videos;
  }

  // GIFを抽出
  extractGifs($, urlInfo, twitterCardData, ogData) {
    const gifs = [];
    const seenUrls = new Set();

    // Twitter CardのGIF
    if (twitterCardData.image && twitterCardData.image.includes('.gif')) {
      if (!seenUrls.has(twitterCardData.image)) {
        gifs.push({
          type: 'gif',
          url: twitterCardData.image,
          source: 'twitter:image'
        });
        seenUrls.add(twitterCardData.image);
      }
    }

    // HTMLからGIF画像を抽出
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && (src.includes('.gif') || src.includes('tweet_video_thumb'))) {
        if (this.isTwitterMediaUrl(src) && !seenUrls.has(src)) {
          gifs.push({
            type: 'gif',
            url: src,
            source: 'img_tag',
            alt: $(elem).attr('alt') || ''
          });
          seenUrls.add(src);
        }
      }
    });

    return gifs;
  }

  // 画像品質を向上
  enhanceImageQuality(imageUrl, quality = 'large') {
    if (!imageUrl.includes('pbs.twimg.com')) {
      return imageUrl;
    }

    // 既存のnameパラメータを削除
    let enhancedUrl = imageUrl.replace(/[?&]name=[^&]*/g, '');
    
    // 新しい品質パラメータを追加
    const separator = enhancedUrl.includes('?') ? '&' : '?';
    return `${enhancedUrl}${separator}name=${quality}`;
  }

  // TwitterメディアURLかどうかを判定
  isTwitterMediaUrl(url) {
    return url.includes('pbs.twimg.com') || 
           url.includes('video.twimg.com') || 
           url.includes('abs.twimg.com');
  }

  // 重複メディアを除去
  removeDuplicateMedia(mediaItems) {
    const seen = new Set();
    return mediaItems.filter(item => {
      const key = `${item.type}:${item.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // ファイル名を生成
  generateFilenames(mediaItems, urlInfo) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '');
    
    return mediaItems.map((item, index) => {
      const extension = this.getFileExtension(item.url, item.type);
      const indexSuffix = mediaItems.length > 1 ? `_${index + 1}` : '';
      
      return {
        ...item,
        filename: `${urlInfo.username}_${timestamp}${indexSuffix}${extension}`,
        tweetId: urlInfo.tweetId,
        username: urlInfo.username,
        timestamp: timestamp,
        size: 'Unknown', // サイズは実際のダウンロード時に取得
        selected: true
      };
    });
  }

  // ファイル拡張子を取得
  getFileExtension(url, type) {
    // URLから拡張子を抽出
    const urlPath = url.split('?')[0];
    const extension = urlPath.substring(urlPath.lastIndexOf('.'));
    
    if (extension && extension.length <= 5) {
      return extension;
    }

    // タイプに基づいてデフォルト拡張子を設定
    switch (type) {
      case 'image':
        return '.jpg';
      case 'video':
        return '.mp4';
      case 'gif':
        return '.gif';
      default:
        return '.media';
    }
  }

  // 動画の実際のURLを取得（blob URLの場合）
  async extractVideoUrl(playerUrl) {
    try {
      // プレイヤーページを取得
      const response = await axios.get(playerUrl, {
        headers: this.headers,
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const videoUrls = [];

      // 様々な方法で動画URLを探す
      $('video source, video').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && (src.includes('video.twimg.com') || src.includes('.mp4') || src.includes('.m3u8'))) {
          videoUrls.push(src);
        }
      });

      // JavaScriptからURLを抽出（簡略版）
      const scriptTags = $('script').toArray();
      for (const script of scriptTags) {
        const content = $(script).html();
        if (content) {
          const videoUrlMatch = content.match(/https:\/\/video\.twimg\.com\/[^"']+\.(mp4|m3u8)/g);
          if (videoUrlMatch) {
            videoUrls.push(...videoUrlMatch);
          }
        }
      }

      // 最も適切な動画URLを選択（mp4を優先）
      const mp4Url = videoUrls.find(url => url.includes('.mp4'));
      return mp4Url || videoUrls[0] || playerUrl;

    } catch (error) {
      console.error('動画URL抽出エラー:', error);
      return playerUrl;
    }
  }

  // メディアファイルのサイズを取得
  async getMediaSize(url) {
    try {
      const response = await axios.head(url, {
        headers: this.headers,
        timeout: 10000
      });

      const contentLength = response.headers['content-length'];
      if (contentLength) {
        return this.formatFileSize(parseInt(contentLength));
      }
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  // ファイルサイズをフォーマット
  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${size} ${sizes[i]}`;
  }

  // エラー情報を詳細化
  createDetailedError(error, context) {
    return {
      message: error.message,
      context: context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };
  }
}

module.exports = TwitterScraper;