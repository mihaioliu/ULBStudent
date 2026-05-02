/**
 * Caching Strategy for API calls and data
 */

export class CacheManager {
  constructor(maxSize = 50 * 1024 * 1024) {
    // 50MB default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  /**
   * Generate cache key from URL and params
   */
  _generateKey(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return `${url}${queryString ? '?' + queryString : ''}`;
  }

  /**
   * Get from cache
   */
  get(url, params = {}, maxAge = null) {
    const key = this._generateKey(url, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (maxAge && Date.now() - cached.timestamp > maxAge) {
      this.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  set(url, data, params = {}) {
    const key = this._generateKey(url, params);
    const size = this._estimateSize(data);

    if (size > this.maxSize) {
      console.warn('Data too large to cache:', size);
      return false;
    }

    // Make room if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });

    this.currentSize += size;
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    const cached = this.cache.get(key);
    if (cached) {
      this.currentSize -= cached.size;
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Estimate size of data
   */
  _estimateSize(data) {
    return JSON.stringify(data).length * 2; // rough estimate
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      entries: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      percentage: (this.currentSize / this.maxSize) * 100
    };
  }
}

/**
 * Global cache instance
 */
export const globalCache = new CacheManager();

/**
 * Cached fetch wrapper
 */
export async function cachedFetch(url, options = {}) {
  const cacheKey = options.cacheKey || url;
  const maxAge = options.maxAge || 5 * 60 * 1000; // 5 min default

  // Try cache first
  let cached = globalCache.get(cacheKey, {}, maxAge);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    globalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
