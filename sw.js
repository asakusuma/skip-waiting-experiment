const version = '%VERSION%';
const cacheName = version;

function logMessage(msg) {
  return self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(msg);
    });
  });
}

function install() {
  const openCache = caches.open(cacheName);
  const network = fetch('/asset.js');
  return Promise.all([openCache, network]).then((results) => {
    results[0].put('/asset.js', results[1]);
  });
}

function respondFromCache() {
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
    logMessage('skipwaiting', event);
    self.skipWaiting();
  }));
});

self.addEventListener('activate', function(event) {
  logMessage(`Version ${version} activated`, event);
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  const path = new URL(event.request.url).pathname;
  if (path === '/asset.js') {
    event.respondWith(respondFromCache());
  } else if (path === '/slow') {
    // Wait 10 seconds before responding
    event.respondWith(new Promise((resolve) => {
      setTimeout(() => {
        logMessage('responded to /slow').then(resolve);
      }, 10000);
    }).then(respondFromCache));
  } else if (path === '/wait') {
    // Respond immediately, but extend the request
    // for 10 seconds via waitUntil()
    event.respondWith(respondFromCache());
    event.waitUntil(new Promise((resolve) => {
      setTimeout(() => {
        logMessage('done waiting for /wait', event).then(resolve);
      }, 10000);
    }));
  } else if (path === '/settimeout') {
    // Respond immediately, but setup a setTimeout
    // for 10 seconds
    event.respondWith(respondFromCache());
    setTimeout(() => {
      logMessage('settimeout', event);
    }, 10000);
  }
});