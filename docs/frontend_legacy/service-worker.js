const CACHE_NAME = 'acne-ai-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './js/scan_controller.js',
    './js/face_validator.js',
    './js/lighting_validator.js',
    './js/image_quality_validator.js',
    './js/scanner_overlay.js',
    './js/warning_manager.js',
    './public/models/tiny_face_detector_model-weights_manifest.json',
    './public/models/tiny_face_detector_model-shard1',
    './public/models/face_landmark_68_model-weights_manifest.json',
    './public/models/face_landmark_68_model-shard1',
    './public/models/face_expression_model-weights_manifest.json',
    './public/models/face_expression_model-shard1',
    './manifest.json',
    './icons/icon-512.svg'
];

// Install — cache all core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Cache new resources dynamically (like the face-api CDN)
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(() => {
            // Offline fallback
            return caches.match('./index.html');
        })
    );
});
