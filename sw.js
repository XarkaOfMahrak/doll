// the cache version gets updated every time there is a new deployment
const CACHE_VERSION = 10;
const CURRENT_CACHE = `doll-${CACHE_VERSION}`;

// these are the routes we are going to cache for offline support

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(CURRENT_CACHE);
    await cache.addAll(resources);
  };
  
  const putInCache = async (request, response) => {
    if (!/^https?:$/i.test(new URL(request.url).protocol)) return;
    const cache = await caches.open(CURRENT_CACHE);
    await cache.put(request, response);
  };
  
  const networkFirst = async ({ request, preloadResponsePromise }) => {
    console.log("Network First : " + request.url)

    // Pour commencer, on tente d'utiliser et de mettre en cache
    // la réponse préchargée si elle existe
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
      console.info("using preload response", preloadResponse);
      putInCache(request, preloadResponse.clone());
      return preloadResponse;
    }
  
    // Ensuite, on tente de l'obtenir du réseau
    try {
      const responseFromNetwork = await fetch(request);
      // Une réponse ne peut être utilisée qu'une fois
      // On la clone pour en mettre une copie en cache
      // et servir l'originale au navigateur
      putInCache(request, responseFromNetwork.clone());
      return responseFromNetwork;
    } catch (error) {
      // Si le réseau échoue on essaye le cache
            const responseFromCache = await caches.match(request);
            if (responseFromCache) {
            return responseFromCache;
            }
            else {
                //Si même le cache échoue on renvois une erreur
                return new Response("Network error happened", {
                    status: 408,
                    headers: { "Content-Type": "text/plain" },
                  });
            }

    }
  };


  const cacheFirst = async ({ request, preloadResponsePromise }) => {
    console.log("Cache First : " + request.url)
    // Pour commencer on essaie d'obtenir la ressource depuis le cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }
  
    // Ensuite, on tente d'utiliser et de mettre en cache
    // la réponse préchargée si elle existe
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
      console.info("using preload response", preloadResponse);
      putInCache(request, preloadResponse.clone());
      return preloadResponse;
    }
  
    // Ensuite, on tente de l'obtenir du réseau
    try {
      const responseFromNetwork = await fetch(request);
      // Une réponse ne peut être utilisée qu'une fois
      // On la clone pour en mettre une copie en cache
      // et servir l'originale au navigateur
      putInCache(request, responseFromNetwork.clone());
      return responseFromNetwork;
    } catch (error) {
      // Si le réseau échoue on doit tout de même renvoyer un objet Response
      return new Response("Network error happened", {
        status: 408,
        headers: { "Content-Type": "text/plain" },
      });
    }
  };
  
  // On active le préchargement à la navigation
  const enableNavigationPreload = async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  };

  const deleteCache = async (key) => {
    await caches.delete(key);
  };
  
  const deleteOldCaches = async () => {
    const cacheKeepList = [CURRENT_CACHE];
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
  };

  self.addEventListener("activate", (event) => {
    event.waitUntil(enableNavigationPreload());
    event.waitUntil(deleteOldCaches());
  });
  
  self.addEventListener("install", (event) => {
    event.waitUntil(
      addResourcesToCache([
        "/",
        "/index.html",
        "/var/css/bootstrap.min.css",
        "/var/css/local.css",
        "/var/js/bootstrap.bundle.min.js",
        "/var/js/functions.js",
        "/var/img/512-icon.png",
    ]),
    );
  });
  
  self.addEventListener("fetch", (event) => {
    if (event.request.url.endsWith("phrases.txt")) {
        event.respondWith(
            networkFirst({
              request: event.request,
              preloadResponsePromise: event.preloadResponse,
            }),
          );
    } else {
        event.respondWith(
            cacheFirst({
              request: event.request,
              preloadResponsePromise: event.preloadResponse,
            }),
          );
    }

  });