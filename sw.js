// Pokemon Ultimate Service Worker v12
// Two-layer cache: shell (always fast) + pokemon data (cache as you play)

var SHELL_CACHE = 'poke-shell-v12';
var POKE_CACHE  = 'poke-data-v12';

var SHELL_URLS = [
  '/Pokemon-Ultimate/',
  '/Pokemon-Ultimate/index.html',
  '/Pokemon-Ultimate/manifest.json',
  '/Pokemon-Ultimate/icon-192.png',
  '/Pokemon-Ultimate/icon-512.png',
  '/Pokemon-Ultimate/favicon.ico'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache) {
      return cache.addAll(SHELL_URLS);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== SHELL_CACHE && k !== POKE_CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // App shell - cache first, always instant
  if (url.indexOf('beutlerde.github.io/Pokemon-Ultimate') > -1 || 
      url.indexOf('icon-') > -1 || url.indexOf('manifest.json') > -1 || url.indexOf('favicon') > -1) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(resp) {
          caches.open(SHELL_CACHE).then(function(c) { c.put(event.request, resp.clone()); });
          return resp;
        });
      })
    );
    return;
  }

  // Pokemon images - network first, cache fallback (offline safe)
  if (url.indexOf('raw.githubusercontent.com') > -1) {
    event.respondWith(
      fetch(event.request).then(function(resp) {
        if (resp && resp.status === 200) {
          caches.open(POKE_CACHE).then(function(c) { c.put(event.request, resp.clone()); });
        }
        return resp;
      }).catch(function() { return caches.match(event.request); })
    );
    return;
  }

  // PokeAPI data - cache first (data never changes, loads instantly repeat visits)
  if (url.indexOf('pokeapi.co') > -1) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(resp) {
          if (resp && resp.status === 200) {
            caches.open(POKE_CACHE).then(function(c) { c.put(event.request, resp.clone()); });
          }
          return resp;
        }).catch(function() { return new Response('{}', {status:503}); });
      })
    );
    return;
  }

  // Google Fonts - cache first
  if (url.indexOf('fonts.google') > -1 || url.indexOf('fonts.gstatic') > -1) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(resp) {
          caches.open(SHELL_CACHE).then(function(c) { c.put(event.request, resp.clone()); });
          return resp;
        });
      })
    );
    return;
  }

  // Default
  event.respondWith(fetch(event.request).catch(function() { return caches.match(event.request); }));
});

// Cache stats for the home screen badge
self.addEventListener('message', function(event) {
  if (event.data === 'GET_CACHE_SIZE') {
    caches.open(POKE_CACHE).then(function(cache) {
      cache.keys().then(function(keys) {
        event.source.postMessage({type:'CACHE_SIZE', count:keys.length});
      });
    });
  }
});
