/**
 * Service Worker for Cyberpunk Theme
 * Provides offline support and caching
 */

const CACHE_NAME = 'cyberpunk-v1';
const STATIC_CACHE = 'cyberpunk-static-v1';
const IMAGE_CACHE = 'cyberpunk-images-v1';
const PAGES_CACHE = 'cyberpunk-pages-v1';

// 需要预缓存的核心资源
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/assets/css/cyberpunk-theme.css',
  '/assets/js/cyberpunk-theme.js',
  '/manifest.json'
];

// 安装事件 - 预缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Pre-cache complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Pre-cache failed:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除不在白名单中的缓存
            if (![STATIC_CACHE, IMAGE_CACHE, PAGES_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// 获取请求的策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过跨域请求
  if (url.origin !== self.location.origin) return;

  // 针对不同资源类型使用不同策略

  // 1. CSS/JS 文件 - 缓存优先，后台更新
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. 图片 - 缓存优先，带过期
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000)); // 7天
    return;
  }

  // 3. 字体 - 缓存优先
  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4. 页面 - 网络优先，失败时返回缓存或离线页面
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // 5. 其他请求 - 网络优先
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // 后台更新缓存
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});

    return cached;
  }

  // 缓存未命中，从网络获取
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// 缓存优先带过期策略
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // 检查缓存是否过期
    const cachedDate = cached.headers.get('sw-cache-date');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      if (age < maxAge) {
        return cached;
      }
    } else {
      return cached;
    }
  }

  // 从网络获取
  try {
    const response = await fetch(request);
    if (response.ok) {
      // 添加缓存日期头
      const headers = new Headers(response.headers);
      headers.set('sw-cache-date', Date.now().toString());

      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse.clone());
      return modifiedResponse;
    }
    return response;
  } catch (error) {
    // 网络失败，返回过期缓存（如果有）
    if (cached) {
      console.log('[SW] Returning expired cache for:', request.url);
      return cached;
    }
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 缓存响应
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // 服务器返回错误，尝试缓存
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，尝试缓存
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }

    // 页面请求失败，返回离线页面
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interactions') {
    event.waitUntil(syncInteractions());
  }
});

// 模拟同步互动数据
async function syncInteractions() {
  console.log('[SW] Syncing interactions...');
  // 这里可以实现与服务器同步点赞、收藏等数据
}

// 推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/icon-72x72.png',
    data: data.url,
    actions: [
      { action: 'open', title: '查看' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// 消息处理（来自页面）
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
