const CACHE_NAME = 'swarify-cache-v3'; // Renamed to v3 to force a new cache update
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/utility.css',
  '/script.js',
  '/oc.js',
  '/fav.svg',
  '/swarify.svg',
  '/logo2.svg',
  '/home.svg',
  '/search.svg',
  '/hamburger.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  'https://fonts.gstatic.com',
  'https://sdk.scdn.co/spotify-player.js',
  'https://accounts.google.com/gsi/client',
  'https://www.youtube.com/iframe_api',
  'https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Check if the request is for a dynamic URL from your backend API
  const isApiRequest = event.request.url.startsWith('https://music-site-backend.onrender.com/api/');

  if (isApiRequest) {
    // For API requests, use a "cache-first, then network" strategy
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        // Try to fetch from the network first
        return fetch(event.request).then(response => {
          // If the network is successful, cache the new response and return it
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => {
          // If the network fails (user is offline), return the cached response
          console.log('API request failed, serving from cache:', event.request.url);
          return caches.match(event.request);
        });
      })
    );
  } else {
    // For all other requests (static assets), use the "cache-first" strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          const fetchRequest = event.request.clone();

          return fetch(fetchRequest)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Advanced Features: Push Notifications and Background Synchronization
// (This section is unchanged as it was already correct)

self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  const payload = event.data ? event.data.json() : {
    title: 'New Swarify Message',
    body: 'You have a new message from Swarify!',
    icon: '/fav.svg',
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: '/fav.svg', // A small icon shown on some platforms
      actions: [
        {
          action: 'open_app',
          title: 'Open App'
        }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith('http') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  if (event.tag === 'send-data-to-backend') {
    event.waitUntil(
      console.log('Performing background sync task for sending data...')
    );
  }
});
