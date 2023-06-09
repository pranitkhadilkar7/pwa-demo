const CACHE_STATIC_NAME = 'static-v10'
const CACHE_DYNAMIC_NAME = 'dynamic-v5'
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then((cache) => {
      cache.keys()
        .then((keys) => {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems))
          }
        })
    })
}

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App shell')
        cache.addAll(STATIC_FILES)
        // cache.add('/')
        // cache.add('/index.html')
        // cache.add('/src/js/app.js')
      })
  )
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache', key)
            return caches.delete(key)
          }
        }))
      })
  )
  return self.clients.claim('');
});

function isInArray(string, array) {
  for (let i = 0; i < array.length; i++) {
    if (string === array[i]) {
      return true
    }
  }
  return false
}

self.addEventListener('fetch', (event) => {
  const url = 'https://httpbin.org/get'
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then((cache) => {
          return fetch(event.request)
            .then((res) => {
              trimCache(CACHE_DYNAMIC_NAME, 20)
              cache.put(event.request, res.clone())
              return res
            })
        })
    )
  } 
  else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );   
  } 
  else {
    event.respondWith(
      caches.match(event.request)
        .then((res) => {
          if (res) {
            return res
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(cache => {
                    trimCache(CACHE_DYNAMIC_NAME, 20)
                    cache.put(event.request.url, res.clone())
                    return res
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                  .then(cache => {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html')
                    }
                  })
              })
          }
        })
    );
  }
})

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then((res) => {
//         if (res) {
//           return res
//         } else {
//           return fetch(event.request)
//             .then(res => {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(cache => {
//                   cache.put(event.request.url, res.clone())
//                   return res
//                 })
//             })
//             .catch(err => {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(cache => {
//                   return cache.match('/offline.html')
//                 })
//             })
//         }
//       })
//   );
// });

// Cache network first approach
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     fetch(event.request)
//     .then((res) => {
//       return caches.open(CACHE_DYNAMIC_NAME)
//         .then((cache) => {
//           cache.put(event.request.url, res.clone())
//           return res
//         })
//     })
//       .catch((err) => {
//         return caches.match(event.request)
//       })
//   )
// })


// Cache only strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });