const version = '%VERSION%';
const cacheName = version;

function logMessage() {
  console.log.apply(null, arguments);
}

function install() {
  const openCache = caches.open(cacheName);
  const network = fetch('/asset.js');
  return Promise.all([openCache, network]).then((results) => {
    results[0].put('/asset.js', results[1]);
  });
}

function respondAsset() {
  return caches.open(cacheName).then((cache) => {
    return cache.match('/asset.js').then((response) => {
      if (response) {
        return response;
      }
      throw new Error('cache miss');
    });
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(install().then(() => {
    logMessage('skipwaiting');
    self.skipWaiting();
  }));
});
self.addEventListener('activate', function(event) {
  logMessage('Version', version, 'activated');
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(event) {
  const path = new URL(event.request.url).pathname;
  if (path === '/asset.js') {
    event.respondWith(respondAsset());
  } else if (path === '/slow') {
    event.respondWith(new Promise((r) => {
      setTimeout(r, 10000);
    }).then(respondAsset));
  } else if (path === '/wait') {
    event.respondWith(respondAsset());
    event.waitUntil(new Promise((r) => {
      setTimeout(() => {
        logMessage('wait');
        r();
      }, 10000);
    }));
  } else if (path === '/settimeout') {
    event.respondWith(respondAsset());
    setTimeout(() => {
      logMessage('settimeout');
    }, 10000);
  }
});