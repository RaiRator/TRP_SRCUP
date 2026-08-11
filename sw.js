// 랜덤 선곡 서비스 워커
// 앱 셸(HTML/아이콘/manifest)은 캐시 우선으로 오프라인에서도 열리게 하고,
// 구글 시트 CSV 요청은 항상 네트워크를 우선 시도한다(최신 곡 목록을 위해).
const CACHE_NAME = 'random-song-picker-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 구글 시트(외부 도메인) 요청은 서비스 워커가 가로채지 않고 그대로 통과시킨다.
  if (url.origin !== self.location.origin) {
    return;
  }

  // 같은 출처의 앱 셸 파일: 캐시 우선, 실패 시 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
