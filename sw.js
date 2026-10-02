// 앱 파일을 기기에 저장해 인터넷 없이도 열리게 합니다.
// 앱 내용을 고친 뒤에는 VERSION 숫자를 올려야 새 버전으로 바뀝니다.
const VERSION = "doyo-v5";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // 앱 파일: 저장본을 먼저 사용
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
    return;
  }
  // 글꼴: 한 번 받으면 저장해 두고, 없으면 기기 기본 글꼴 사용
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => new Response("", { status: 200, headers: { "Content-Type": "text/css" } })))
    );
  }
  // 그 밖(eBird 등)은 일반 인터넷 연결 사용
});
